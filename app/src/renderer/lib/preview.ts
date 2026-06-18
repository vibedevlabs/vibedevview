import { parseScript } from "vibedevview/script/parse";
import { buildDeck, type DeckSlide } from "vibedevview/slides/deck";
import type { Manifest } from "vibedevview/types";

export interface PreviewFrame {
  segId: string;
  frameId: string;
  index: number;
  label?: string;
}

export interface PreviewDeck {
  html: string;
  frames: PreviewFrame[];
  manifest: Manifest;
  /** segId -> deck frame index, for jumping the preview to the focused segment. */
  indexBySeg: Record<string, number>;
}

/**
 * Build the same self-contained HTML deck the Slides agent renders, straight
 * from the current editor text — no engine call, no Chromium. The renderer
 * shows this in an <iframe> and steps it via `window.__show(i)` / `#index`.
 */
export function buildPreviewDeck(scriptText: string): PreviewDeck {
  const manifest = parseScript(scriptText);
  const slides: DeckSlide[] = [];
  const frames: PreviewFrame[] = [];
  const indexBySeg: Record<string, number> = {};
  for (const seg of manifest.segments) {
    if (!seg.slide) continue;
    const index = slides.length;
    indexBySeg[seg.id] = index;
    frames.push({ segId: seg.id, frameId: seg.frameId, index, label: seg.label });
    slides.push({ frameId: seg.frameId, spec: seg.slide });
  }
  return { html: buildDeck(slides), frames, manifest, indexBySeg };
}
