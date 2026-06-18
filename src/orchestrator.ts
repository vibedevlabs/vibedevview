import { promises as fs } from "node:fs";
import path from "node:path";
import { computeAlignment, segmentAt } from "./alignment.js";
import { parseScript } from "./script/parse.js";
import { runScriptAgent } from "./agents/script-agent.js";
import { runSlidesAgent, type SlideResult } from "./agents/slides-agent.js";
import { runVoiceAgent } from "./agents/voice-agent.js";
import { runRecordingAgent } from "./agents/recording-agent.js";
import { buildPlan, type AssembleResult, type TimelineBackend } from "./timeline/backend.js";
import { FfmpegBackend } from "./timeline/ffmpeg-backend.js";
import { PalmierBackend } from "./timeline/palmier-backend.js";
import type { RendererOptions } from "./slides/renderer.js";
import { log } from "./util/log.js";
import { Workspace } from "./workspace.js";

export type BackendName = "ffmpeg" | "palmier";

export interface ProduceOptions {
  backend?: BackendName;
  review?: boolean; // stop for human review after generating a fresh script
  placeholders?: boolean;
  renderer?: RendererOptions;
  clean?: boolean; // clear the timeline before assembling (palmier: avoids stacking duplicate tracks)
  cleanMedia?: boolean; // with clean, also delete previously imported assets from the bin
}

export interface ProductionResult {
  lessonId: string;
  status: "awaiting-script-review" | "assembled";
  segments: number;
  totalDuration: number;
  slides?: SlideResult[];
  assemble?: AssembleResult;
  message: string;
}

export function makeBackend(name: BackendName): TimelineBackend {
  return name === "palmier" ? new PalmierBackend() : new FfmpegBackend();
}

function chooseBackendName(opt?: BackendName): BackendName {
  if (opt) return opt;
  const env = process.env.PALMIER_TIMELINE as BackendName | undefined;
  return env === "palmier" ? "palmier" : "ffmpeg";
}

/**
 * The orchestrator. Mirrors the spec's loop: ensure a script (with human review
 * gate), run Slides + Voice in parallel, derive timing, run the Recording agent,
 * then hand the asset plan to the timeline backend and notify the human.
 */
export async function produce(lessonId: string, opts: ProduceOptions = {}): Promise<ProductionResult> {
  const ws = Workspace.for(lessonId);
  await ws.ensure();
  log.step("orchestrator", `producing "${lessonId}" → ${ws.root}`);

  // 1. Script (human-in-the-loop gate on first generation).
  if (!(await ws.exists(ws.scriptPath))) {
    await runScriptAgent(ws);
    if (opts.review !== false) {
      const msg = `Generated ${ws.scriptPath}. Review/edit it, then re-run to build the draft.`;
      log.ok("orchestrator", msg);
      return { lessonId, status: "awaiting-script-review", segments: 0, totalDuration: 0, message: msg };
    }
  }

  // 2. Parse script → segments.json (source of truth for all agents).
  const manifest = parseScript(await fs.readFile(ws.scriptPath, "utf8"));
  await ws.writeManifest(manifest);
  log.info("orchestrator", `${manifest.segments.length} segments`);

  // 3. Slides + Voice in parallel (independent assets).
  const [slides, timeline] = await Promise.all([
    runSlidesAgent(ws, manifest, { renderer: opts.renderer }),
    runVoiceAgent(ws, manifest),
  ]);

  // 4. Timing authority → alignment.
  const alignment = computeAlignment(manifest, timeline);
  await ws.writeAlignment(alignment);

  // 5. Recording agent (needs durations).
  const recording = await runRecordingAgent(ws, manifest, timeline, {
    placeholders: opts.placeholders ?? true,
    renderer: opts.renderer,
  });

  // 6. Assemble onto the timeline backend.
  const plan = buildPlan(manifest, alignment, timeline, recording, ws);
  await writeProjectFile(ws, plan);
  const backend = makeBackend(chooseBackendName(opts.backend));
  if (opts.clean && backend.clear) {
    log.step("orchestrator", "clearing timeline before assemble (--clean)");
    const cleared = await backend.clear({ media: opts.cleanMedia });
    log.info("orchestrator", `removed ${cleared.removedClips} clip(s), ${cleared.deletedMedia} media asset(s)`);
  }
  log.step("orchestrator", `assembling via ${backend.name} backend`);
  const assemble = await backend.assemble(plan, ws);

  // 7. Notify human.
  const message =
    `Draft assembled for "${lessonId}" (${manifest.segments.length} segments, ` +
    `${alignment.totalDuration.toFixed(1)}s)` +
    (assemble.output ? ` → ${assemble.output}` : " on the Palmier timeline") +
    `. Review and give feedback by timestamp.`;
  log.ok("orchestrator", message);

  return {
    lessonId,
    status: "assembled",
    segments: manifest.segments.length,
    totalDuration: alignment.totalDuration,
    slides,
    assemble,
    message,
  };
}

export type FeedbackKind = "narration" | "slide" | "recording" | "retime";

export interface CorrectionOptions {
  at?: string; // timestamp like "1:23"
  segId?: string;
  kind: FeedbackKind;
  backend?: BackendName;
  renderer?: RendererOptions;
}

/**
 * Correction loop: resolve the target segment (by timestamp or id), re-dispatch
 * the right agent, recompute timing, and re-assemble / swap the clip.
 */
export async function correct(lessonId: string, opts: CorrectionOptions): Promise<ProductionResult> {
  const ws = Workspace.for(lessonId);
  const manifest = await ws.readManifest();
  const alignment0 = await ws.readAlignment();

  let segId = opts.segId;
  if (!segId && opts.at) {
    const seconds = parseFloatTimestamp(opts.at);
    segId = segmentAt(alignment0, seconds);
  }
  if (!segId) throw new Error("could not resolve a segment to correct (pass --seg or --at)");
  log.step("correct", `segment ${segId} · ${opts.kind}`);

  if (opts.kind === "narration") {
    await runVoiceAgent(ws, manifest, { only: [segId] });
  } else if (opts.kind === "slide") {
    await runSlidesAgent(ws, manifest, { only: [segId], renderer: opts.renderer });
  }
  // retime/recording: re-run recording agent for this segment after re-reading timeline.
  const timeline = await ws.readTimeline();
  if (opts.kind === "recording" || opts.kind === "retime") {
    await runRecordingAgent(ws, manifest, timeline, { only: [segId], renderer: opts.renderer });
  }

  const alignment = computeAlignment(manifest, timeline);
  await ws.writeAlignment(alignment);
  const recording = (await ws.exists(ws.recordingManifestPath)) ? await ws.readRecordingManifest() : undefined;
  const plan = buildPlan(manifest, alignment, timeline, recording, ws);
  await writeProjectFile(ws, plan);

  const backend = makeBackend(chooseBackendName(opts.backend));
  let assemble: AssembleResult;
  if (backend.swap) {
    await backend.swap(plan, segId, ws);
    assemble = { backend: backend.name, clipCount: 1 };
  } else {
    assemble = await backend.assemble(plan, ws);
  }
  const message = `Corrected segment ${segId} (${opts.kind}).`;
  log.ok("correct", message);
  return {
    lessonId,
    status: "assembled",
    segments: manifest.segments.length,
    totalDuration: alignment.totalDuration,
    assemble,
    message,
  };
}

async function writeProjectFile(ws: Workspace, plan: unknown): Promise<void> {
  await fs.writeFile(path.join(ws.root, "project.palmier"), JSON.stringify(plan, null, 2) + "\n", "utf8");
}

function parseFloatTimestamp(input: string): number {
  const parts = input.split(":").map((p) => Number.parseFloat(p));
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}
