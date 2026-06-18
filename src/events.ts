import type { ProductionResult } from "./orchestrator.js";

/**
 * Machine-readable progress events emitted by the engine. The CLI can serialize
 * these as NDJSON on stdout (`--json`) so a client (vibedevview Studio) can show
 * live status without scraping the human log. Everything here mirrors data the
 * agents already compute; emitting events never changes engine behavior.
 */
export type EngineEvent =
  | { type: "phase"; name: PhaseName; status: "start" | "done" }
  | { type: "slide.rendered"; frameId: string; path: string; verified: boolean; reason?: string }
  | { type: "voice.done"; segId: string; duration: number; source: "tts" | "estimate" | "silent" }
  | { type: "assemble.placed"; clipCount: number; output?: string }
  | { type: "status"; scope: string; message: string }
  | { type: "error"; scope: string; message: string }
  | { type: "result"; result: ProductionResult };

export type PhaseName = "script" | "slides" | "voice" | "recording" | "assemble";

/** A sink the engine calls for each event. Defaults to a no-op when absent. */
export type EngineEventSink = (event: EngineEvent) => void;

/** No-op sink so call sites can avoid null checks. */
export const noopSink: EngineEventSink = () => {};
