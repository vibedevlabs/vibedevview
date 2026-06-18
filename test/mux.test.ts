import { describe, expect, it } from "vitest";
import {
  muxAuthHeader,
  buildCreateUploadBody,
  parseUploadCreate,
  parseUploadStatus,
  parseAsset,
  choosePublishTarget,
  MuxPublishTarget,
  type FetchLike,
  type HttpReply,
} from "../src/deliver/mux.js";

/**
 * Contracts under test:
 *
 * muxAuthHeader(id, secret): "Basic " + base64("id:secret"); throws if either is empty.
 * buildCreateUploadBody(): public-playback Direct Upload body.
 * parseUploadCreate/Status/Asset: pull fields out of Mux's {data:{...}} envelope; throw on
 *   the documented error states and on a missing envelope.
 * choosePublishTarget(opt?): opt wins; else PALMIER_PUBLISH_TARGET==="mux" → "mux", else "dryrun".
 * MuxPublishTarget.publish(): POST upload → PUT bytes → poll upload until asset_id → poll asset
 *   until status==="ready" with a playback id, returning videoUrl `mux:<id>`. Surfaces HTTP errors.
 */

const ok = (body: unknown): HttpReply => ({
  ok: true,
  status: 200,
  text: async () => JSON.stringify(body),
  json: async () => body,
});
const fail = (status: number, text = "boom"): HttpReply => ({
  ok: false,
  status,
  text: async () => text,
  json: async () => ({}),
});

describe("muxAuthHeader", () => {
  it("builds a Basic header from base64(id:secret)", () => {
    expect(muxAuthHeader("id", "secret")).toBe("Basic " + Buffer.from("id:secret").toString("base64"));
  });
  it("throws when either credential is empty", () => {
    expect(() => muxAuthHeader("", "secret")).toThrow(/MUX_TOKEN_ID/);
    expect(() => muxAuthHeader("id", "")).toThrow(/MUX_TOKEN/);
  });
});

describe("buildCreateUploadBody", () => {
  it("requests public playback and basic quality", () => {
    expect(buildCreateUploadBody()).toEqual({
      cors_origin: "*",
      new_asset_settings: { playback_policy: ["public"], video_quality: "basic" },
    });
  });
  it("honors a custom cors origin", () => {
    expect(buildCreateUploadBody("https://app.dev").cors_origin).toBe("https://app.dev");
  });
});

describe("parseUploadCreate", () => {
  it("extracts the upload id, presigned url and status", () => {
    expect(parseUploadCreate({ data: { id: "up1", url: "https://put.here", status: "waiting" } })).toEqual({
      uploadId: "up1",
      uploadUrl: "https://put.here",
      status: "waiting",
    });
  });
  it("throws when id/url are missing", () => {
    expect(() => parseUploadCreate({ data: { id: "up1" } })).toThrow(/missing id\/url/);
  });
  it("throws when the data envelope is absent", () => {
    expect(() => parseUploadCreate({ id: "up1", url: "u" })).toThrow(/missing `data`/);
  });
});

describe("parseUploadStatus", () => {
  it("returns null asset id while still waiting", () => {
    expect(parseUploadStatus({ data: { status: "waiting" } })).toEqual({ status: "waiting", assetId: null });
  });
  it("returns the asset id once the asset is created", () => {
    expect(parseUploadStatus({ data: { status: "asset_created", asset_id: "as1" } })).toEqual({
      status: "asset_created",
      assetId: "as1",
    });
  });
  it("throws when the upload errored", () => {
    expect(() => parseUploadStatus({ data: { status: "errored", error: "bad" } })).toThrow(/upload errored/);
  });
});

describe("parseAsset", () => {
  it("extracts the first public playback id and duration when ready", () => {
    expect(
      parseAsset({ data: { status: "ready", playback_ids: [{ id: "pb1", policy: "public" }], duration: 12.5 } }),
    ).toEqual({ status: "ready", playbackId: "pb1", durationSeconds: 12.5 });
  });
  it("returns a null playback id while still preparing", () => {
    expect(parseAsset({ data: { status: "preparing" } })).toEqual({
      status: "preparing",
      playbackId: null,
      durationSeconds: null,
    });
  });
  it("throws when the asset errored", () => {
    expect(() => parseAsset({ data: { status: "errored", errors: { messages: ["nope"] } } })).toThrow(/asset errored/);
  });
});

describe("choosePublishTarget", () => {
  it("prefers the explicit option", () => {
    expect(choosePublishTarget("mux")).toBe("mux");
    expect(choosePublishTarget("dryrun")).toBe("dryrun");
  });
  it("reads PALMIER_PUBLISH_TARGET when no option is given, defaulting to dryrun", () => {
    const prev = process.env.PALMIER_PUBLISH_TARGET;
    try {
      process.env.PALMIER_PUBLISH_TARGET = "mux";
      expect(choosePublishTarget()).toBe("mux");
      process.env.PALMIER_PUBLISH_TARGET = "something-else";
      expect(choosePublishTarget()).toBe("dryrun");
      delete process.env.PALMIER_PUBLISH_TARGET;
      expect(choosePublishTarget()).toBe("dryrun");
    } finally {
      if (prev === undefined) delete process.env.PALMIER_PUBLISH_TARGET;
      else process.env.PALMIER_PUBLISH_TARGET = prev;
    }
  });
});

describe("MuxPublishTarget.publish (state machine with a fake fetch)", () => {
  /** Build a target whose HTTP boundary is scripted, recording every call. */
  function makeTarget(handlers: { create?: () => HttpReply; put?: () => HttpReply; uploadPolls: HttpReply[]; assetPolls: HttpReply[] }) {
    const calls: Array<{ method: string; url: string }> = [];
    let uploadIdx = 0;
    let assetIdx = 0;
    const http: FetchLike = async (url, init) => {
      calls.push({ method: init.method, url });
      if (init.method === "POST" && url.endsWith("/video/v1/uploads")) {
        return (handlers.create ?? (() => ok({ data: { id: "up1", url: "https://put.here", status: "waiting" } })))();
      }
      if (init.method === "PUT") {
        return (handlers.put ?? (() => ok({})))();
      }
      if (init.method === "GET" && url.includes("/uploads/")) {
        const r = handlers.uploadPolls[Math.min(uploadIdx, handlers.uploadPolls.length - 1)]!;
        uploadIdx++;
        return r;
      }
      if (init.method === "GET" && url.includes("/assets/")) {
        const r = handlers.assetPolls[Math.min(assetIdx, handlers.assetPolls.length - 1)]!;
        assetIdx++;
        return r;
      }
      throw new Error(`unexpected call ${init.method} ${url}`);
    };
    const target = new MuxPublishTarget({
      tokenId: "id",
      tokenSecret: "secret",
      fetchLike: http,
      readFile: async () => new Uint8Array([1, 2, 3]),
    });
    return { target, calls };
  }

  it("drives create → put → poll-upload → poll-asset and returns the ready playback id", async () => {
    const { target, calls } = makeTarget({
      uploadPolls: [
        ok({ data: { status: "waiting" } }),
        ok({ data: { status: "asset_created", asset_id: "as1" } }),
      ],
      assetPolls: [
        ok({ data: { status: "preparing" } }),
        ok({ data: { status: "ready", playback_ids: [{ id: "pbX" }], duration: 5 } }),
      ],
    });
    const outcome = await target.publish("/tmp/x.mp4", { pollIntervalMs: 0 });
    expect(outcome).toEqual({
      target: "mux",
      assetId: "as1",
      playbackId: "pbX",
      videoUrl: "mux:pbX",
      status: "ready",
    });
    // exercised the full sequence: POST, PUT, 2 upload polls, 2 asset polls
    expect(calls.map((c) => c.method)).toEqual(["POST", "PUT", "GET", "GET", "GET", "GET"]);
  });

  it("throws and stops when the create-upload call fails", async () => {
    const { target, calls } = makeTarget({ create: () => fail(401, "unauthorized"), uploadPolls: [], assetPolls: [] });
    await expect(target.publish("/tmp/x.mp4", { pollIntervalMs: 0 })).rejects.toThrow(/create-upload → 401/);
    expect(calls.map((c) => c.method)).toEqual(["POST"]); // never attempts the PUT
  });

  it("throws when the file PUT fails", async () => {
    const { target } = makeTarget({ put: () => fail(500), uploadPolls: [], assetPolls: [] });
    await expect(target.publish("/tmp/x.mp4", { pollIntervalMs: 0 })).rejects.toThrow(/PUT upload → 500/);
  });

  it("times out if the upload never produces an asset", async () => {
    const { target } = makeTarget({
      uploadPolls: [ok({ data: { status: "waiting" } })],
      assetPolls: [],
    });
    await expect(target.publish("/tmp/x.mp4", { pollIntervalMs: 0, timeoutMs: -1 })).rejects.toThrow(
      /did not produce an asset/,
    );
  });

  it("propagates a Mux upload error surfaced during polling", async () => {
    const { target } = makeTarget({
      uploadPolls: [ok({ data: { status: "errored", error: "bad file" } })],
      assetPolls: [],
    });
    await expect(target.publish("/tmp/x.mp4", { pollIntervalMs: 0 })).rejects.toThrow(/upload errored/);
  });
});
