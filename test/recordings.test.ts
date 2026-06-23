import { describe, expect, it } from "vitest";
import {
  buildRecordingPlan,
  formatRecordingReport,
  needsRecording,
  type RecordingNeed,
} from "../src/recordings.js";
import type { Alignment, DoStep, Manifest, RecordingManifest, Segment } from "../src/types.js";

/**
 * Contracts under test:
 *
 * buildRecordingPlan(manifest, recording?, alignment?): pure. Keeps manifest order,
 *   includes ONLY segments with a DO block, numbers the steps from seg.do
 *   (action/target/note), folds in recording-manifest status (default "pending"
 *   when no manifest), and prefers alignment timings then manifest duration then
 *   the segment estimate.
 *
 * needsRecording(status): true for pending/todo/placeholder, false for recorded.
 *
 * formatRecordingReport(id, needs): 🎥 callout + numbered steps for each segment
 *   that still needs capture, ✅ for recorded ones, a "M of N still needed" header,
 *   and an empty-state line when there are no DO segments.
 */

function seg(id: string, opts: { label?: string; do?: DoStep[]; dur?: number } = {}): Segment {
  const s: Segment = { id, frameId: `F${id}`, silent: false, durationEstimate: opts.dur ?? 5 };
  if (opts.label) s.label = opts.label;
  if (opts.do) s.do = opts.do;
  return s;
}

function manifest(segments: Segment[]): Manifest {
  return { lessonId: "B-AB1", title: "Demo", voiceDefault: "Ja'dan", segments };
}

describe("needsRecording", () => {
  it("is false only for recorded", () => {
    expect(needsRecording("recorded")).toBe(false);
    expect(needsRecording("placeholder")).toBe(true);
    expect(needsRecording("todo")).toBe(true);
    expect(needsRecording("pending")).toBe(true);
  });
});

describe("buildRecordingPlan", () => {
  it("includes only DO segments, in order, with numbered steps", () => {
    const m = manifest([
      seg("01", { label: "intro" }), // SAY/SLIDE only — excluded
      seg("02", {
        label: "demo",
        do: [
          { action: "Open the terminal", target: "iTerm" },
          { action: "Run the build", target: "palmier produce B-AB1", note: "let logs scroll" },
        ],
      }),
    ]);
    const plan = buildRecordingPlan(m);
    expect(plan).toHaveLength(1);
    const need = plan[0]!;
    expect(need.segId).toBe("02");
    expect(need.label).toBe("demo");
    expect(need.status).toBe("pending"); // no recording-manifest yet
    expect(need.steps).toEqual([
      { n: 1, action: "Open the terminal", target: "iTerm" },
      { n: 2, action: "Run the build", target: "palmier produce B-AB1", note: "let logs scroll" },
    ]);
  });

  it("folds in recording-manifest status + alignment timings (alignment wins over estimate)", () => {
    const m = manifest([seg("09", { do: [{ action: "Show the draft" }], dur: 18 })]);
    const recording: RecordingManifest = {
      lessonId: "B-AB1",
      segments: { "09": { status: "recorded", path: "/r/seg-09-take.mov", duration: 17 } },
    };
    const alignment: Alignment = {
      lessonId: "B-AB1",
      totalDuration: 60,
      segments: { "09": { start: 42, end: 60, duration: 18 } },
    };
    const need = buildRecordingPlan(m, recording, alignment)[0]!;
    expect(need.status).toBe("recorded");
    expect(need.recordingPath).toBe("/r/seg-09-take.mov");
    expect(need.startSeconds).toBe(42);
    expect(need.durationSeconds).toBe(18); // alignment, not the 17 in the manifest
  });

  it("falls back estimate → null start when no recording/alignment", () => {
    const need = buildRecordingPlan(manifest([seg("03", { do: [{ action: "x" }], dur: 7 })]))[0]!;
    expect(need.startSeconds).toBeNull();
    expect(need.durationSeconds).toBe(7);
    expect(need.recordingPath).toBeNull();
  });

  it("returns empty when no segment has a DO block", () => {
    expect(buildRecordingPlan(manifest([seg("01"), seg("02")]))).toEqual([]);
  });
});

describe("formatRecordingReport", () => {
  it("renders a 🎥 callout with timestamp, length and numbered steps for pending captures", () => {
    const needs: RecordingNeed[] = [
      {
        segId: "09",
        label: "kick off",
        status: "placeholder",
        startSeconds: 42,
        durationSeconds: 18,
        steps: [{ n: 1, action: "Open the terminal", target: "iTerm" }],
        recordingPath: null,
      },
    ];
    const text = formatRecordingReport("B-AB1", needs).join("\n");
    expect(text).toContain("1 of 1 still needed");
    expect(text).toContain("🎥 RECORD — segment 09 kick off  [placeholder]");
    expect(text).toContain("0:42 · target length ~18s @ 1920x1080");
    expect(text).toContain("1. Open the terminal — iTerm");
    expect(text).toContain("Capture the 1 clip(s) above");
  });

  it("marks recorded segments with ✅ and reports all-captured", () => {
    const needs: RecordingNeed[] = [
      { segId: "09", label: null, status: "recorded", startSeconds: 10, durationSeconds: 5, steps: [], recordingPath: "/r/x.mov" },
    ];
    const text = formatRecordingReport("B-AB1", needs).join("\n");
    expect(text).toContain("0 of 1 still needed");
    expect(text).toContain("✅ segment 09 — recorded (/r/x.mov)");
    expect(text).toContain("All screen recordings are captured.");
  });

  it("shows an empty-state line when there are no DO segments", () => {
    expect(formatRecordingReport("B-AB1", []).join("\n")).toBe(
      'No screen recordings needed for "B-AB1" — no segments have a DO block.',
    );
  });
});
