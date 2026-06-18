import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runVoiceAgent } from "../src/agents/voice-agent.js";
import { Workspace } from "../src/workspace.js";
import type { EngineEvent } from "../src/events.js";
import type { Manifest, Segment } from "../src/types.js";

/**
 * Contract for runVoiceAgent's onEvent sink (offline path, apiKey: ""):
 *  - emits exactly one {type:"voice.done"} per segment, in manifest order.
 *  - a segment WITH `say` and no key -> source:"estimate", duration = durationEstimate.
 *  - a segment WITHOUT `say` (no audio) -> source:"silent",   duration = durationEstimate.
 *  - the emitted duration equals the value written to timeline.json for that segment.
 *  - passing apiKey:"" forces the offline path regardless of ELEVENLABS_API_KEY in env.
 */
function seg(id: string, over: Partial<Segment>): Segment {
  return { id, frameId: id, silent: false, durationEstimate: 4, ...over };
}

describe("runVoiceAgent onEvent emission", () => {
  let root: string;
  let ws: Workspace;
  const manifest: Manifest = {
    lessonId: "T-EV",
    title: "Events",
    voiceDefault: "Ja'dan",
    segments: [
      seg("01", { say: "Hello there world", durationEstimate: 7 }),
      seg("02", { durationEstimate: 5 }), // no say -> silent
      seg("03", { say: "Last one", durationEstimate: 3 }),
    ],
  };

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(tmpdir(), "hgdw-ev-"));
    ws = new Workspace("T-EV", root);
  });
  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("emits one voice.done per segment in order with exact payloads (offline)", async () => {
    const events: EngineEvent[] = [];
    const timeline = await runVoiceAgent(ws, manifest, { apiKey: "", onEvent: (e) => events.push(e) });

    expect(events).toEqual([
      { type: "voice.done", segId: "01", duration: 7, source: "estimate" },
      { type: "voice.done", segId: "02", duration: 5, source: "silent" },
      { type: "voice.done", segId: "03", duration: 3, source: "estimate" },
    ]);

    // The emitted durations must match what landed in the timing authority.
    expect(timeline.segments["01"]).toEqual({ duration: 7, source: "estimate" });
    expect(timeline.segments["02"]).toEqual({ duration: 5, source: "silent" });
    expect(timeline.segments["03"]).toEqual({ duration: 3, source: "estimate" });
  });

  it("respects `only` — emits events solely for the targeted segment (correction path)", async () => {
    const events: EngineEvent[] = [];
    await runVoiceAgent(ws, manifest, { apiKey: "", only: ["02"], onEvent: (e) => events.push(e) });
    expect(events).toEqual([{ type: "voice.done", segId: "02", duration: 5, source: "silent" }]);
  });

  it("defaults to a no-op sink when onEvent is omitted (no throw)", async () => {
    await expect(runVoiceAgent(ws, manifest, { apiKey: "" })).resolves.toBeDefined();
  });
});
