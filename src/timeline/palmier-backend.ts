import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { log } from "../util/log.js";
import type { Workspace } from "../workspace.js";
import type { AssembleResult, ClearOptions, ClearResult, TimelineBackend, TimelinePlan, TrackName } from "./backend.js";

const SCOPE = "palmier";

/**
 * Place tracks bottom→top: slides are the base video layer, recordings overlay
 * them (a DO segment's screen capture sits above its slide), and voiceover is the
 * audio layer. Palmier's `add_clips` inserts each new video track on top, so
 * emitting the groups in this order yields exactly this stacking.
 */
const TRACK_ORDER: readonly TrackName[] = ["Slides", "Recordings", "Voiceover"];

/**
 * Real Palmier Pro MCP tool names, with substring fallbacks + env overrides
 * (PALMIER_TOOL_IMPORT / _ADD / _STATE / _REMOVE) as an escape hatch if a future
 * Palmier build renames them.
 */
const TOOL_CANDIDATES = {
  import: ["import_media", "import", "add_media"],
  add: ["add_clips", "add_clip", "add_to_timeline", "place_clip"],
  state: ["get_timeline", "read_timeline", "timeline_state"],
  remove: ["remove_clips", "delete_clips", "remove_clip"],
  listMedia: ["get_media", "list_media"],
  deleteMedia: ["delete_media", "remove_media"],
} as const;

/** A single placement, in PROJECT frames, ready to hand to `add_clips`. */
export interface ClipEntry {
  mediaPath: string;
  mediaName: string;
  startFrame: number;
  durationFrames: number;
}

export interface TrackEntries {
  track: TrackName;
  entries: ClipEntry[];
}

/**
 * Pure placement math, exported for unit testing. Converts the seconds-based
 * {@link TimelinePlan} into per-track `add_clips` entries in PROJECT frames:
 *   - clips are grouped by track in {@link TRACK_ORDER} (stacking order),
 *   - silent holds (no `mediaPath`) are dropped,
 *   - empty tracks are omitted so we never create a blank track,
 *   - `startFrame = round(start*fps)`, `durationFrames = max(1, round(duration*fps))`.
 */
export function planToTrackEntries(plan: TimelinePlan, fps: number): TrackEntries[] {
  const out: TrackEntries[] = [];
  for (const track of TRACK_ORDER) {
    const entries: ClipEntry[] = [];
    for (const c of plan.clips) {
      if (c.track !== track || !c.mediaPath) continue;
      entries.push({
        mediaPath: c.mediaPath,
        mediaName: `${plan.lessonId}-${c.segId}-${c.kind}`,
        startFrame: Math.max(0, Math.round(c.start * fps)),
        durationFrames: Math.max(1, Math.round(c.duration * fps)),
      });
    }
    if (entries.length) out.push({ track, entries });
  }
  return out;
}

/**
 * Collect every clip id on the timeline, across all tracks. Palmier clips expose
 * `id` (older builds: `clipId`); entries without either are skipped. Exported so
 * the reset/clean path is unit-testable without a live MCP. Pure.
 */
export function collectClipIds(state: TlState): string[] {
  const ids: string[] = [];
  for (const t of state.tracks ?? []) {
    for (const c of t.clips ?? []) {
      const id = c.id ?? c.clipId;
      if (id) ids.push(id);
    }
  }
  return ids;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function asArray(v: unknown): unknown[] | undefined {
  return Array.isArray(v) ? v : undefined;
}
function pickString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/**
 * Extract media/asset ids from a Palmier `get_media` response. The live API
 * returns `{ entries: [{ id, ... }] }`; we also accept `{ media }`, `{ items }`,
 * or a bare array, read `id` | `mediaId` | `assetId`, and skip entries without
 * one. Accepts the raw JSON text or an already-parsed value; non-JSON text or an
 * unexpected shape yields `[]`. Exported for testing. Pure.
 */
export function extractMediaIds(raw: unknown): string[] {
  let val: unknown = raw;
  if (typeof val === "string") {
    try {
      val = JSON.parse(val);
    } catch {
      return [];
    }
  }
  const list =
    asArray(val) ??
    (isRecord(val) ? asArray(val.entries) ?? asArray(val.media) ?? asArray(val.items) : undefined) ??
    [];
  const ids: string[] = [];
  for (const item of list) {
    if (!isRecord(item)) continue;
    const id = pickString(item.id) ?? pickString(item.mediaId) ?? pickString(item.assetId);
    if (id) ids.push(id);
  }
  return ids;
}

interface ToolContent {
  type: string;
  text?: string;
}
interface ToolResult {
  content?: ToolContent[];
  isError?: boolean;
}
interface TlClip {
  id?: string;
  clipId?: string;
  startFrame?: number;
  start?: number;
}
interface TlTrack {
  type?: string;
  clips?: TlClip[];
}
interface TlState {
  fps?: number;
  tracks?: TlTrack[];
}

export interface PalmierBackendOptions {
  url?: string;
}

export class PalmierBackend implements TimelineBackend {
  readonly name = "palmier";
  private readonly url: string;
  private client?: Client;
  private toolNames: string[] = [];

  constructor(opts: PalmierBackendOptions = {}) {
    this.url = opts.url ?? process.env.PALMIER_MCP_URL ?? "http://127.0.0.1:19789/mcp";
  }

  private async connect(): Promise<Client> {
    if (this.client) return this.client;
    const client = new Client({ name: "hgdw-palmier", version: "0.1.0" }, { capabilities: {} });
    const transport = new StreamableHTTPClientTransport(new URL(this.url));
    try {
      await client.connect(transport);
    } catch (err) {
      throw new Error(
        `Could not reach Palmier Pro MCP at ${this.url}. ` +
          `Open Palmier Pro with a project loaded (it only serves the MCP while a project is open). ` +
          `Cause: ${(err as Error).message}`,
      );
    }
    const { tools } = await client.listTools();
    this.toolNames = tools.map((t) => t.name);
    log.info(SCOPE, `connected; ${tools.length} tools`);
    this.client = client;
    return client;
  }

  private resolveTool(kind: keyof typeof TOOL_CANDIDATES): string {
    const override = process.env[`PALMIER_TOOL_${kind.toUpperCase()}`];
    if (override) return override;
    for (const cand of TOOL_CANDIDATES[kind]) {
      const exact = this.toolNames.find((n) => n === cand);
      if (exact) return exact;
      const sub = this.toolNames.find((n) => n.toLowerCase().includes(cand));
      if (sub) return sub;
    }
    throw new Error(
      `No Palmier MCP tool matched "${kind}". Available: ${this.toolNames.join(", ") || "(none)"}. ` +
        `Set PALMIER_TOOL_${kind.toUpperCase()} to the correct tool name.`,
    );
  }

  private async call(name: string, args: Record<string, unknown>): Promise<string> {
    const client = await this.connect();
    const res = (await client.callTool({ name, arguments: args })) as unknown as ToolResult;
    const text = (res.content ?? []).map((c) => c.text ?? "").join("\n");
    if (res.isError) {
      throw new Error(`Palmier tool ${name} failed: ${text || "(no detail)"}`);
    }
    return text;
  }

  private async state(): Promise<TlState> {
    const text = await this.call(this.resolveTool("state"), {});
    try {
      return JSON.parse(text) as TlState;
    } catch {
      return {};
    }
  }

  private async projectFps(): Promise<number> {
    const { fps } = await this.state();
    return typeof fps === "number" && fps > 0 ? fps : 30;
  }

  private async clipCount(): Promise<number> {
    const { tracks } = await this.state();
    return (tracks ?? []).reduce((n, t) => n + (t.clips?.length ?? 0), 0);
  }

  /** Import a local file into the project library and return its media id. */
  private async importMedia(path: string, name: string): Promise<string> {
    const text = await this.call(this.resolveTool("import"), { source: { path }, name });
    const id = text.match(/id:\s*([0-9A-Za-z-]{8,})/)?.[1];
    if (!id) throw new Error(`import_media returned no id for ${path}: ${text}`);
    return id;
  }

  async assemble(plan: TimelinePlan, _ws: Workspace): Promise<AssembleResult> {
    await this.connect();
    const fps = await this.projectFps();
    const addTool = this.resolveTool("add");
    const groups = planToTrackEntries(plan, fps);
    let count = 0;
    for (const { track, entries } of groups) {
      const built: { mediaRef: string; startFrame: number; durationFrames: number }[] = [];
      for (const e of entries) {
        const mediaRef = await this.importMedia(e.mediaPath, e.mediaName);
        built.push({ mediaRef, startFrame: e.startFrame, durationFrames: e.durationFrames });
      }
      // One add_clips call per group, trackIndex omitted → Palmier creates a
      // dedicated track for the group (video tracks stack on top of earlier ones).
      await this.call(addTool, { entries: built });
      count += built.length;
      log.ok(SCOPE, `placed ${built.length} clip(s) on a ${track} track`);
    }
    const total = await this.clipCount();
    log.ok(SCOPE, `Palmier timeline now holds ${total} clip(s) at ${fps}fps`);
    return {
      backend: this.name,
      clipCount: count,
      notes: [`${total} clips on the Palmier timeline at ${fps}fps`],
    };
  }

  /**
   * Reset the live Palmier project: remove every clip from the timeline (Palmier
   * also prunes the now-empty tracks) and, when `media` is set, delete every
   * imported asset from the project bin. Makes re-loading idempotent and lets an
   * operator reset between takes/lessons without hand-written scripts.
   * `delete_media` takes `assetIds` (not `clipIds`/`mediaIds`).
   */
  async clear(opts: ClearOptions = {}): Promise<ClearResult> {
    await this.connect();
    const clipIds = collectClipIds(await this.state());
    if (clipIds.length) await this.call(this.resolveTool("remove"), { clipIds });
    let deletedMedia = 0;
    if (opts.media) {
      const assetIds = extractMediaIds(await this.call(this.resolveTool("listMedia"), {}));
      if (assetIds.length) {
        await this.call(this.resolveTool("deleteMedia"), { assetIds });
        deletedMedia = assetIds.length;
      }
    }
    log.ok(
      SCOPE,
      `cleared timeline — removed ${clipIds.length} clip(s)` +
        (opts.media ? `, deleted ${deletedMedia} media asset(s)` : ""),
    );
    return { removedClips: clipIds.length, deletedMedia };
  }

  async swap(plan: TimelinePlan, segId: string, _ws: Workspace): Promise<void> {
    await this.connect();
    const fps = await this.projectFps();
    const targets = plan.clips.filter((c) => c.segId === segId && c.mediaPath);
    if (!targets.length) return;
    const addTool = this.resolveTool("add");
    const removeTool = this.resolveTool("remove");
    const { tracks = [] } = await this.state();
    for (const c of targets) {
      const startFrame = Math.max(0, Math.round(c.start * fps));
      const wantType = c.kind === "audio" ? "audio" : "video";
      const ids: string[] = [];
      for (const t of tracks) {
        if (t.type !== wantType) continue;
        for (const clip of t.clips ?? []) {
          const sf = clip.startFrame ?? clip.start ?? 0;
          const id = clip.id ?? clip.clipId;
          if (id && Math.abs(sf - startFrame) <= 1) ids.push(id);
        }
      }
      if (ids.length) await this.call(removeTool, { clipIds: ids });
      const mediaRef = await this.importMedia(c.mediaPath!, `${plan.lessonId}-${segId}-${c.kind}`);
      await this.call(addTool, {
        entries: [{ mediaRef, startFrame, durationFrames: Math.max(1, Math.round(c.duration * fps)) }],
      });
      log.ok(SCOPE, `swapped ${c.track}/${segId}`);
    }
  }

  async close(): Promise<void> {
    await this.client?.close().catch(() => {});
    this.client = undefined;
  }
}
