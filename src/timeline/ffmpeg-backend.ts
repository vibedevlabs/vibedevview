import { promises as fs } from "node:fs";
import path from "node:path";
import { VIDEO, BRAND } from "../brand.js";
import { run } from "../util/exec.js";
import { log } from "../util/log.js";
import type { Workspace } from "../workspace.js";
import { clipsBySegment, type AssembleResult, type PlacedClip, type TimelineBackend, type TimelinePlan } from "./backend.js";

const SCOPE = "ffmpeg";
const IMAGE_RE = /\.(png|jpe?g|webp)$/i;
const PADHEX = BRAND.colors.darkBg.replace("#", "0x");

function videoFilter(isContinuous: boolean): string {
  const base =
    `scale=${VIDEO.width}:${VIDEO.height}:force_original_aspect_ratio=decrease,` +
    `pad=${VIDEO.width}:${VIDEO.height}:(ow-iw)/2:(oh-ih)/2:color=${PADHEX},setsar=1,fps=${VIDEO.fps}`;
  // For real video clips, clone the last frame if the recording is short.
  const pad = isContinuous ? "" : ",tpad=stop_mode=clone:stop_duration=3600";
  return `${base}${pad},format=yuv420p`;
}

/** Encode one normalized segment clip (visual + audio) of exact `duration`. */
async function encodeSegment(
  visual: string | undefined,
  audio: string | undefined,
  duration: number,
  out: string,
): Promise<void> {
  const args: string[] = ["-y"];
  let isContinuous = true; // lavfi color / loop image hold their last state

  if (!visual) {
    args.push("-f", "lavfi", "-i", `color=c=${PADHEX}:s=${VIDEO.width}x${VIDEO.height}:r=${VIDEO.fps}`);
  } else if (IMAGE_RE.test(visual)) {
    args.push("-loop", "1", "-i", visual);
  } else {
    args.push("-i", visual);
    isContinuous = false; // real footage — may need last-frame padding
  }

  if (audio) args.push("-i", audio);
  else args.push("-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000");

  const fc = `[0:v]${videoFilter(isContinuous)}[v];[1:a]apad[a]`;
  args.push(
    "-filter_complex",
    fc,
    "-map",
    "[v]",
    "-map",
    "[a]",
    // Never use -shortest: it would truncate audio. Pin the exact duration.
    "-t",
    duration.toFixed(3),
    "-r",
    String(VIDEO.fps),
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-profile:v",
    "high",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    out,
  );
  await run("ffmpeg", args);
}

/** Pick the on-screen visual for a segment: a recording replaces the slide. */
function visualFor(clips: PlacedClip[]): string | undefined {
  const rec = clips.find((c) => c.track === "Recordings");
  if (rec?.mediaPath) return rec.mediaPath;
  const slide = clips.find((c) => c.track === "Slides");
  return slide?.mediaPath;
}

function audioFor(clips: PlacedClip[]): string | undefined {
  return clips.find((c) => c.track === "Voiceover")?.mediaPath;
}

/**
 * FFmpeg backend — flattens the three-track plan into a single preview MP4.
 * Portable (runs anywhere ffmpeg exists) so the whole pipeline is verifiable
 * in the cloud, and a usable fallback when Palmier Pro isn't available.
 */
export class FfmpegBackend implements TimelineBackend {
  readonly name = "ffmpeg";

  async assemble(plan: TimelinePlan, ws: Workspace): Promise<AssembleResult> {
    await ws.ensure();
    const work = path.join(ws.videosDir, "_clips");
    await fs.mkdir(work, { recursive: true });

    const grouped = clipsBySegment(plan);
    const segIds = [...grouped.keys()];
    const clipPaths: string[] = [];
    const notes: string[] = [];

    let i = 0;
    for (const segId of segIds) {
      const clips = grouped.get(segId)!;
      const duration = clips[0]?.duration ?? 0;
      if (duration <= 0) continue;
      const visual = visualFor(clips);
      const audio = audioFor(clips);
      if (visual && !(await ws.exists(visual))) {
        notes.push(`seg ${segId}: visual missing (${path.basename(visual)})`);
      }
      const out = path.join(work, `clip-${String(i).padStart(3, "0")}-${segId}.mp4`);
      log.info(SCOPE, `encode seg ${segId} (${duration.toFixed(2)}s)`);
      await encodeSegment(
        visual && (await ws.exists(visual)) ? visual : undefined,
        audio && (await ws.exists(audio)) ? audio : undefined,
        duration,
        out,
      );
      clipPaths.push(out);
      i++;
    }

    if (clipPaths.length === 0) throw new Error("no clips to assemble");

    const listFile = path.join(work, "concat.txt");
    await fs.writeFile(listFile, clipPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n") + "\n");
    const output = path.join(ws.videosDir, `${plan.lessonId}-preview.mp4`);
    log.step(SCOPE, `concatenating ${clipPaths.length} clips → ${path.basename(output)}`);
    await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", "-movflags", "+faststart", output]);

    log.ok(SCOPE, `wrote ${output}`);
    return { backend: this.name, output, clipCount: clipPaths.length, notes };
  }
}
