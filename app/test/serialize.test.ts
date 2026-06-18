import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseScript } from "vibedevview/script/parse";
import { serializeScript } from "../src/renderer/lib/serialize";

const dir = path.dirname(fileURLToPath(import.meta.url));
const examplePath = path.resolve(dir, "../../examples/B-AB1/script.md");

/**
 * Contract for serializeScript(manifest):
 *  - produces script.md text that parseScript reads back into an equivalent
 *    manifest (the round-trip invariant the structured editor depends on).
 *  - preserves every field the structured form can edit: ids, labels, phase,
 *    durationEstimate, voice, silent, frameId, say, full SlideSpec, and DO steps.
 *  - is idempotent: serializing the re-parsed manifest yields identical text.
 */
describe("serializeScript round-trip", () => {
  const src = readFileSync(examplePath, "utf8");
  const m1 = parseScript(src);

  it("parse(serialize(parse(example))) deep-equals parse(example)", () => {
    const m2 = parseScript(serializeScript(m1));
    expect(m2).toEqual(m1);
  });

  it("is idempotent at the text level after one normalization pass", () => {
    const once = serializeScript(m1);
    const twice = serializeScript(parseScript(once));
    expect(twice).toBe(once);
  });

  it("preserves a slide edit through the round-trip (title change on first slide seg)", () => {
    const idx = m1.segments.findIndex((s) => s.slide);
    expect(idx).toBeGreaterThanOrEqual(0);
    const edited = structuredClone(m1);
    edited.segments[idx]!.slide!.title = "A Brand New Title";
    const back = parseScript(serializeScript(edited));
    expect(back.segments[idx]!.slide!.title).toBe("A Brand New Title");
    // Untouched neighbors are unchanged.
    expect(back.segments).toEqual(edited.segments);
  });

  it("preserves a narration edit and keeps timing estimate intact", () => {
    const idx = m1.segments.findIndex((s) => s.say);
    const edited = structuredClone(m1);
    edited.segments[idx]!.say = "Completely rewritten narration line.";
    const back = parseScript(serializeScript(edited));
    expect(back.segments[idx]!.say).toBe("Completely rewritten narration line.");
    expect(back.segments[idx]!.durationEstimate).toBe(m1.segments[idx]!.durationEstimate);
  });
});
