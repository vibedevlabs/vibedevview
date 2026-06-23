import { describe, expect, it } from "vitest";
import { buildDeck, defaultBg, type DeckSlide } from "../src/slides/deck-template.js";
import { SlideSpecSchema, type SlideSpec } from "../src/types.js";

/**
 * Contract for the infographic frames added to the deck template:
 *  - SlideSpecSchema accepts `cards` (C9-grid) and the new frame ids C9-grid / C10-flow.
 *  - renderFrameBody (via buildDeck) emits, for C9-grid: one `.card` per card with
 *    `.card-stat` only when `stat` is set, `.card-title` always, `.card-body` only when
 *    `body` is set; the grid is tagged `.cards--N` capped at 4.
 *  - For C10-flow: one `.flow-step` per `body` entry, numbered 1..N, with a `.flow-arrow`
 *    BETWEEN steps (count = steps - 1, never a leading/trailing arrow).
 *  - HTML is escaped.
 *  - defaultBg for the new content frames is "dark".
 */

function deckFor(spec: SlideSpec): string {
  const slide: DeckSlide = { frameId: "X1", spec };
  return buildDeck([slide]);
}

const count = (haystack: string, needle: string): number => haystack.split(needle).length - 1;

describe("SlideSpecSchema — infographic frames", () => {
  it("accepts a C9-grid with cards (stat optional, title required)", () => {
    const spec = SlideSpecSchema.parse({
      frame: "C9-grid",
      title: "Why it works",
      cards: [{ stat: "80%", title: "faster", body: "vs hand-editing" }, { title: "no setup" }],
    });
    expect(spec.frame).toBe("C9-grid");
    expect(spec.cards).toEqual([
      { stat: "80%", title: "faster", body: "vs hand-editing" },
      { title: "no setup" },
    ]);
  });

  it("accepts a card with an emoji icon", () => {
    const spec = SlideSpecSchema.parse({
      frame: "C11-icons",
      title: "Toolkit",
      cards: [{ icon: "⚡", title: "Fast" }, { icon: "🔒", title: "Safe", body: "RLS-gated" }],
    });
    expect(spec.cards).toEqual([
      { icon: "⚡", title: "Fast" },
      { icon: "🔒", title: "Safe", body: "RLS-gated" },
    ]);
  });

  it("accepts a C10-flow with body steps", () => {
    const spec = SlideSpecSchema.parse({ frame: "C10-flow", title: "Pipeline", body: ["Script", "Slides", "Voice"] });
    expect(spec.frame).toBe("C10-flow");
    expect(spec.body).toEqual(["Script", "Slides", "Voice"]);
  });

  it("rejects a card without a title", () => {
    expect(() => SlideSpecSchema.parse({ frame: "C9-grid", cards: [{ stat: "80%" }] })).toThrow();
  });
});

describe("buildDeck — C9-grid", () => {
  const html = deckFor({
    frame: "C9-grid",
    title: "Three numbers",
    cards: [
      { stat: "80%", title: "faster", body: "vs hand-editing" },
      { title: "zero setup" },
      { stat: "3x", title: "more output" },
    ],
  });

  it("renders one .card per card, tagged .cards--3", () => {
    expect(count(html, '<div class="card">')).toBe(3);
    expect(html).toContain('class="cards cards--3"');
  });

  it("renders .card-stat only for cards that set stat", () => {
    // 2 of 3 cards have a stat
    expect(count(html, '<div class="card-stat">')).toBe(2);
    expect(html).toContain('<div class="card-stat">80%</div>');
    expect(html).toContain('<div class="card-stat">3x</div>');
  });

  it("renders .card-title for every card and .card-body only when body is set", () => {
    expect(count(html, '<div class="card-title">')).toBe(3);
    expect(html).toContain('<div class="card-title">zero setup</div>');
    expect(count(html, '<div class="card-body">')).toBe(1);
    expect(html).toContain('<div class="card-body">vs hand-editing</div>');
  });

  it("caps the grid class at .cards--4 for 5+ cards", () => {
    const five = deckFor({
      frame: "C9-grid",
      title: "Many",
      cards: [1, 2, 3, 4, 5].map((n) => ({ title: `c${n}` })),
    });
    expect(five).toContain("cards--4");
    expect(five).not.toContain("cards--5");
    expect(count(five, '<div class="card">')).toBe(5);
  });

  it("escapes HTML in card fields", () => {
    const evil = deckFor({ frame: "C9-grid", title: "x", cards: [{ title: "<b>x</b>" }] });
    expect(evil).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(evil).not.toContain("<b>x</b>");
  });

  it("renders .card-icon only for cards that set icon", () => {
    const html2 = deckFor({
      frame: "C9-grid",
      title: "mix",
      cards: [{ icon: "📈", title: "up" }, { stat: "9", title: "nine" }],
    });
    expect(count(html2, '<div class="card-icon">')).toBe(1);
    expect(html2).toContain('<div class="card-icon">📈</div>');
  });
});

describe("buildDeck — C11-icons", () => {
  const html = deckFor({
    frame: "C11-icons",
    title: "Your toolkit",
    cards: [
      { icon: "⚡", title: "Fast", body: "One script in, video out." },
      { icon: "🔒", title: "Safe" },
      { icon: "🎯", title: "Focused" },
    ],
  });

  it("renders one .icontile per card, tagged .icongrid--3", () => {
    expect(count(html, '<div class="icontile">')).toBe(3);
    expect(html).toContain('class="icongrid icongrid--3"');
  });

  it("renders the emoji icon and title for each tile, body only when set", () => {
    expect(count(html, '<div class="icontile-icon">')).toBe(3);
    expect(html).toContain('<div class="icontile-icon">⚡</div>');
    expect(html).toContain('<div class="icontile-title">Safe</div>');
    expect(count(html, '<div class="icontile-body">')).toBe(1);
    expect(html).toContain('<div class="icontile-body">One script in, video out.</div>');
  });

  it("falls back to a ✦ glyph when a tile has no icon", () => {
    const noIcon = deckFor({ frame: "C11-icons", title: "x", cards: [{ title: "plain" }] });
    expect(noIcon).toContain('<div class="icontile-icon">✦</div>');
  });

  it("caps the icon grid at .icongrid--3 for 4+ tiles", () => {
    const four = deckFor({
      frame: "C11-icons",
      title: "many",
      cards: [1, 2, 3, 4].map((n) => ({ icon: "🔹", title: `t${n}` })),
    });
    expect(four).toContain("icongrid--3");
    expect(four).not.toContain("icongrid--4");
    expect(count(four, '<div class="icontile">')).toBe(4);
  });

  it("escapes HTML in tile fields", () => {
    const evil = deckFor({ frame: "C11-icons", title: "x", cards: [{ icon: "⚡", title: "<i>x</i>" }] });
    expect(evil).toContain("&lt;i&gt;x&lt;/i&gt;");
    expect(evil).not.toContain("<i>x</i>");
  });
});

describe("buildDeck — C10-flow", () => {
  const html = deckFor({ frame: "C10-flow", title: "Pipeline", body: ["Script", "Slides", "Voice"] });

  it("renders one .flow-step per body entry", () => {
    expect(count(html, '<div class="flow-step">')).toBe(3);
    expect(html).toContain('<span class="flow-label">Slides</span>');
  });

  it("numbers the steps 1..N in order", () => {
    expect(html).toContain('<span class="flow-n">1</span><span class="flow-label">Script</span>');
    expect(html).toContain('<span class="flow-n">3</span><span class="flow-label">Voice</span>');
  });

  it("places an arrow BETWEEN steps only (N-1 arrows, no leading/trailing)", () => {
    expect(count(html, '<div class="flow-arrow">')).toBe(2);
    // first thing inside .flow is a step, not an arrow
    expect(html).toContain('<div class="flow"><div class="flow-step">');
  });

  it("renders no arrows for a single-step flow", () => {
    const one = deckFor({ frame: "C10-flow", title: "x", body: ["only"] });
    expect(count(one, '<div class="flow-arrow">')).toBe(0);
    expect(count(one, '<div class="flow-step">')).toBe(1);
  });
});

describe("defaultBg", () => {
  it("defaults the infographic content frames to dark", () => {
    expect(defaultBg("C9-grid")).toBe("dark");
    expect(defaultBg("C10-flow")).toBe("dark");
    expect(defaultBg("C11-icons")).toBe("dark");
  });
});
