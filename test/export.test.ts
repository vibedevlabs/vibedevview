import { describe, expect, it } from "vitest";
import { verifyExport } from "../src/deliver/export.js";
import { parseFfprobeJson, type VideoProbe } from "../src/util/exec.js";

/**
 * Contracts under test:
 *
 * parseFfprobeJson(json): parse ffprobe `-show_streams -show_format -of json` output into
 *   {durationSeconds, width, height, fps}. fps = avg_frame_rate as a fraction (falls back to
 *   r_frame_rate when avg is "0/0"). Throws when there is no video stream or no duration.
 *
 * verifyExport(probe, expectedDuration, tolerance=1.0): driftSeconds = |actual - expected|;
 *   withinTolerance = drift <= tolerance (boundary inclusive).
 */

describe("parseFfprobeJson", () => {
  it("parses duration, dimensions and a fractional frame rate", () => {
    const json = JSON.stringify({
      streams: [{ width: 1920, height: 1080, avg_frame_rate: "30000/1001", r_frame_rate: "30/1" }],
      format: { duration: "147.480000" },
    });
    expect(parseFfprobeJson(json)).toEqual<VideoProbe>({
      durationSeconds: 147.48,
      width: 1920,
      height: 1080,
      fps: 30000 / 1001,
    });
  });

  it("computes an integer fps from a 24/1 rate", () => {
    const json = JSON.stringify({
      streams: [{ width: 1280, height: 720, avg_frame_rate: "24/1" }],
      format: { duration: "10" },
    });
    expect(parseFfprobeJson(json).fps).toBe(24);
  });

  it("falls back to r_frame_rate when avg_frame_rate is 0/0", () => {
    const json = JSON.stringify({
      streams: [{ width: 100, height: 100, avg_frame_rate: "0/0", r_frame_rate: "25/1" }],
      format: { duration: "1" },
    });
    expect(parseFfprobeJson(json).fps).toBe(25);
  });

  it("throws when there is no video stream", () => {
    const json = JSON.stringify({ streams: [], format: { duration: "5" } });
    expect(() => parseFfprobeJson(json)).toThrow(/no video stream/);
  });

  it("throws when the format has no parseable duration", () => {
    const json = JSON.stringify({ streams: [{ width: 10, height: 10, avg_frame_rate: "24/1" }], format: {} });
    expect(() => parseFfprobeJson(json)).toThrow(/no duration/);
  });
});

describe("verifyExport", () => {
  const probe = (durationSeconds: number): VideoProbe => ({ durationSeconds, width: 1920, height: 1080, fps: 30 });

  it("reports zero drift and passes when durations match exactly", () => {
    expect(verifyExport(probe(120), 120)).toEqual({ driftSeconds: 0, withinTolerance: true });
  });

  it("passes within the default 1.0s tolerance and computes absolute drift", () => {
    expect(verifyExport(probe(120.4), 120)).toEqual({ driftSeconds: expect.closeTo(0.4, 5), withinTolerance: true });
    expect(verifyExport(probe(119.6), 120).withinTolerance).toBe(true); // under-run also within tolerance
  });

  it("treats the tolerance boundary as inclusive", () => {
    expect(verifyExport(probe(121), 120, 1.0).withinTolerance).toBe(true); // drift == tolerance
    expect(verifyExport(probe(121.001), 120, 1.0).withinTolerance).toBe(false); // just over
  });

  it("fails when drift exceeds the tolerance", () => {
    const r = verifyExport(probe(125), 120, 1.0);
    expect(r.driftSeconds).toBe(5);
    expect(r.withinTolerance).toBe(false);
  });

  it("honors a custom tolerance", () => {
    expect(verifyExport(probe(123), 120, 5).withinTolerance).toBe(true);
  });
});
