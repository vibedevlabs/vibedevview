import { promises as fs } from "node:fs";
import path from "node:path";
import { hasSlide } from "../types.js";
import type { Manifest } from "../types.js";
import { log } from "../util/log.js";
import { Workspace } from "../workspace.js";

/** One slide to export: its source filename in `slides/` and its ordered dest name. */
export interface SlideExportEntry {
  segId: string;
  frameId: string;
  /** Rendered file in the workspace `slides/` dir, e.g. `N1.png`. */
  srcName: string;
  /** Segment-ordered, human-sortable name, e.g. `01-N1.png`. */
  destName: string;
}

/**
 * The ordered set of slides to export, derived from the manifest. Pure: segments
 * keep their authoring order, segments without a SLIDE are skipped, and each kept
 * segment is renamed `<segId>-<frameId>.png` so the exported folder sorts in play
 * order regardless of frame ids. This is the unit-tested contract behind
 * `exportSlides`.
 */
export function slideExportPlan(manifest: Manifest): SlideExportEntry[] {
  return manifest.segments
    .filter((seg) => hasSlide(seg))
    .map((seg) => ({
      segId: seg.id,
      frameId: seg.frameId,
      srcName: `${seg.frameId}.png`,
      destName: `${seg.id}-${seg.frameId}.png`,
    }));
}

export interface ExportSlidesOptions {
  /** Output directory. Defaults to `<workspace>/slides-export` (next to script.md). */
  outDir?: string;
  /** Also copy the rendered `deck.html`. Default true. */
  includeDeck?: boolean;
}

export interface ExportSlidesResult {
  lessonId: string;
  dir: string;
  /** Dest filenames actually written, in segment order. */
  files: string[];
  /** Frame ids that have a SLIDE in the script but no rendered PNG yet. */
  missing: string[];
  deckCopied: boolean;
  slideCount: number;
}

/**
 * Copy a lesson's rendered slide PNGs into a `slides-export/` folder next to its
 * `script.md`, renamed into segment order (`<segId>-<frameId>.png`), plus the
 * `deck.html`. SAFE: reads the manifest + slides and copies files only; never
 * renders, publishes, or touches any external system. Segments whose slide has
 * not been rendered yet are reported in `missing` rather than failing the export.
 */
export async function exportSlides(lessonId: string, opts: ExportSlidesOptions = {}): Promise<ExportSlidesResult> {
  const ws = Workspace.for(lessonId);
  const manifest = await ws.readManifest();
  const plan = slideExportPlan(manifest);

  const dir = opts.outDir ?? path.join(ws.root, "slides-export");
  await fs.mkdir(dir, { recursive: true });

  const files: string[] = [];
  const missing: string[] = [];
  for (const entry of plan) {
    const src = ws.slidePath(entry.frameId);
    if (!(await ws.exists(src))) {
      missing.push(entry.frameId);
      continue;
    }
    await fs.copyFile(src, path.join(dir, entry.destName));
    files.push(entry.destName);
  }

  let deckCopied = false;
  if (opts.includeDeck !== false && (await ws.exists(ws.deckPath))) {
    await fs.copyFile(ws.deckPath, path.join(dir, "deck.html"));
    deckCopied = true;
  }

  log.ok("export-slides", `exported ${files.length}/${plan.length} slide(s) → ${dir}`);
  if (missing.length > 0) {
    log.warn("export-slides", `${missing.length} slide(s) not rendered yet: ${missing.join(", ")} — run \`palmier slides ${lessonId}\` first`);
  }

  return { lessonId, dir, files, missing, deckCopied, slideCount: plan.length };
}
