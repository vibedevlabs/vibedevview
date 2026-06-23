import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { exportSlides, slideExportPlan } from "../src/deliver/export-slides.js";
import type { Manifest, Segment, SlideSpec } from "../src/types.js";

/**
 * Contracts under test:
 *
 * slideExportPlan(manifest): pure. Keeps manifest (authoring) order, drops segments
 *   with no SLIDE, and renames each kept segment `<segId>-<frameId>.png` (source is
 *   `<frameId>.png`). Order is preserved even when ids are not sorted.
 *
 * exportSlides(lessonId): copies rendered `slides/<frameId>.png` → `slides-export/`
 *   under the segment-ordered name, copies `deck.html` (unless includeDeck=false),
 *   and reports un-rendered slides in `missing` rather than throwing.
 */

const SLIDE: SlideSpec = { frame: "C1-bullets", title: "X" };

function seg(id: string, frameId: string, withSlide: boolean): Segment {
  const s: Segment = { id, frameId, silent: false, durationEstimate: 5 };
  if (withSlide) s.slide = SLIDE;
  return s;
}

function manifest(segments: Segment[]): Manifest {
  return { lessonId: "B-DEMO1", title: "Demo", voiceDefault: "Ja'dan", segments };
}

describe("slideExportPlan", () => {
  it("keeps slide segments in order and names them <segId>-<frameId>.png", () => {
    const plan = slideExportPlan(manifest([seg("01", "N1", true), seg("02", "C2", true)]));
    expect(plan).toEqual([
      { segId: "01", frameId: "N1", srcName: "N1.png", destName: "01-N1.png" },
      { segId: "02", frameId: "C2", srcName: "C2.png", destName: "02-C2.png" },
    ]);
  });

  it("skips segments with no SLIDE (e.g. DO-only or SAY-only)", () => {
    const plan = slideExportPlan(manifest([seg("01", "N1", true), seg("02", "X", false), seg("03", "C7", true)]));
    expect(plan.map((e) => e.destName)).toEqual(["01-N1.png", "03-C7.png"]);
  });

  it("returns an empty plan when no segment has a slide", () => {
    expect(slideExportPlan(manifest([seg("01", "x", false)]))).toEqual([]);
  });

  it("preserves authoring order even when segment ids are out of order", () => {
    const plan = slideExportPlan(manifest([seg("10", "Z", true), seg("02", "A", true)]));
    expect(plan.map((e) => e.destName)).toEqual(["10-Z.png", "02-A.png"]);
  });
});

describe("exportSlides (file IO)", () => {
  let dir: string;
  const prev = process.env.PALMIER_PRODUCTIONS_DIR;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(tmpdir(), "palmier-slides-"));
    process.env.PALMIER_PRODUCTIONS_DIR = dir;
  });
  afterEach(async () => {
    if (prev === undefined) delete process.env.PALMIER_PRODUCTIONS_DIR;
    else process.env.PALMIER_PRODUCTIONS_DIR = prev;
    await fs.rm(dir, { recursive: true, force: true });
  });

  async function seedLesson(segments: Segment[], renderedFrames: string[], deck: boolean): Promise<string> {
    const root = path.join(dir, "B-DEMO1");
    await fs.mkdir(path.join(root, "slides"), { recursive: true });
    await fs.writeFile(path.join(root, "segments.json"), JSON.stringify(manifest(segments)), "utf8");
    for (const f of renderedFrames) await fs.writeFile(path.join(root, "slides", `${f}.png`), `png:${f}`, "utf8");
    if (deck) await fs.writeFile(path.join(root, "slides", "deck.html"), "<html></html>", "utf8");
    return root;
  }

  it("copies rendered slides in order + deck.html, and reports missing ones", async () => {
    await seedLesson([seg("01", "N1", true), seg("02", "C2", true), seg("03", "C7", true)], ["N1", "C7"], true);
    const res = await exportSlides("B-DEMO1");

    expect(res.files).toEqual(["01-N1.png", "03-C7.png"]);
    expect(res.missing).toEqual(["C2"]);
    expect(res.slideCount).toBe(3);
    expect(res.deckCopied).toBe(true);

    const exported = (await fs.readdir(res.dir)).sort();
    expect(exported).toEqual(["01-N1.png", "03-C7.png", "deck.html"]);
    expect(await fs.readFile(path.join(res.dir, "01-N1.png"), "utf8")).toBe("png:N1");
  });

  it("skips deck.html when includeDeck is false", async () => {
    await seedLesson([seg("01", "N1", true)], ["N1"], true);
    const res = await exportSlides("B-DEMO1", { includeDeck: false });
    expect(res.deckCopied).toBe(false);
    expect((await fs.readdir(res.dir)).sort()).toEqual(["01-N1.png"]);
  });
});
