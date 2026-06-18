import { hasSlide, type Manifest, type SlideSpec } from "../types.js";
import { buildDeck, defaultBg, type DeckSlide } from "../slides/deck-template.js";
import { SlideRenderer, type RendererOptions } from "../slides/renderer.js";
import { verifySlide } from "../slides/verify.js";
import { log } from "../util/log.js";
import { noopSink, type EngineEventSink } from "../events.js";
import type { Workspace } from "../workspace.js";

const SCOPE = "slides";

export interface SlidesAgentOptions {
  only?: string[];
  renderer?: RendererOptions;
  onEvent?: EngineEventSink;
}

export interface SlideResult {
  frameId: string;
  path: string;
  verified: boolean;
  reason?: string;
}

/**
 * Slides Agent — builds an HTML deck from the SLIDE specs, renders each frame
 * to a 1920x1080 PNG, and verifies each individually (color-family check, the
 * lightweight analogue of ViMax's VLM consistency check). Never batches
 * verification: a bad render is flagged before the next frame.
 */
export async function runSlidesAgent(
  ws: Workspace,
  manifest: Manifest,
  opts: SlidesAgentOptions = {},
): Promise<SlideResult[]> {
  await ws.ensure();
  const only = opts.only ? new Set(opts.only) : undefined;

  const slides: DeckSlide[] = manifest.segments
    .filter((s) => hasSlide(s) && (!only || only.has(s.id)))
    .map((s) => ({ frameId: s.frameId, spec: s.slide as SlideSpec }));

  if (slides.length === 0) {
    log.warn(SCOPE, "no slides to render");
    return [];
  }

  const onEvent = opts.onEvent ?? noopSink;
  const deckHtml = buildDeck(slides);
  const renderer = new SlideRenderer(opts.renderer);
  const results: SlideResult[] = [];

  log.step(SCOPE, `rendering ${slides.length} slide(s) via ${renderer["opts"].mode} renderer`);
  await renderer.open();
  try {
    await renderer.renderDeck(
      deckHtml,
      ws.deckPath,
      slides,
      (frameId) => ws.slidePath(frameId),
      async (frameId, pngPath) => {
        const spec = slides.find((s) => s.frameId === frameId)!.spec;
        const bg = spec.bg ?? defaultBg(spec.frame);
        const v = await verifySlide(pngPath, bg);
        results.push({ frameId, path: pngPath, verified: v.ok, reason: v.reason });
        onEvent({ type: "slide.rendered", frameId, path: pngPath, verified: v.ok, reason: v.reason });
        if (v.ok) log.ok(SCOPE, `${frameId} (${spec.frame}) ✓`);
        else log.warn(SCOPE, `${frameId} (${spec.frame}) verification failed: ${v.reason}`);
      },
    );
  } finally {
    await renderer.close();
  }

  const failed = results.filter((r) => !r.verified);
  if (failed.length) log.warn(SCOPE, `${failed.length}/${results.length} slides failed verification`);
  else log.ok(SCOPE, `all ${results.length} slides verified`);
  return results;
}
