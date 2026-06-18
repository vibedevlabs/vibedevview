import { describe, expect, it } from "vitest";
import { collectClipIds, extractMediaIds } from "../src/timeline/palmier-backend.js";

/**
 * These two pure helpers carry all the edge-case logic of the reset/clean path
 * (`palmier clear`, `--clean`). The MCP I/O glue around them (`PalmierBackend.clear`)
 * is exercised live against the real Palmier MCP; here we pin the decision logic.
 *
 * collectClipIds(state) contract:
 *  - walks state.tracks → track.clips, in order, returning each clip's id;
 *  - id precedence: `id` then `clipId`; a clip with neither is SKIPPED (never push undefined/"");
 *  - missing tracks / missing clips array contribute nothing;
 *  - order is stable: track order, then clip order within a track;
 *  - pure (no mutation of input, no I/O).
 * Failure modes mapped to tests: empty state; track without clips key; clip with
 * only clipId; clip with neither id; empty-string id (falsy); cross-track ordering.
 *
 * extractMediaIds(raw) contract:
 *  - accepts raw JSON text OR an already-parsed value;
 *  - recognises { entries } (real Palmier), then { media }, then { items }, or a bare array;
 *  - per item (must be an object): id = id ?? mediaId ?? assetId (first non-empty string), else skip;
 *  - non-JSON string, or any unexpected shape (null/number/object w/o known keys), → [];
 *  - pure.
 * Failure modes mapped to tests: entries happy path; JSON-string input; non-JSON string;
 * bare array; media/items fallbacks; mediaId/assetId fallback; empty-string id skipped;
 * non-object items skipped; entries-wins-over-media precedence; null/number → [].
 */

describe("collectClipIds", () => {
  it("returns every clip id across tracks in stable track-then-clip order", () => {
    const ids = collectClipIds({
      tracks: [
        { type: "video", clips: [{ id: "v1" }, { id: "v2" }] },
        { type: "audio", clips: [{ id: "a1" }] },
      ],
    });
    expect(ids).toEqual(["v1", "v2", "a1"]);
  });

  it("falls back to clipId, and skips clips with neither id nor clipId", () => {
    const ids = collectClipIds({
      tracks: [{ clips: [{ clipId: "legacy-1" }, { startFrame: 10 }, { id: "real-2" }] }],
    });
    expect(ids).toEqual(["legacy-1", "real-2"]);
  });

  it("treats an empty-string id as absent (falsy) and skips it", () => {
    const ids = collectClipIds({ tracks: [{ clips: [{ id: "" }, { id: "keep" }] }] });
    expect(ids).toEqual(["keep"]);
  });

  it("returns [] for an empty state and for tracks with no clips array", () => {
    expect(collectClipIds({})).toEqual([]);
    expect(collectClipIds({ tracks: [{ type: "video" }, { type: "audio" }] })).toEqual([]);
  });

  it("does not mutate the input state", () => {
    const state = { tracks: [{ clips: [{ id: "x" }] }] };
    const snapshot = JSON.stringify(state);
    collectClipIds(state);
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});

describe("extractMediaIds", () => {
  it("reads ids from the real { entries } shape (parsed value)", () => {
    const ids = extractMediaIds({
      entries: [
        { id: "m1", name: "a.png", type: "image" },
        { id: "m2", name: "b.mp3", type: "audio" },
      ],
    });
    expect(ids).toEqual(["m1", "m2"]);
  });

  it("parses raw JSON text exactly as get_media returns it", () => {
    const text = JSON.stringify({ entries: [{ id: "m1" }, { id: "m2" }, { id: "m3" }] });
    expect(extractMediaIds(text)).toEqual(["m1", "m2", "m3"]);
  });

  it("returns [] for non-JSON text instead of throwing", () => {
    expect(extractMediaIds("Imported 'a.png' (id: nope)")).toEqual([]);
  });

  it("accepts a bare array and the { media } / { items } fallback shapes", () => {
    expect(extractMediaIds([{ id: "x" }, { id: "y" }])).toEqual(["x", "y"]);
    expect(extractMediaIds({ media: [{ id: "p" }] })).toEqual(["p"]);
    expect(extractMediaIds({ items: [{ id: "q" }] })).toEqual(["q"]);
  });

  it("falls back to mediaId then assetId, and skips items with no id and non-object items", () => {
    const ids = extractMediaIds({
      entries: [{ mediaId: "via-mediaId" }, { assetId: "via-assetId" }, { name: "no-id" }, "string-item", 42, null],
    });
    expect(ids).toEqual(["via-mediaId", "via-assetId"]);
  });

  it("skips empty-string ids", () => {
    expect(extractMediaIds({ entries: [{ id: "" }, { id: "keep" }] })).toEqual(["keep"]);
  });

  it("prefers entries over media when both are present", () => {
    const ids = extractMediaIds({ entries: [{ id: "from-entries" }], media: [{ id: "from-media" }] });
    expect(ids).toEqual(["from-entries"]);
  });

  it("returns [] for shapes with no recognised list (null, number, unknown keys)", () => {
    expect(extractMediaIds(null)).toEqual([]);
    expect(extractMediaIds(42)).toEqual([]);
    expect(extractMediaIds({ totalFrames: 4425 })).toEqual([]);
  });
});
