import { describe, expect, it } from "vitest";
import { resolveVoice, VOICES } from "../src/voices.js";

/**
 * Contract for resolveVoice(nameOrId):
 *  - undefined / empty -> Courtney (spec default).
 *  - a known roster key -> that exact config (name + id).
 *  - an unknown string that looks like an ElevenLabs id (>=18 alnum)
 *    -> a passthrough config {id: input, name: input}.
 *  - any other unknown string -> Courtney fallback.
 */
describe("resolveVoice", () => {
  it("returns Courtney for undefined", () => {
    expect(resolveVoice(undefined)).toEqual({ name: "Courtney", id: "lH8FzgwcPEePseQlJiNj" });
  });

  it("resolves the Ja'dan roster entry to its real ElevenLabs id", () => {
    expect(resolveVoice("Ja'dan")).toEqual({ name: "Ja'dan", id: "zNqgrf8rS1DSYcSbugQi" });
  });

  it("treats the Jadan alias as the same voice id as Ja'dan", () => {
    expect(resolveVoice("Jadan").id).toBe(VOICES["Ja'dan"]!.id);
  });

  it("passes through a raw 20-char ElevenLabs id unchanged", () => {
    const raw = "AbCdEf0123456789XyZw";
    expect(resolveVoice(raw)).toEqual({ id: raw, name: raw });
  });

  it("falls back to Courtney for a short/unknown name", () => {
    expect(resolveVoice("bob").id).toBe("lH8FzgwcPEePseQlJiNj");
    expect(resolveVoice("short").name).toBe("Courtney"); // 5 chars, not an id
  });

  it("treats empty string as a falsy default (Courtney)", () => {
    expect(resolveVoice("").name).toBe("Courtney");
  });
});
