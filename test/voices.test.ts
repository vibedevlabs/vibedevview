import { describe, expect, it } from "vitest";
import { resolveVoice, VOICES } from "../src/voices.js";

/**
 * Contract for resolveVoice(nameOrId):
 *  - undefined / empty -> Ja'dan (HGDW default voice).
 *  - a known roster key -> that exact config (name + id), incl. Courtney when named.
 *  - an unknown string that looks like an ElevenLabs id (>=18 alnum)
 *    -> a passthrough config {id: input, name: input}.
 *  - any other unknown string -> Ja'dan fallback.
 */
describe("resolveVoice", () => {
  it("returns Ja'dan for undefined", () => {
    expect(resolveVoice(undefined)).toEqual({ name: "Ja'dan", id: "zNqgrf8rS1DSYcSbugQi" });
  });

  it("resolves the Ja'dan roster entry to its real ElevenLabs id", () => {
    expect(resolveVoice("Ja'dan")).toEqual({ name: "Ja'dan", id: "zNqgrf8rS1DSYcSbugQi" });
  });

  it("treats the Jadan alias as the same voice id as Ja'dan", () => {
    expect(resolveVoice("Jadan").id).toBe(VOICES["Ja'dan"]!.id);
  });

  it("still resolves Courtney to her real id when named explicitly", () => {
    expect(resolveVoice("Courtney")).toEqual({ name: "Courtney", id: "lH8FzgwcPEePseQlJiNj" });
  });

  it("passes through a raw 20-char ElevenLabs id unchanged", () => {
    const raw = "AbCdEf0123456789XyZw";
    expect(resolveVoice(raw)).toEqual({ id: raw, name: raw });
  });

  it("falls back to Ja'dan for a short/unknown name", () => {
    expect(resolveVoice("bob").id).toBe("zNqgrf8rS1DSYcSbugQi");
    expect(resolveVoice("short").name).toBe("Ja'dan"); // 5 chars, not an id
  });

  it("treats empty string as a falsy default (Ja'dan)", () => {
    expect(resolveVoice("").name).toBe("Ja'dan");
  });
});
