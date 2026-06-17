import { promises as fs } from "node:fs";
import path from "node:path";
import {
  hasDo,
  type Manifest,
  type RecordingEntry,
  type RecordingManifest,
  type Segment,
  type SlideSpec,
  type Timeline,
} from "../types.js";
import { buildDeck, type DeckSlide } from "../slides/deck-template.js";
import { SlideRenderer, type RendererOptions } from "../slides/renderer.js";
import { log } from "../util/log.js";
import type { Workspace } from "../workspace.js";

const SCOPE = "record";
const REAL_RECORDING = /\.(mov|mp4|webm|mkv)$/i;

export interface RecordingAgentOptions {
  only?: string[];
  /** Render branded D1 placeholders for segments lacking a real recording. */
  placeholders?: boolean;
  renderer?: RendererOptions;
}

function checklistFor(seg: Segment, duration: number): string[] {
  const steps = (seg.do ?? []).map((d, i) => {
    const target = d.target ? ` — \`${d.target}\`` : "";
    const note = d.note ? ` (${d.note})` : "";
    return `${i + 1}. ${d.action}${target}${note}`;
  });
  return [
    `Target length: ~${duration.toFixed(0)}s (match the voiceover).`,
    "Record at 1920x1080, 24fps.",
    ...steps,
  ];
}

function placeholderSpec(seg: Segment): SlideSpec {
  const firstTarget = seg.do?.find((d) => d.target)?.target;
  const firstAction = seg.do?.[0]?.action;
  return {
    frame: "D1-placeholder",
    bg: "dark",
    eyebrow: firstTarget ?? "SCREEN RECORDING",
    title: seg.label ?? "Screen recording",
    subtitle: firstAction ?? "Recording pending — placeholder shown in draft",
  };
}

async function findExistingRecording(dir: string, segId: string): Promise<string | undefined> {
  let entries: string[] = [];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return undefined;
  }
  const match = entries.find((f) => f.startsWith(`seg-${segId}-`) && REAL_RECORDING.test(f));
  return match ? path.join(dir, match) : undefined;
}

/**
 * Recording Agent — for each DO block, either confirms an existing real screen
 * recording, or (Mode A) emits a step-by-step checklist for the human and
 * renders a branded D1 placeholder so the assembled draft is still complete.
 * Never fabricates a fake recording.
 */
export async function runRecordingAgent(
  ws: Workspace,
  manifest: Manifest,
  timeline: Timeline,
  opts: RecordingAgentOptions = {},
): Promise<RecordingManifest> {
  await ws.ensure();
  const only = opts.only ? new Set(opts.only) : undefined;
  const makePlaceholders = opts.placeholders ?? true;

  const doSegments = manifest.segments.filter((s) => hasDo(s) && (!only || only.has(s.id)));
  const existing = (await ws.exists(ws.recordingManifestPath))
    ? await ws.readRecordingManifest()
    : undefined;
  const segments: Record<string, RecordingEntry> = { ...(existing?.segments ?? {}) };

  const placeholderSegs: { seg: Segment; spec: SlideSpec }[] = [];

  for (const seg of doSegments) {
    const duration = timeline.segments[seg.id]?.duration ?? seg.durationEstimate;
    const real = await findExistingRecording(ws.recordingsDir, seg.id);
    if (real) {
      segments[seg.id] = { status: "recorded", path: real, duration };
      log.ok(SCOPE, `seg ${seg.id} → real recording ${path.basename(real)}`);
      continue;
    }
    const checklist = checklistFor(seg, duration);
    if (makePlaceholders) {
      placeholderSegs.push({ seg, spec: placeholderSpec(seg) });
      segments[seg.id] = {
        status: "placeholder",
        path: path.join(ws.recordingsDir, `seg-${seg.id}-placeholder.png`),
        duration,
        checklist,
      };
    } else {
      segments[seg.id] = { status: "todo", duration, checklist };
    }
    log.warn(SCOPE, `seg ${seg.id} → no recording; ${makePlaceholders ? "placeholder" : "todo"}`);
  }

  if (placeholderSegs.length) {
    const slides: DeckSlide[] = placeholderSegs.map((p) => ({
      frameId: `seg-${p.seg.id}-placeholder`,
      spec: p.spec,
    }));
    const renderer = new SlideRenderer(opts.renderer);
    await renderer.open();
    try {
      await renderer.renderDeck(buildDeck(slides), path.join(ws.recordingsDir, "_placeholders.html"), slides, (id) =>
        path.join(ws.recordingsDir, `${id}.png`),
      );
    } finally {
      await renderer.close();
    }
    log.ok(SCOPE, `rendered ${placeholderSegs.length} placeholder frame(s)`);
  }

  const manifestOut: RecordingManifest = { lessonId: manifest.lessonId, segments };
  await ws.writeRecordingManifest(manifestOut);
  log.ok(SCOPE, `wrote ${ws.recordingManifestPath}`);
  return manifestOut;
}
