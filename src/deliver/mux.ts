import { promises as fs } from "node:fs";
import path from "node:path";
import { log } from "../util/log.js";
import { Workspace } from "../workspace.js";

/**
 * Pluggable publish target. Mirrors the timeline-backend pattern: the engine
 * does not hardcode where finished videos go. A target takes a local MP4 and
 * returns a hosted playback reference the LMS can point at.
 */
export interface PublishTarget {
  readonly name: string;
  publish(file: string, opts?: PublishRunOptions): Promise<PublishOutcome>;
}

export interface PublishRunOptions {
  pollIntervalMs?: number;
  timeoutMs?: number;
}

export interface PublishOutcome {
  target: string;
  assetId: string | null;
  playbackId: string | null;
  /** The reference the LMS stores in `lessons.video_url`. */
  videoUrl: string | null;
  status: string;
}

// ── Mux REST primitives (pure, unit-tested) ─────────────────────────────────

export const MUX_API = "https://api.mux.com";

/** HTTP Basic auth header for the Mux API from a token id/secret pair. */
export function muxAuthHeader(tokenId: string, tokenSecret: string): string {
  if (!tokenId || !tokenSecret) throw new Error("Mux requires MUX_TOKEN_ID and MUX_TOKEN_SECRET");
  return "Basic " + Buffer.from(`${tokenId}:${tokenSecret}`, "utf8").toString("base64");
}

/** Body for POST /video/v1/uploads (Direct Upload), public playback. */
export function buildCreateUploadBody(corsOrigin = "*"): Record<string, unknown> {
  return {
    cors_origin: corsOrigin,
    new_asset_settings: { playback_policy: ["public"], video_quality: "basic" },
  };
}

function dataEnvelope(parsed: unknown): Record<string, unknown> {
  if (typeof parsed !== "object" || parsed === null || !("data" in parsed)) {
    throw new Error("unexpected Mux response: missing `data`");
  }
  const data = (parsed as { data: unknown }).data;
  if (typeof data !== "object" || data === null) throw new Error("unexpected Mux response: `data` is not an object");
  return data as Record<string, unknown>;
}

export interface UploadCreated {
  uploadId: string;
  uploadUrl: string;
  status: string;
}

/** Parse POST /video/v1/uploads → upload id + the presigned PUT url. */
export function parseUploadCreate(parsed: unknown): UploadCreated {
  const d = dataEnvelope(parsed);
  const uploadId = d["id"];
  const uploadUrl = d["url"];
  if (typeof uploadId !== "string" || typeof uploadUrl !== "string") {
    throw new Error("Mux upload-create response missing id/url");
  }
  return { uploadId, uploadUrl, status: typeof d["status"] === "string" ? (d["status"] as string) : "unknown" };
}

export interface UploadStatus {
  status: string;
  assetId: string | null;
}

/** Parse GET /video/v1/uploads/:id → status + asset id once the asset is created. */
export function parseUploadStatus(parsed: unknown): UploadStatus {
  const d = dataEnvelope(parsed);
  const status = typeof d["status"] === "string" ? (d["status"] as string) : "unknown";
  const assetId = typeof d["asset_id"] === "string" ? (d["asset_id"] as string) : null;
  if (status === "errored") {
    throw new Error(`Mux upload errored: ${JSON.stringify(d["error"] ?? "unknown")}`);
  }
  return { status, assetId };
}

export interface AssetStatus {
  status: string;
  playbackId: string | null;
  durationSeconds: number | null;
}

/** Parse GET /video/v1/assets/:id → status + the public playback id when ready. */
export function parseAsset(parsed: unknown): AssetStatus {
  const d = dataEnvelope(parsed);
  const status = typeof d["status"] === "string" ? (d["status"] as string) : "unknown";
  if (status === "errored") {
    throw new Error(`Mux asset errored: ${JSON.stringify(d["errors"] ?? "unknown")}`);
  }
  let playbackId: string | null = null;
  const ids = d["playback_ids"];
  if (Array.isArray(ids) && ids.length > 0) {
    const first = ids[0];
    if (typeof first === "object" && first !== null && typeof (first as { id?: unknown }).id === "string") {
      playbackId = (first as { id: string }).id;
    }
  }
  const duration = d["duration"];
  return { status, playbackId, durationSeconds: typeof duration === "number" ? duration : null };
}

// ── HTTP boundary (the only thing tests mock) ───────────────────────────────

export interface HttpReply {
  ok: boolean;
  status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}
export type FetchLike = (
  url: string,
  init: { method: string; headers?: Record<string, string>; body?: Uint8Array | string },
) => Promise<HttpReply>;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Upload a local MP4 to Mux via Direct Upload and wait for the asset to be ready. */
export class MuxPublishTarget implements PublishTarget {
  readonly name = "mux";
  private readonly auth: string;
  private readonly http: FetchLike;
  private readonly readFile: (p: string) => Promise<Uint8Array>;

  constructor(opts: {
    tokenId: string;
    tokenSecret: string;
    fetchLike?: FetchLike;
    readFile?: (p: string) => Promise<Uint8Array>;
  }) {
    this.auth = muxAuthHeader(opts.tokenId, opts.tokenSecret);
    this.http = opts.fetchLike ?? (globalThis.fetch as unknown as FetchLike);
    this.readFile = opts.readFile ?? ((p) => fs.readFile(p));
  }

  private async getJson(url: string): Promise<unknown> {
    const res = await this.http(url, { method: "GET", headers: { authorization: this.auth } });
    if (!res.ok) throw new Error(`Mux GET ${url} → ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return res.json();
  }

  async publish(file: string, opts: PublishRunOptions = {}): Promise<PublishOutcome> {
    const pollIntervalMs = opts.pollIntervalMs ?? 3000;
    const timeoutMs = opts.timeoutMs ?? 10 * 60 * 1000;

    log.step("mux", `creating direct upload for ${path.basename(file)}`);
    const createRes = await this.http(`${MUX_API}/video/v1/uploads`, {
      method: "POST",
      headers: { authorization: this.auth, "content-type": "application/json" },
      body: JSON.stringify(buildCreateUploadBody()),
    });
    if (!createRes.ok) throw new Error(`Mux create-upload → ${createRes.status}: ${(await createRes.text()).slice(0, 300)}`);
    const created = parseUploadCreate(await createRes.json());

    log.info("mux", "uploading file bytes to presigned url");
    const bytes = await this.readFile(file);
    const putRes = await this.http(created.uploadUrl, {
      method: "PUT",
      headers: { "content-type": "video/mp4" },
      body: bytes,
    });
    if (!putRes.ok) throw new Error(`Mux PUT upload → ${putRes.status}: ${(await putRes.text()).slice(0, 300)}`);

    const deadline = Date.now() + timeoutMs;
    let assetId: string | null = null;
    while (!assetId) {
      if (Date.now() > deadline) throw new Error("Mux upload did not produce an asset before timeout");
      const us = parseUploadStatus(await this.getJson(`${MUX_API}/video/v1/uploads/${created.uploadId}`));
      assetId = us.assetId;
      if (!assetId) await sleep(pollIntervalMs);
    }
    log.info("mux", `asset created: ${assetId}`);

    while (true) {
      if (Date.now() > deadline) throw new Error("Mux asset did not become ready before timeout");
      const asset = parseAsset(await this.getJson(`${MUX_API}/video/v1/assets/${assetId}`));
      if (asset.status === "ready" && asset.playbackId) {
        log.ok("mux", `asset ready: playback ${asset.playbackId}`);
        return {
          target: this.name,
          assetId,
          playbackId: asset.playbackId,
          videoUrl: `mux:${asset.playbackId}`,
          status: "ready",
        };
      }
      await sleep(pollIntervalMs);
    }
  }
}

// ── High-level workflow step ─────────────────────────────────────────────────

export type PublishTargetName = "dryrun" | "mux";

export interface PublishOptions {
  target?: PublishTargetName;
  file?: string;
  pollIntervalMs?: number;
  timeoutMs?: number;
}

export interface PublishResult extends PublishOutcome {
  lessonId: string;
  file: string;
  sizeBytes: number;
  dryRun: boolean;
  receiptPath: string;
}

export function choosePublishTarget(opt?: PublishTargetName): PublishTargetName {
  if (opt) return opt;
  return process.env.PALMIER_PUBLISH_TARGET === "mux" ? "mux" : "dryrun";
}

/**
 * Publish a lesson's finished video to a hosting target. SAFE BY DEFAULT: with
 * no target configured this is a dry run that uploads nothing and only writes a
 * receipt describing what would happen. Real upload requires `target: "mux"`
 * (or PALMIER_PUBLISH_TARGET=mux) plus MUX_TOKEN_ID / MUX_TOKEN_SECRET.
 */
export async function publishLesson(lessonId: string, opts: PublishOptions = {}): Promise<PublishResult> {
  const ws = Workspace.for(lessonId);
  const file = opts.file ?? ws.exportPath;
  if (!(await ws.exists(file))) {
    throw new Error(`no exported video at ${file} — run \`palmier export ${lessonId}\` first`);
  }
  const { size } = await fs.stat(file);
  const target = choosePublishTarget(opts.target);
  await fs.mkdir(ws.lmsDir, { recursive: true });

  let outcome: PublishOutcome;
  let dryRun: boolean;
  if (target === "mux") {
    const tokenId = process.env.MUX_TOKEN_ID ?? "";
    const tokenSecret = process.env.MUX_TOKEN_SECRET ?? "";
    const mux = new MuxPublishTarget({ tokenId, tokenSecret });
    outcome = await mux.publish(file, { pollIntervalMs: opts.pollIntervalMs, timeoutMs: opts.timeoutMs });
    dryRun = false;
  } else {
    log.warn("publish", `dry run — not uploading. Pass --target mux (or PALMIER_PUBLISH_TARGET=mux) to publish for real.`);
    outcome = { target: "dryrun", assetId: null, playbackId: null, videoUrl: null, status: "dry-run" };
    dryRun = true;
  }

  const result: PublishResult = { lessonId, file, sizeBytes: size, dryRun, receiptPath: ws.publishReceiptPath, ...outcome };
  await fs.writeFile(ws.publishReceiptPath, JSON.stringify(result, null, 2) + "\n", "utf8");
  return result;
}
