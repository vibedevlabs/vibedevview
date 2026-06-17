import { describe, expect, it } from "vitest";
import { buildPlan, clipsBySegment, type PlacedClip } from "../src/timeline/backend.js";
import { Workspace } from "../src/workspace.js";
import type { Alignment, Manifest, RecordingManifest, Timeline } from "../src/types.js";

/**
 * Contract for buildPlan(manifest, alignment, timeline, recording, ws):
 *  - Iterates manifest.segments in order; skips any segment missing an alignment entry.
 *  - Emits at most three clips per segment, ALWAYS in this order:
 *      1. Slides     when hasSlide(seg)  -> mediaPath = ws.slidePath(frameId)
 *      2. Recordings when hasDo(seg)     -> mediaPath = recording.segments[id].path (may be undefined)
 *      3. Voiceover  when timeline.segments[id].source === "tts" AND audioPath set
 *  - start/duration copied from the alignment entry.
 *  - totalDuration + fps copied from alignment + timeline.
 * clipsBySegment groups clips by segId preserving insertion order.
 */

const ws = new Workspace("T1", "/tmp/ws/T1");

const manifest: Manifest = {
  lessonId: "T1",
  title: "T",
  voiceDefault: "Ja'dan",
  segments: [
    { id: "01", frameId: "N1-title", silent: false, durationEstimate: 5, slide: { frame: "N1-title" }, say: "hi" },
    { id: "02", frameId: "C4-steps", silent: false, durationEstimate: 5, slide: { frame: "C4-steps" }, do: [{ action: "run" }] },
    { id: "03", frameId: "D1", silent: false, durationEstimate: 5, do: [{ action: "record" }] }, // recording w/o path
    { id: "04", frameId: "N2-section", silent: false, durationEstimate: 5, slide: { frame: "N2-section" }, say: "fallback" }, // estimate -> no audio clip
    { id: "99", frameId: "x", silent: false, durationEstimate: 5, slide: { frame: "N1-title" } }, // no alignment -> skipped
  ],
};

const alignment: Alignment = {
  lessonId: "T1",
  totalDuration: 32,
  segments: {
    "01": { start: 0, end: 8, duration: 8 },
    "02": { start: 8, end: 18, duration: 10 },
    "03": { start: 18, end: 24, duration: 6 },
    "04": { start: 24, end: 32, duration: 8 },
  },
};

const timeline: Timeline = {
  lessonId: "T1",
  fps: 24,
  segments: {
    "01": { source: "tts", audioPath: "/a/01.mp3", duration: 8 },
    "02": { source: "tts", audioPath: "/a/02.mp3", duration: 10 },
    "04": { source: "estimate", duration: 8 }, // no audioPath -> no voiceover clip
  },
};

const recording: RecordingManifest = {
  lessonId: "T1",
  segments: {
    "02": { status: "recorded", path: "/r/02.mov", duration: 10 },
    "03": { status: "placeholder", duration: 6 }, // no path
  },
};

describe("buildPlan", () => {
  const plan = buildPlan(manifest, alignment, timeline, recording, ws);

  it("copies fps and totalDuration from inputs", () => {
    expect(plan.fps).toBe(24);
    expect(plan.totalDuration).toBe(32);
    expect(plan.lessonId).toBe("T1");
  });

  it("skips segments without an alignment entry", () => {
    expect(plan.clips.some((c) => c.segId === "99")).toBe(false);
  });

  it("places slide + voiceover for a narrated slide segment (01)", () => {
    const got = plan.clips.filter((c) => c.segId === "01");
    expect(got).toEqual<PlacedClip[]>([
      { track: "Slides", segId: "01", kind: "slide", mediaPath: "/tmp/ws/T1/slides/N1-title.png", start: 0, duration: 8 },
      { track: "Voiceover", segId: "01", kind: "audio", mediaPath: "/a/01.mp3", start: 0, duration: 8 },
    ]);
  });

  it("orders Slides -> Recordings -> Voiceover within a segment (02)", () => {
    const got = plan.clips.filter((c) => c.segId === "02");
    expect(got.map((c) => c.track)).toEqual(["Slides", "Recordings", "Voiceover"]);
    expect(got[1]!.mediaPath).toBe("/r/02.mov");
  });

  it("emits a Recordings clip with undefined mediaPath when the recording has no file (03)", () => {
    const got = plan.clips.filter((c) => c.segId === "03");
    expect(got).toHaveLength(1);
    expect(got[0]).toMatchObject({ track: "Recordings", kind: "recording", start: 18, duration: 6 });
    expect(got[0]!.mediaPath).toBeUndefined();
  });

  it("omits the Voiceover clip when the timeline source is an estimate (04)", () => {
    const got = plan.clips.filter((c) => c.segId === "04");
    expect(got.map((c) => c.track)).toEqual(["Slides"]); // slide only, no audio
  });

  it("produces exactly the expected total clip count", () => {
    // 01: slide+audio(2) | 02: slide+rec+audio(3) | 03: rec(1) | 04: slide(1) = 7
    expect(plan.clips).toHaveLength(7);
  });
});

describe("clipsBySegment", () => {
  const plan = buildPlan(manifest, alignment, timeline, recording, ws);
  const map = clipsBySegment(plan);

  it("groups by segId preserving insertion order", () => {
    expect([...map.keys()]).toEqual(["01", "02", "03", "04"]);
    expect(map.get("02")!.map((c) => c.kind)).toEqual(["slide", "recording", "audio"]);
  });

  it("returns one entry per aligned segment that produced clips", () => {
    expect(map.size).toBe(4);
  });
});
