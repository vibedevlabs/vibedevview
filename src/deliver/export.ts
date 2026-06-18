import { promises as fs } from "node:fs";
import { computeAlignment } from "../alignment.js";
import { buildPlan } from "../timeline/backend.js";
import { renderPlanToVideo } from "../timeline/ffmpeg-backend.js";
import { probeVideo, type VideoProbe } from "../util/exec.js";
import { log } from "../util/log.js";
import { Workspace } from "../workspace.js";

export interface ExportOptions {
  /** Output path override. Defaults to `<workspace>/videos/<lessonId>.mp4`. */
  out?: string;
  /** Allowed drift (seconds) between the rendered duration and the plan. Default 1.0. */
  toleranceSeconds?: number;
}

export interface ExportResult {
  lessonId: string;
  path: string;
  clipCount: number;
  expectedDuration: number;
  durationSeconds: number;
  driftSeconds: number;
  withinTolerance: boolean;
  width: number;
  height: number;
  fps: number;
  sizeBytes: number;
  notes: string[];
}

const DEFAULT_TOLERANCE = 1.0;

/** Decide whether a rendered probe matches the planned duration within tolerance. */
export function verifyExport(
  probe: VideoProbe,
  expectedDuration: number,
  toleranceSeconds = DEFAULT_TOLERANCE,
): { driftSeconds: number; withinTolerance: boolean } {
  const driftSeconds = Math.abs(probe.durationSeconds - expectedDuration);
  return { driftSeconds, withinTolerance: driftSeconds <= toleranceSeconds };
}

/**
 * Render the finished, single-file deliverable for a lesson and verify it with
 * ffprobe. Backend-independent: it always flattens the asset plan with ffmpeg,
 * so it works whether the timeline was assembled via the ffmpeg preview backend
 * or driven onto a Palmier Pro timeline. Requires Slides + Voice assets to exist.
 */
export async function exportLesson(lessonId: string, opts: ExportOptions = {}): Promise<ExportResult> {
  const ws = Workspace.for(lessonId);
  const manifest = await ws.readManifest();
  const timeline = await ws.readTimeline();
  const alignment = computeAlignment(manifest, timeline);
  await ws.writeAlignment(alignment);
  const recording = (await ws.exists(ws.recordingManifestPath)) ? await ws.readRecordingManifest() : undefined;
  const plan = buildPlan(manifest, alignment, timeline, recording, ws);

  const output = opts.out ?? ws.exportPath;
  log.step("export", `rendering finished video for "${lessonId}" → ${output}`);
  const render = await renderPlanToVideo(plan, ws, output);

  const probe = await probeVideo(output);
  const { driftSeconds, withinTolerance } = verifyExport(probe, alignment.totalDuration, opts.toleranceSeconds);
  const { size } = await fs.stat(output);

  if (!withinTolerance) {
    log.warn(
      "export",
      `rendered duration ${probe.durationSeconds.toFixed(2)}s drifts ${driftSeconds.toFixed(2)}s from plan ${alignment.totalDuration.toFixed(2)}s`,
    );
  } else {
    log.ok("export", `verified ${probe.durationSeconds.toFixed(2)}s @ ${probe.width}x${probe.height} (${size} bytes)`);
  }

  return {
    lessonId,
    path: output,
    clipCount: render.clipCount,
    expectedDuration: alignment.totalDuration,
    durationSeconds: probe.durationSeconds,
    driftSeconds,
    withinTolerance,
    width: probe.width,
    height: probe.height,
    fps: probe.fps,
    sizeBytes: size,
    notes: render.notes,
  };
}
