import { z } from "zod";

/**
 * The HGDW frame types. The Slides Agent renders each, the verifier checks
 * each, and HGDW-DESIGN.md documents them. This array is the source of truth.
 *
 *   N* — narrative / structural   C* — content   D* — demo   O* — outro
 */
export const FRAME_TYPES = [
  "N1-title", //   big title card (gradient)
  "N2-section", // section divider
  "N3-quote", //   large mantra / quote
  "N4-vocab", //   vocab tags (typically silent, visual-only)
  "N5-agenda", //  roadmap / agenda list
  "C1-bullets", // title + bullet list
  "C2-statement", // single big statement
  "C3-compare", // two-column comparison
  "C4-steps", //   numbered steps
  "C5-callout", // callout / warning box
  "C6-code", //    code block
  "C7-stat", //    big stat / number
  "C8-figure", //  image / figure with caption
  "C9-grid", //    infographic: grid of stat/info cards
  "C10-flow", //   infographic: horizontal process flow (A → B → C)
  "D1-placeholder", // dark demo placeholder (app eyebrow) — used when a recording is missing
  "D2-lowerthird", // lower-third label overlay for a recording
  "O1-outro", //   closing / CTA card
] as const;

export const FrameTypeSchema = z.enum(FRAME_TYPES);
export type FrameType = z.infer<typeof FrameTypeSchema>;

export const BackgroundSchema = z.enum(["gradient", "dark", "light"]);
export type Background = z.infer<typeof BackgroundSchema>;

/** A column for the C3-compare frame. */
export const ColumnSchema = z.object({
  heading: z.string(),
  items: z.array(z.string()).default([]),
});

/** A card for the C9-grid infographic frame: an optional big stat, a label, and an optional detail line. */
export const CardSchema = z.object({
  stat: z.string().optional(),
  title: z.string(),
  body: z.string().optional(),
});
export type Card = z.infer<typeof CardSchema>;

/** Declarative slide spec parsed from a SLIDE YAML block in script.md. */
export const SlideSpecSchema = z.object({
  frame: FrameTypeSchema,
  bg: BackgroundSchema.optional(),
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  body: z.array(z.string()).optional(),
  code: z.string().optional(),
  lang: z.string().optional(),
  stat: z.string().optional(),
  statLabel: z.string().optional(),
  caption: z.string().optional(),
  image: z.string().optional(),
  tags: z.array(z.string()).optional(),
  columns: z.array(ColumnSchema).optional(),
  cards: z.array(CardSchema).optional(),
  footer: z.string().optional(),
});
export type SlideSpec = z.infer<typeof SlideSpecSchema>;

/** A single action inside a DO (recording) block. */
export const DoStepSchema = z.object({
  action: z.string(),
  target: z.string().optional(),
  note: z.string().optional(),
});
export type DoStep = z.infer<typeof DoStepSchema>;

/**
 * A segment is the atomic production unit. It may carry any of SAY (narration),
 * SLIDE (a rendered frame) and DO (a screen recording). The Slides + Voice
 * agents read these to produce assets; the orchestrator places them on tracks.
 */
export const SegmentSchema = z.object({
  id: z.string(), //            "01", "09" — stable, used in filenames
  frameId: z.string(), //       slide identity, e.g. "N1", "C1a" — filenames
  label: z.string().optional(), // human label for the segment
  phase: z.enum(["SOURCE", "ABSORB", "MIRROR", "COMMAND"]).optional(),
  say: z.string().optional(),
  slide: SlideSpecSchema.optional(),
  do: z.array(DoStepSchema).optional(),
  voice: z.string().optional(), // voice name or id override
  silent: z.boolean().default(false),
  durationEstimate: z.number().positive(), // seconds, from the Script Agent
});
export type Segment = z.infer<typeof SegmentSchema>;

/** segments.json — the parsed manifest the orchestrator drives from. */
export const ManifestSchema = z.object({
  lessonId: z.string(),
  title: z.string(),
  track: z.string().optional(), // e.g. "BUILD / ABSORB 1"
  voiceDefault: z.string().default("Ja'dan"),
  segments: z.array(SegmentSchema),
});
export type Manifest = z.infer<typeof ManifestSchema>;

/** timeline.json — the timing authority, written by the Voice Agent. */
export const TimelineEntrySchema = z.object({
  audioPath: z.string().optional(),
  duration: z.number().nonnegative(),
  source: z.enum(["tts", "estimate", "silent"]),
});
export const TimelineSchema = z.object({
  lessonId: z.string(),
  fps: z.number().int().positive().default(24),
  segments: z.record(z.string(), TimelineEntrySchema),
});
export type Timeline = z.infer<typeof TimelineSchema>;
export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;

/** alignment.json — cumulative start/end timestamps derived from timeline.json. */
export const AlignmentEntrySchema = z.object({
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
  duration: z.number().nonnegative(),
});
export const AlignmentSchema = z.object({
  lessonId: z.string(),
  totalDuration: z.number().nonnegative(),
  segments: z.record(z.string(), AlignmentEntrySchema),
});
export type Alignment = z.infer<typeof AlignmentSchema>;
export type AlignmentEntry = z.infer<typeof AlignmentEntrySchema>;

/** recording-manifest.json — what the Recording Agent produced / flagged. */
export const RecordingEntrySchema = z.object({
  status: z.enum(["recorded", "placeholder", "todo"]),
  path: z.string().optional(),
  duration: z.number().nonnegative(),
  checklist: z.array(z.string()).optional(),
});
export const RecordingManifestSchema = z.object({
  lessonId: z.string(),
  segments: z.record(z.string(), RecordingEntrySchema),
});
export type RecordingManifest = z.infer<typeof RecordingManifestSchema>;
export type RecordingEntry = z.infer<typeof RecordingEntrySchema>;

// ── Derivations ─────────────────────────────────────────────────────────────

export function hasSay(seg: Segment): boolean {
  return !!seg.say && !seg.silent;
}
export function hasSlide(seg: Segment): boolean {
  return !!seg.slide;
}
export function hasDo(seg: Segment): boolean {
  return !!seg.do && seg.do.length > 0;
}
