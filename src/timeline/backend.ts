import {
  hasDo,
  hasSlide,
  type Alignment,
  type Manifest,
  type RecordingManifest,
  type Timeline,
} from "../types.js";
import type { Workspace } from "../workspace.js";

export type TrackName = "Slides" | "Recordings" | "Voiceover";

export type ClipKind = "slide" | "recording" | "audio";

export interface PlacedClip {
  track: TrackName;
  segId: string;
  kind: ClipKind;
  /** Absolute media path (png / mov / mp3). Undefined for silent holds. */
  mediaPath?: string;
  start: number;
  duration: number;
}

export interface TimelinePlan {
  lessonId: string;
  fps: number;
  totalDuration: number;
  clips: PlacedClip[];
}

export interface AssembleResult {
  backend: string;
  output?: string;
  clipCount: number;
  notes?: string[];
}

export interface TimelineBackend {
  readonly name: string;
  assemble(plan: TimelinePlan, ws: Workspace): Promise<AssembleResult>;
  /** Replace a single segment's clips (correction loop). Optional. */
  swap?(plan: TimelinePlan, segId: string, ws: Workspace): Promise<void>;
}

/**
 * Build the track placement plan from the produced assets. This is the single
 * source of placement truth; every backend consumes it.
 *
 *   Track 1 Slides     — PNG held for the segment duration
 *   Track 2 Recordings — .mov (or placeholder PNG) for DO segments
 *   Track 3 Voiceover  — per-segment TTS mp3
 */
export function buildPlan(
  manifest: Manifest,
  alignment: Alignment,
  timeline: Timeline,
  recording: RecordingManifest | undefined,
  ws: Workspace,
): TimelinePlan {
  const clips: PlacedClip[] = [];
  for (const seg of manifest.segments) {
    const a = alignment.segments[seg.id];
    if (!a) continue;
    const { start, duration } = a;

    if (hasSlide(seg)) {
      clips.push({
        track: "Slides",
        segId: seg.id,
        kind: "slide",
        mediaPath: ws.slidePath(seg.frameId),
        start,
        duration,
      });
    }
    if (hasDo(seg)) {
      const rec = recording?.segments[seg.id];
      clips.push({
        track: "Recordings",
        segId: seg.id,
        kind: "recording",
        mediaPath: rec?.path,
        start,
        duration,
      });
    }
    const t = timeline.segments[seg.id];
    if (t?.source === "tts" && t.audioPath) {
      clips.push({ track: "Voiceover", segId: seg.id, kind: "audio", mediaPath: t.audioPath, start, duration });
    }
  }
  return { lessonId: manifest.lessonId, fps: timeline.fps, totalDuration: alignment.totalDuration, clips };
}

/** Group a plan's clips by segment id, preserving timeline order. */
export function clipsBySegment(plan: TimelinePlan): Map<string, PlacedClip[]> {
  const map = new Map<string, PlacedClip[]>();
  for (const clip of plan.clips) {
    const arr = map.get(clip.segId) ?? [];
    arr.push(clip);
    map.set(clip.segId, arr);
  }
  return map;
}
