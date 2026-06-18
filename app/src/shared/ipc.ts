import type { EngineEvent } from "vibedevview/events";

export type { EngineEvent };

/** Backend the engine assembles onto. ffmpeg works anywhere; palmier needs a Mac + Palmier Pro. */
export type BackendName = "ffmpeg" | "palmier";

/** Kinds of surgical correction, mirroring the engine's FeedbackKind. */
export type FeedbackKind = "narration" | "slide" | "recording" | "retime";

/** One row of `palmier status <id> --json`. */
export interface StatusSegment {
  id: string;
  label: string | null;
  phase: string | null;
  frame: string | null;
  kinds: { say: boolean; slide: boolean; do: boolean };
  start: number | null;
  end: number | null;
  duration: number;
}

export interface StatusResult {
  lessonId: string;
  title: string;
  totalDuration: number | null;
  segments: StatusSegment[];
}

/** One row of `palmier doctor --json`. */
export interface DoctorCheck {
  name: string;
  ok: boolean;
  detail: string;
  fix?: string;
}
export interface DoctorResult {
  ok: boolean;
  checks: DoctorCheck[];
}

export interface ProduceRequest {
  lessonId: string;
  backend: BackendName;
  review: boolean;
}

export interface CorrectRequest {
  lessonId: string;
  segId: string;
  kind: FeedbackKind;
  backend: BackendName;
}

export interface DraftRequest {
  lessonId: string;
  brief: string;
}

/** Result of a long-running engine run, returned once the process exits. */
export interface RunResult {
  ok: boolean;
  /** The {type:"result"} payload, when the run produced one. */
  result?: Extract<EngineEvent, { type: "result" }>["result"];
  /** Stderr tail, for surfacing failures. */
  error?: string;
}

/**
 * The typed surface the preload bridge exposes on `window.studio`. Every method
 * is a thin client over the engine CLI; nothing reimplements engine logic.
 */
export interface StudioApi {
  listLessons(): Promise<string[]>;
  readScript(lessonId: string): Promise<string | null>;
  writeScript(lessonId: string, text: string): Promise<void>;
  status(lessonId: string): Promise<StatusResult>;
  doctor(): Promise<DoctorResult>;
  /** Draft a script.md from a topic brief via the engine's LLM drafter. Returns the markdown. */
  draft(req: DraftRequest): Promise<string>;
  /** Run a full produce; progress events stream via onEvent. */
  produce(req: ProduceRequest): Promise<RunResult>;
  /** Surgical single-segment correction; progress events stream via onEvent. */
  correct(req: CorrectRequest): Promise<RunResult>;
  /** Subscribe to engine progress events. Returns an unsubscribe fn. */
  onEvent(handler: (event: EngineEvent) => void): () => void;
  /** PNG path -> file:// URL the renderer can show, when a produce has rendered slides. */
  slideUrl(lessonId: string, frameId: string): Promise<string | null>;
}

declare global {
  interface Window {
    studio?: StudioApi;
  }
}
