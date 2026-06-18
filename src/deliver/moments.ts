import { promises as fs } from "node:fs";
import YAML from "yaml";
import { z } from "zod";
import { computeAlignment, parseTimestamp } from "../alignment.js";
import type { Alignment } from "../types.js";
import { log } from "../util/log.js";
import { Workspace } from "../workspace.js";

// ── Authoring format (moments.yaml, sits beside the script) ──────────────────

export const MOMENT_KINDS = ["prompt", "snippet", "link", "file", "note", "pause"] as const;
export type MomentKind = (typeof MOMENT_KINDS)[number];

/** DB artifact_kind enum — `pause` is not an artifact, it becomes is_checkpoint. */
export const ARTIFACT_KINDS = ["prompt", "link", "snippet", "file", "note"] as const;
export type ArtifactKind = (typeof ARTIFACT_KINDS)[number];

const AnchorSchema = z.object({
  at: z.string().optional(),
  seg: z.string().optional(),
  offset: z.number().optional(),
});

const SectionSchema = AnchorSchema.extend({ title: z.string().min(1) });

const MomentSchema = AnchorSchema.extend({
  kind: z.enum(MOMENT_KINDS),
  title: z.string().min(1),
  description: z.string().optional(),
  artifactTitle: z.string().optional(),
  body: z.string().optional(),
  url: z.string().optional(),
  copyable: z.boolean().optional(),
  instructions: z.string().optional(),
  cta: z.string().optional(),
});

const LessonRefSchema = z.object({
  course: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().optional(),
  content: z.string().optional(),
});

export const MomentsDocSchema = z.object({
  lesson: LessonRefSchema,
  sections: z.array(SectionSchema).default([]),
  moments: z.array(MomentSchema).default([]),
});
export type MomentsDoc = z.infer<typeof MomentsDocSchema>;
export type AuthoredMoment = z.infer<typeof MomentSchema>;

// ── Compiled (absolute-time) representation ──────────────────────────────────

export interface CompiledSection {
  title: string;
  startSeconds: number;
  sortOrder: number;
}

export interface CompiledMoment {
  startSeconds: number;
  title: string;
  description: string | null;
  artifactKind: ArtifactKind | null;
  artifactTitle: string | null;
  artifactBody: string | null;
  artifactUrl: string | null;
  artifactCopyable: boolean;
  isCheckpoint: boolean;
  checkpointInstructions: string | null;
  checkpointCtaLabel: string | null;
  sortOrder: number;
}

export interface CompiledMoments {
  lesson: { course: string; slug: string; title: string | null; content: string | null };
  sections: CompiledSection[];
  moments: CompiledMoment[];
}

const DEFAULT_CTA = "I did it — continue";

/** Resolve a `seg:`/`at:` anchor to an absolute timestamp using the alignment. */
function resolveAnchor(
  a: { at?: string; seg?: string; offset?: number },
  alignment: Alignment,
  label: string,
): number {
  let base: number;
  if (a.seg !== undefined) {
    const entry = alignment.segments[a.seg];
    if (!entry) throw new Error(`${label}: unknown segment "${a.seg}"`);
    base = entry.start + (a.offset ?? 0);
  } else if (a.at !== undefined) {
    base = parseTimestamp(a.at) + (a.offset ?? 0);
  } else {
    throw new Error(`${label}: must specify "at" (timestamp) or "seg" (segment id)`);
  }
  if (base < 0) throw new Error(`${label}: resolved to negative time ${base.toFixed(3)}`);
  if (base > alignment.totalDuration + 0.001) {
    throw new Error(
      `${label}: resolved time ${base.toFixed(2)}s exceeds video length ${alignment.totalDuration.toFixed(2)}s`,
    );
  }
  return Number(base.toFixed(3));
}

/** Map an authoring `kind` to the LMS artifact/checkpoint columns. Pure. */
export function mapMomentKind(m: AuthoredMoment): {
  artifactKind: ArtifactKind | null;
  artifactBody: string | null;
  artifactUrl: string | null;
  artifactCopyable: boolean;
  isCheckpoint: boolean;
  checkpointInstructions: string | null;
  checkpointCtaLabel: string | null;
} {
  const body = m.body ?? null;
  const url = m.url ?? null;
  switch (m.kind) {
    case "prompt":
    case "snippet":
    case "note":
      return {
        artifactKind: m.kind,
        artifactBody: body,
        artifactUrl: null,
        artifactCopyable: m.copyable ?? true,
        isCheckpoint: false,
        checkpointInstructions: null,
        checkpointCtaLabel: null,
      };
    case "link":
      return {
        artifactKind: "link",
        artifactBody: null,
        artifactUrl: url,
        artifactCopyable: m.copyable ?? true,
        isCheckpoint: false,
        checkpointInstructions: null,
        checkpointCtaLabel: null,
      };
    case "file":
      return {
        artifactKind: "file",
        artifactBody: null,
        artifactUrl: url,
        artifactCopyable: m.copyable ?? false,
        isCheckpoint: false,
        checkpointInstructions: null,
        checkpointCtaLabel: null,
      };
    case "pause":
      return {
        artifactKind: body ? "note" : null,
        artifactBody: body,
        artifactUrl: null,
        artifactCopyable: m.copyable ?? false,
        isCheckpoint: true,
        checkpointInstructions: m.instructions ?? null,
        checkpointCtaLabel: m.cta ?? DEFAULT_CTA,
      };
    default: {
      const exhaustive: never = m.kind;
      throw new Error(`unknown moment kind: ${String(exhaustive)}`);
    }
  }
}

/**
 * Resolve all sections + moments to absolute seconds, sort by time, and assign
 * sort_order. Pure — given the same doc + alignment it always yields the same
 * rows, which is what makes the emitted SQL idempotent.
 */
export function compileMoments(doc: MomentsDoc, alignment: Alignment): CompiledMoments {
  const sections: CompiledSection[] = doc.sections
    .map((s, i): CompiledSection => ({
      title: s.title,
      startSeconds: resolveAnchor(s, alignment, `section[${i}] "${s.title}"`),
      sortOrder: 0,
    }))
    .sort((a, b) => a.startSeconds - b.startSeconds)
    .map((s, i): CompiledSection => ({ ...s, sortOrder: i + 1 }));

  const moments: CompiledMoment[] = doc.moments
    .map((m, i): CompiledMoment => {
      const mapped = mapMomentKind(m);
      return {
        startSeconds: resolveAnchor(m, alignment, `moment[${i}] "${m.title}"`),
        title: m.title,
        description: m.description ?? null,
        artifactTitle: m.artifactTitle ?? null,
        ...mapped,
        sortOrder: 0,
      };
    })
    .sort((a, b) => a.startSeconds - b.startSeconds)
    .map((m, i): CompiledMoment => ({ ...m, sortOrder: i + 1 }));

  return {
    lesson: {
      course: doc.lesson.course,
      slug: doc.lesson.slug,
      title: doc.lesson.title ?? null,
      content: doc.lesson.content ?? null,
    },
    sections,
    moments,
  };
}

// ── JSON bundle (what the `api` attach target would POST / the Electron app reads)

export interface MomentsBundle {
  lesson: {
    course: string;
    slug: string;
    title: string | null;
    content: string | null;
    videoUrl: string | null;
    lessonType: "video";
    playerType: "interactive";
    isPublished: true;
    allowPreview: true;
  };
  sections: CompiledSection[];
  moments: CompiledMoment[];
}

export function buildMomentsBundle(c: CompiledMoments, playbackId: string | null): MomentsBundle {
  return {
    lesson: {
      ...c.lesson,
      videoUrl: playbackId ? `mux:${playbackId}` : null,
      lessonType: "video",
      playerType: "interactive",
      isPublished: true,
      allowPreview: true,
    },
    sections: c.sections,
    moments: c.moments,
  };
}

/**
 * Pluggable attach target. The engine emits a reviewable bundle; a target
 * decides how it reaches the platform. Only `sql` (emit-and-review) ships today;
 * `api` (authenticated endpoint) and `supabase` (service-key) are documented
 * adapters added once the team picks the production path. NEVER writes prod by
 * default.
 */
export type AttachTargetName = "sql" | "api" | "supabase";
export interface AttachTarget {
  readonly name: AttachTargetName;
  attach(bundle: MomentsBundle): Promise<{ target: AttachTargetName; lessonSlug: string; dryRun: boolean }>;
}

// ── Idempotent SQL emission (modeled on seed-interactive-video-test.sql) ──────

/** Escape a value as a Postgres E'' string literal, or NULL. */
function sqlText(value: string | null): string {
  if (value === null) return "NULL";
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "''")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
  return `E'${escaped}'`;
}
function sqlNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(3);
}
function sqlBool(b: boolean): string {
  return b ? "true" : "false";
}
function sqlIdentLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export interface EmitSqlOptions {
  playbackId?: string | null;
  /** Set lessons.video_url + interactive flags. Default true. */
  updateLesson?: boolean;
}

const PLAYBACK_PLACEHOLDER = "REPLACE_WITH_PLAYBACK_ID";

/**
 * Render idempotent SQL that resolves the lesson by course+lesson slug, points
 * it at the Mux video, marks it interactive, and replaces its sections+moments.
 * Wrapped in BEGIN/COMMIT and safe to re-run.
 */
export function emitMomentsSql(c: CompiledMoments, opts: EmitSqlOptions = {}): string {
  const updateLesson = opts.updateLesson !== false;
  const courseLit = sqlIdentLiteral(c.lesson.course);
  const slugLit = sqlIdentLiteral(c.lesson.slug);
  const scope = `(\n    SELECT l.id FROM lessons l\n    JOIN courses c ON c.id = l.course_id\n    WHERE c.slug = ${courseLit} AND l.slug = ${slugLit}\n  )`;

  const out: string[] = [];
  out.push("-- Generated by vibedevview `palmier moments` — review before running.");
  out.push("-- Idempotent: resolves the lesson by slug and replaces its sections + moments.");
  out.push(`-- Lesson: course='${c.lesson.course}' slug='${c.lesson.slug}'`);
  out.push("-- Run at: https://supabase.com/dashboard/project/<project>/sql/new");
  out.push("");
  out.push("BEGIN;");
  out.push("");

  if (updateLesson) {
    const playbackId = opts.playbackId ?? null;
    if (!playbackId) {
      out.push(`-- TODO: no Mux playback id yet — replace ${PLAYBACK_PLACEHOLDER} after \`palmier publish\`.`);
    }
    const videoUrl = `mux:${playbackId ?? PLAYBACK_PLACEHOLDER}`;
    const sets = [
      `video_url = ${sqlText(videoUrl)}`,
      `lesson_type = 'video'`,
      `player_type = 'interactive'`,
      `is_published = true`,
      `allow_preview = true`,
    ];
    if (c.lesson.title !== null) sets.push(`title = ${sqlText(c.lesson.title)}`);
    if (c.lesson.content !== null) sets.push(`content = ${sqlText(c.lesson.content)}`);
    sets.push("updated_at = now()");
    out.push(`UPDATE lessons SET\n  ${sets.join(",\n  ")}\nWHERE id IN ${scope};`);
    out.push("");
  }

  out.push(`DELETE FROM lesson_video_chapters WHERE lesson_id IN ${scope};`);
  out.push(`DELETE FROM lesson_moments WHERE lesson_id IN ${scope};`);
  out.push("");

  if (c.sections.length > 0) {
    const rows = c.sections.map(
      (s) => `  (${sqlText(s.title)}, ${sqlNum(s.startSeconds)}, ${s.sortOrder})`,
    );
    out.push("INSERT INTO lesson_video_chapters (lesson_id, title, start_seconds, sort_order)");
    out.push("SELECT l.id, v.title, v.start_seconds, v.sort_order");
    out.push("FROM lessons l JOIN courses c ON c.id = l.course_id");
    out.push("JOIN (VALUES");
    out.push(rows.join(",\n"));
    out.push(") AS v(title, start_seconds, sort_order) ON true");
    out.push(`WHERE c.slug = ${courseLit} AND l.slug = ${slugLit};`);
    out.push("");
  }

  for (const m of c.moments) {
    const kindLit = m.artifactKind ? `'${m.artifactKind}'` : "NULL";
    out.push("INSERT INTO lesson_moments (");
    out.push("  lesson_id, start_seconds, title, description,");
    out.push("  artifact_kind, artifact_title, artifact_body, artifact_url, artifact_copyable,");
    out.push("  is_checkpoint, checkpoint_instructions, checkpoint_cta_label, sort_order");
    out.push(")");
    out.push(`SELECT l.id, ${sqlNum(m.startSeconds)}, ${sqlText(m.title)}, ${sqlText(m.description)},`);
    out.push(
      `       ${kindLit}, ${sqlText(m.artifactTitle)}, ${sqlText(m.artifactBody)}, ${sqlText(m.artifactUrl)}, ${sqlBool(m.artifactCopyable)},`,
    );
    out.push(
      `       ${sqlBool(m.isCheckpoint)}, ${sqlText(m.checkpointInstructions)}, ${sqlText(m.checkpointCtaLabel)}, ${m.sortOrder}`,
    );
    out.push("FROM lessons l JOIN courses c ON c.id = l.course_id");
    out.push(`WHERE c.slug = ${courseLit} AND l.slug = ${slugLit};`);
    out.push("");
  }

  out.push("COMMIT;");
  out.push("");
  return out.join("\n");
}

// ── High-level workflow step (always dry-run; emits files, never touches a DB) ─

export interface MomentsOptions {
  playbackId?: string;
}

export interface MomentsResult {
  lessonId: string;
  attachTarget: AttachTargetName;
  dryRun: true;
  playbackId: string | null;
  sectionCount: number;
  momentCount: number;
  checkpointCount: number;
  jsonPath: string;
  sqlPath: string;
}

/**
 * Everything an attach target needs, compiled from a lesson's `moments.yaml`
 * without touching any external system. Reused by both the dry-run `moments`
 * step and the live `attach` targets so they share one source of truth.
 */
export interface PreparedMoments {
  lessonId: string;
  ws: Workspace;
  compiled: CompiledMoments;
  bundle: MomentsBundle;
  sql: string;
  playbackId: string | null;
}

/**
 * Read + compile a lesson's `moments.yaml` against its alignment and build the
 * bundle + SQL in memory. SAFE: reads files only, never connects to anything.
 * The Mux playback id is taken from opts or the publish receipt if present.
 */
export async function prepareLessonMoments(lessonId: string, opts: MomentsOptions = {}): Promise<PreparedMoments> {
  const ws = Workspace.for(lessonId);
  if (!(await ws.exists(ws.momentsAuthorPath))) {
    throw new Error(
      `no moments file at ${ws.momentsAuthorPath} — author one (sections + pause/prompt/snippet/link/file/note) to add interactivity`,
    );
  }
  const manifest = await ws.readManifest();
  const timeline = await ws.readTimeline();
  const alignment = computeAlignment(manifest, timeline);

  const raw = await fs.readFile(ws.momentsAuthorPath, "utf8");
  const doc = MomentsDocSchema.parse(YAML.parse(raw) ?? {});
  const compiled = compileMoments(doc, alignment);

  let playbackId = opts.playbackId ?? null;
  if (!playbackId && (await ws.exists(ws.publishReceiptPath))) {
    const receipt = JSON.parse(await fs.readFile(ws.publishReceiptPath, "utf8")) as { playbackId?: string | null };
    playbackId = receipt.playbackId ?? null;
  }

  const bundle = buildMomentsBundle(compiled, playbackId);
  const sql = emitMomentsSql(compiled, { playbackId });
  return { lessonId, ws, compiled, bundle, sql, playbackId };
}

/**
 * Compile a lesson's `moments.yaml` against its alignment and write a JSON
 * bundle + idempotent SQL into the workspace `lms/` dir. SAFE: this never
 * connects to a database. Applying the result is an explicit, separate step
 * (review the SQL, or run `palmier attach --target api|supabase --apply`).
 */
export async function compileLessonMoments(lessonId: string, opts: MomentsOptions = {}): Promise<MomentsResult> {
  const { ws, compiled, bundle, sql, playbackId } = await prepareLessonMoments(lessonId, opts);

  await fs.mkdir(ws.lmsDir, { recursive: true });
  await fs.writeFile(ws.momentsJsonPath, JSON.stringify(bundle, null, 2) + "\n", "utf8");
  await fs.writeFile(ws.momentsSqlPath, sql, "utf8");

  const checkpointCount = compiled.moments.filter((m) => m.isCheckpoint).length;
  log.ok(
    "moments",
    `compiled ${compiled.sections.length} sections + ${compiled.moments.length} moments → ${ws.momentsSqlPath} (dry run, no DB writes)`,
  );
  if (!playbackId) {
    log.warn("moments", `no Mux playback id — SQL has a ${PLAYBACK_PLACEHOLDER} placeholder. Run \`palmier publish\` first.`);
  }

  return {
    lessonId,
    attachTarget: "sql",
    dryRun: true,
    playbackId,
    sectionCount: compiled.sections.length,
    momentCount: compiled.moments.length,
    checkpointCount,
    jsonPath: ws.momentsJsonPath,
    sqlPath: ws.momentsSqlPath,
  };
}
