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

/**
 * Which "brain" drafts the script. `devin`/`claude` shell out to the local
 * agent CLI in headless single-turn mode (no API key needed — uses whatever
 * you're already logged into); `llm` is the engine's `PALMIER_LLM_API_KEY`
 * path (Kimi/Anthropic/OpenAI). Selected via `PALMIER_DRAFT_BACKEND`
 * (`auto` by default: prefer `devin`, then `claude`, else `llm`).
 */
export type DraftBackend = "devin" | "claude" | "llm";

export interface DraftResult {
  /** The drafted script.md markdown (fences stripped). */
  script: string;
  /** Which backend produced it, so the UI can show "Drafted via Devin". */
  backend: DraftBackend;
}

/** `palmier export <id>` result (ffprobe-verified single MP4). */
export interface ExportResult {
  lessonId: string;
  path: string;
  clipCount: number;
  expectedDuration: number;
  durationSeconds: number;
  driftSeconds: number;
  withinTolerance: boolean;
  width: number;
  height: number;
  fps: number;
  sizeBytes: number;
  notes: string[];
}

/** `palmier export-slides <id>` result — rendered slide PNGs copied next to the script. */
export interface ExportSlidesResult {
  lessonId: string;
  /** Directory the slides were written to (the `slides-export/` folder). */
  dir: string;
  /** Dest filenames written, in segment order (`<segId>-<frameId>.png`). */
  files: string[];
  /** Frame ids that have a SLIDE in the script but no rendered PNG yet. */
  missing: string[];
  deckCopied: boolean;
  /** Total slide segments in the script (written + missing). */
  slideCount: number;
}

/** `palmier publish <id>` result. The GUI always runs this dry-run. */
export interface PublishResult {
  lessonId: string;
  file: string;
  sizeBytes: number;
  dryRun: boolean;
  receiptPath: string;
  target: string;
  assetId: string | null;
  playbackId: string | null;
  videoUrl: string | null;
  status: string;
}

/** `palmier attach <id> --target sql` result (the GUI's dry-run LMS preview). */
export interface AttachResult {
  lessonId: string;
  target: string;
  applied: boolean;
  dryRun: boolean;
  course: string;
  lessonSlug: string;
  playbackId: string | null;
  sectionCount: number;
  momentCount: number;
  checkpointCount: number;
  jsonPath: string;
  sqlPath: string;
  notes: string[];
}

/** One deliver step succeeded (result) or could not run yet (error). */
export type DeliverOutcome<T> = { ok: true; value: T } | { ok: false; error: string };

/** The dry-run deliver preview the panel renders: export → publish → attach (sql). */
export interface DeliverPreview {
  export: DeliverOutcome<ExportResult>;
  publish: DeliverOutcome<PublishResult>;
  attach: DeliverOutcome<AttachResult>;
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
  /** Scaffold a new lesson folder (seeded with the example script). Returns the id. */
  newLesson(lessonId: string): Promise<string>;
  readScript(lessonId: string): Promise<string | null>;
  writeScript(lessonId: string, text: string): Promise<void>;
  status(lessonId: string): Promise<StatusResult>;
  doctor(): Promise<DoctorResult>;
  /**
   * Draft a script.md from a topic brief. Uses a local agent CLI (Devin/Claude)
   * when available, else the engine's `PALMIER_LLM_API_KEY` drafter. Returns the
   * markdown plus which backend produced it.
   */
  draft(req: DraftRequest): Promise<DraftResult>;
  /** Run a full produce; progress events stream via onEvent. */
  produce(req: ProduceRequest): Promise<RunResult>;
  /** Surgical single-segment correction; progress events stream via onEvent. */
  correct(req: CorrectRequest): Promise<RunResult>;
  /**
   * Run the deliver chain in its safe-by-default (dry-run) mode for the GUI:
   * `export` → `publish --target dryrun` → `attach --target sql` (never `--apply`).
   * Writes nothing to Mux or any DB; each step degrades to an error string if a
   * prerequisite (produced assets / `moments.yaml`) is missing.
   */
  deliverPreview(lessonId: string): Promise<DeliverPreview>;
  /**
   * Copy the lesson's rendered slide PNGs (+ `deck.html`) into a `slides-export/`
   * folder next to its `script.md`, named in segment order. Reads + copies only;
   * never renders or publishes. Un-rendered slides are reported, not fatal.
   */
  exportSlides(lessonId: string): Promise<ExportSlidesResult>;
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
