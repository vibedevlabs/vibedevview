import { promises as fs } from "node:fs";
import { pathToFileURL } from "node:url";
import { chromium, type Browser, type BrowserContext } from "playwright";
import { VIDEO } from "../brand.js";

export type RendererMode = "launch" | "cdp";

export interface RendererOptions {
  mode?: RendererMode;
  cdpUrl?: string;
  chromePath?: string;
}

/**
 * Renders deck slides to 1920x1080 PNGs. Supports two modes:
 *   launch — Playwright launches its own Chromium (portable; macOS/CI default)
 *   cdp    — attach to an already-running Chrome over CDP (zero-install)
 */
export class SlideRenderer {
  private browser?: Browser;
  private context?: BrowserContext;
  private ownsBrowser = false;
  private readonly opts: Required<RendererOptions>;

  constructor(opts: RendererOptions = {}) {
    this.opts = {
      mode: opts.mode ?? (process.env.PALMIER_RENDERER as RendererMode) ?? "launch",
      cdpUrl: opts.cdpUrl ?? process.env.PALMIER_CDP_URL ?? "http://localhost:29229",
      chromePath: opts.chromePath ?? process.env.PALMIER_CHROME_PATH ?? "",
    };
  }

  async open(): Promise<void> {
    if (this.opts.mode === "cdp") {
      this.browser = await chromium.connectOverCDP(this.opts.cdpUrl);
      this.ownsBrowser = false;
    } else {
      this.browser = await chromium.launch({
        headless: true,
        executablePath: this.opts.chromePath || undefined,
        args: ["--no-sandbox", "--force-color-profile=srgb", "--hide-scrollbars"],
      });
      this.ownsBrowser = true;
    }
    this.context = await this.browser.newContext({
      viewport: { width: VIDEO.cssWidth, height: VIDEO.cssHeight },
      deviceScaleFactor: VIDEO.deviceScaleFactor,
    });
  }

  /**
   * Write the deck HTML to disk and screenshot each frame to `pngFor(frameId)`.
   * Returns the list of written PNG paths in deck order.
   */
  async renderDeck(
    deckHtml: string,
    deckPath: string,
    frames: { frameId: string }[],
    pngFor: (frameId: string) => string,
    onRendered?: (frameId: string, pngPath: string) => Promise<void>,
  ): Promise<string[]> {
    if (!this.context) throw new Error("renderer not opened");
    await fs.writeFile(deckPath, deckHtml, "utf8");
    const page = await this.context.newPage();
    await page.goto(pathToFileURL(deckPath).href, { waitUntil: "load" });
    await page.waitForFunction("window.__deckReady === true", undefined, { timeout: 15000 }).catch(() => {});

    const written: string[] = [];
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i]!;
      await page.evaluate((idx) => (window as unknown as { __show: (n: number) => void }).__show(idx), i);
      // Let the active frame paint (fonts already ready from __deckReady).
      await page.waitForTimeout(120);
      const out = pngFor(frame.frameId);
      await page.screenshot({ path: out, type: "png" });
      written.push(out);
      if (onRendered) await onRendered(frame.frameId, out);
    }
    await page.close();
    return written;
  }

  async close(): Promise<void> {
    await this.context?.close().catch(() => {});
    if (this.ownsBrowser) await this.browser?.close().catch(() => {});
    else await this.browser?.close().catch(() => {}); // disconnect for CDP
  }
}
