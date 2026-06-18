import { describe, expect, it } from "vitest";
import { planToTrackEntries } from "../src/timeline/palmier-backend.js";
import type { TimelinePlan } from "../src/timeline/backend.js";

/**
 * Contract for planToTrackEntries(plan, fps):
 *  - groups clips by track in stacking order Slides → Recordings → Voiceover;
 *  - drops clips with no mediaPath (silent holds);
 *  - omits a track group entirely when it has no media;
 *  - converts seconds → PROJECT frames: startFrame = round(start*fps),
 *    durationFrames = max(1, round(duration*fps)) (never < 1);
 *  - derives mediaName = `${lessonId}-${segId}-${kind}`.
 */
function plan(clips: TimelinePlan["clips"]): TimelinePlan {
  return { lessonId: "B-AB1", fps: 24, totalDuration: 0, clips };
}

describe("planToTrackEntries", () => {
  it("converts seconds to frames at the PROJECT fps (30), not the plan's authoring fps", () => {
    const out = planToTrackEntries(
      plan([{ track: "Slides", segId: "01", kind: "slide", mediaPath: "/m/01.png", start: 0, duration: 10 }]),
      30,
    );
    expect(out).toEqual([
      {
        track: "Slides",
        entries: [
          { mediaPath: "/m/01.png", mediaName: "B-AB1-01-slide", startFrame: 0, durationFrames: 300 },
        ],
      },
    ]);
  });

  it("rounds fractional second boundaries to the NEAREST frame (not floor or ceil)", () => {
    // Two clips chosen so round differs from both floor and ceil on start AND duration:
    //   clip A @30: start 1.04→31.2 (round 31, ceil 32), dur 2.04→61.2 (round 61, ceil 62)
    //   clip B @30: start 3.06→91.8 (round 92, floor 91), dur 1.06→31.8 (round 32, floor 31)
    const [grp] = planToTrackEntries(
      plan([
        { track: "Slides", segId: "0A", kind: "slide", mediaPath: "/m/a.png", start: 1.04, duration: 2.04 },
        { track: "Slides", segId: "0B", kind: "slide", mediaPath: "/m/b.png", start: 3.06, duration: 1.06 },
      ]),
      30,
    );
    expect(grp!.entries.map((e) => [e.startFrame, e.durationFrames])).toEqual([
      [31, 61],
      [92, 32],
    ]);
  });

  it("never emits a zero-length clip — sub-frame durations clamp to 1 frame", () => {
    const [grp] = planToTrackEntries(
      plan([{ track: "Voiceover", segId: "09", kind: "audio", mediaPath: "/a/09.mp3", start: 0, duration: 0.01 }]),
      30,
    );
    expect(grp!.entries[0]!.durationFrames).toBe(1);
  });

  it("orders track groups Slides → Recordings → Voiceover regardless of clip input order", () => {
    const out = planToTrackEntries(
      plan([
        { track: "Voiceover", segId: "01", kind: "audio", mediaPath: "/a/01.mp3", start: 0, duration: 5 },
        { track: "Recordings", segId: "09", kind: "recording", mediaPath: "/r/09.mov", start: 5, duration: 4 },
        { track: "Slides", segId: "01", kind: "slide", mediaPath: "/m/01.png", start: 0, duration: 5 },
      ]),
      24,
    );
    expect(out.map((g) => g.track)).toEqual(["Slides", "Recordings", "Voiceover"]);
    // frames computed at fps=24: recording starts at 5*24=120 for 4*24=96
    expect(out[1]!.entries[0]).toEqual({
      mediaPath: "/r/09.mov",
      mediaName: "B-AB1-09-recording",
      startFrame: 120,
      durationFrames: 96,
    });
  });

  it("drops silent holds (no mediaPath) and omits a track that ends up empty", () => {
    const out = planToTrackEntries(
      plan([
        { track: "Slides", segId: "07", kind: "slide", mediaPath: "/m/07.png", start: 0, duration: 5 },
        // silent voiceover hold — no mediaPath; its whole track must disappear
        { track: "Voiceover", segId: "07", kind: "audio", start: 0, duration: 5 },
      ]),
      30,
    );
    expect(out.map((g) => g.track)).toEqual(["Slides"]);
    expect(out).toHaveLength(1);
  });

  it("keeps multiple clips within a track in input order with correct cumulative frames", () => {
    const [slides] = planToTrackEntries(
      plan([
        { track: "Slides", segId: "01", kind: "slide", mediaPath: "/m/01.png", start: 0, duration: 4 },
        { track: "Slides", segId: "02", kind: "slide", mediaPath: "/m/02.png", start: 4, duration: 6 },
      ]),
      30,
    );
    expect(slides!.entries.map((e) => [e.startFrame, e.durationFrames])).toEqual([
      [0, 120],
      [120, 180],
    ]);
  });

  it("returns nothing when no clip has media", () => {
    const out = planToTrackEntries(
      plan([{ track: "Slides", segId: "01", kind: "slide", start: 0, duration: 5 }]),
      30,
    );
    expect(out).toEqual([]);
  });
});
