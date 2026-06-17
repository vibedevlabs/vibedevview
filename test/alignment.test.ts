import { describe, expect, it } from "vitest";
import {
  computeAlignment,
  formatTimestamp,
  parseTimestamp,
  segmentAt,
} from "../src/alignment.js";
import type { Manifest, Timeline } from "../src/types.js";

/**
 * Contract for computeAlignment(manifest, timeline) -> Alignment:
 *  - Walks segments in manifest order, accumulating a clock cursor.
 *  - Each segment's duration comes from timeline.segments[id].duration,
 *    falling back to the manifest's durationEstimate when the timeline lacks it.
 *  - start = running cursor; end = start + duration; totalDuration = final cursor.
 * segmentAt(alignment, t): start-inclusive, end-exclusive lookup; undefined out of range.
 * parseTimestamp: "m:ss"/"h:mm:ss"/"123" -> seconds; throws on non-numeric.
 * formatTimestamp: seconds -> "m:ss", rounded, clamped at 0.
 */

const manifest: Manifest = {
  lessonId: "T1",
  title: "T",
  voiceDefault: "Ja'dan",
  segments: [
    { id: "01", frameId: "01", silent: false, durationEstimate: 5 },
    { id: "02", frameId: "02", silent: false, durationEstimate: 99 }, // overridden by timeline
    { id: "03", frameId: "03", silent: false, durationEstimate: 4 }, // missing in timeline -> estimate
  ],
};

const timeline: Timeline = {
  lessonId: "T1",
  fps: 24,
  segments: {
    "01": { duration: 8.5, source: "tts", audioPath: "/a/01.mp3" },
    "02": { duration: 6, source: "tts", audioPath: "/a/02.mp3" },
  },
};

describe("computeAlignment", () => {
  const a = computeAlignment(manifest, timeline);

  it("accumulates cumulative start/end from timeline durations", () => {
    expect(a.segments["01"]).toEqual({ start: 0, end: 8.5, duration: 8.5 });
    expect(a.segments["02"]).toEqual({ start: 8.5, end: 14.5, duration: 6 });
  });

  it("falls back to the manifest estimate when the timeline omits a segment", () => {
    expect(a.segments["03"]).toEqual({ start: 14.5, end: 18.5, duration: 4 });
  });

  it("totalDuration equals the sum of all segment durations", () => {
    expect(a.totalDuration).toBe(18.5);
  });
});

describe("segmentAt", () => {
  const a = computeAlignment(manifest, timeline);

  it("resolves a timestamp to the playing segment (start inclusive)", () => {
    expect(segmentAt(a, 0)).toBe("01");
    expect(segmentAt(a, 8.5)).toBe("02"); // boundary belongs to the next segment
    expect(segmentAt(a, 14.49)).toBe("02");
    expect(segmentAt(a, 14.5)).toBe("03");
  });

  it("returns undefined past the end of the lesson", () => {
    expect(segmentAt(a, 18.5)).toBeUndefined();
    expect(segmentAt(a, 100)).toBeUndefined();
  });
});

describe("parseTimestamp", () => {
  it("parses seconds, m:ss and h:mm:ss", () => {
    expect(parseTimestamp("90")).toBe(90);
    expect(parseTimestamp("1:23")).toBe(83);
    expect(parseTimestamp("1:00:00")).toBe(3600);
    expect(parseTimestamp("2:05:09")).toBe(7509);
  });

  it("throws on non-numeric input", () => {
    expect(() => parseTimestamp("abc")).toThrow(/invalid timestamp/);
    expect(() => parseTimestamp("1:xx")).toThrow();
  });
});

describe("formatTimestamp", () => {
  it("formats seconds as m:ss with zero padding and rounding", () => {
    expect(formatTimestamp(0)).toBe("0:00");
    expect(formatTimestamp(8.5)).toBe("0:09"); // rounds
    expect(formatTimestamp(83)).toBe("1:23");
    expect(formatTimestamp(125.4)).toBe("2:05");
  });

  it("clamps negatives to 0:00", () => {
    expect(formatTimestamp(-5)).toBe("0:00");
  });

  it("round-trips with parseTimestamp on whole seconds", () => {
    for (const s of [0, 7, 59, 60, 83, 600]) {
      expect(parseTimestamp(formatTimestamp(s))).toBe(s);
    }
  });
});
