import type { Alignment, Manifest, Timeline } from "./types.js";

/**
 * Compute cumulative start/end timestamps for every segment from the timing
 * authority (timeline.json). Segment order in the manifest defines sequence.
 */
export function computeAlignment(manifest: Manifest, timeline: Timeline): Alignment {
  const segments: Alignment["segments"] = {};
  let cursor = 0;
  for (const seg of manifest.segments) {
    const entry = timeline.segments[seg.id];
    const duration = entry?.duration ?? seg.durationEstimate;
    segments[seg.id] = { start: cursor, end: cursor + duration, duration };
    cursor += duration;
  }
  return { lessonId: manifest.lessonId, totalDuration: cursor, segments };
}

/** Resolve a clock timestamp (seconds) to the segment id playing at that time. */
export function segmentAt(alignment: Alignment, seconds: number): string | undefined {
  for (const [id, { start, end }] of Object.entries(alignment.segments)) {
    if (seconds >= start && seconds < end) return id;
  }
  return undefined;
}

/** Parse "m:ss" / "h:mm:ss" / "123" into seconds. */
export function parseTimestamp(input: string): number {
  const parts = input.trim().split(":").map((p) => Number.parseFloat(p));
  if (parts.some((n) => !Number.isFinite(n))) {
    throw new Error(`invalid timestamp: ${input}`);
  }
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

export function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
