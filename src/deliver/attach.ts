import { promises as fs } from "node:fs";
import { log } from "../util/log.js";
import { Workspace } from "../workspace.js";
import {
  prepareLessonMoments,
  type AttachTarget,
  type AttachTargetName,
  type CompiledMoment,
  type CompiledSection,
  type MomentsBundle,
} from "./moments.js";
import type { FetchLike, HttpReply } from "./mux.js";

// ── Pure row/payload transforms (shared by the api + supabase targets) ────────
//
// These mirror the columns of the real LMS tables (lessons / lesson_video_chapters
// / lesson_moments) so both the authenticated endpoint and a direct PostgREST
// write produce identical rows. Keeping them pure makes them testable with no
// network.

export interface LessonPatch {
  video_url: string | null;
  lesson_type: "video";
  player_type: "interactive";
  is_published: true;
  allow_preview: true;
  title?: string;
  content?: string;
}

export function lessonPatchFor(bundle: MomentsBundle): LessonPatch {
  const patch: LessonPatch = {
    video_url: bundle.lesson.videoUrl,
    lesson_type: "video",
    player_type: "interactive",
    is_published: true,
    allow_preview: true,
  };
  if (bundle.lesson.title !== null) patch.title = bundle.lesson.title;
  if (bundle.lesson.content !== null) patch.content = bundle.lesson.content;
  return patch;
}

export interface ChapterRow {
  lesson_id: string;
  title: string;
  start_seconds: number;
  sort_order: number;
}

export function chapterRowsFor(lessonId: string, bundle: MomentsBundle): ChapterRow[] {
  return bundle.sections.map((s: CompiledSection) => ({
    lesson_id: lessonId,
    title: s.title,
    start_seconds: s.startSeconds,
    sort_order: s.sortOrder,
  }));
}

export interface MomentRow {
  lesson_id: string;
  start_seconds: number;
  end_seconds: number | null;
  title: string;
  description: string | null;
  artifact_kind: CompiledMoment["artifactKind"];
  artifact_title: string | null;
  artifact_body: string | null;
  artifact_url: string | null;
  artifact_copyable: boolean;
  is_checkpoint: boolean;
  checkpoint_instructions: string | null;
  checkpoint_cta_label: string | null;
  sort_order: number;
}

export function momentRowsFor(lessonId: string, bundle: MomentsBundle): MomentRow[] {
  return bundle.moments.map((m: CompiledMoment) => ({
    lesson_id: lessonId,
    start_seconds: m.startSeconds,
    end_seconds: null,
    title: m.title,
    description: m.description,
    artifact_kind: m.artifactKind,
    artifact_title: m.artifactTitle,
    artifact_body: m.artifactBody,
    artifact_url: m.artifactUrl,
    artifact_copyable: m.artifactCopyable,
    is_checkpoint: m.isCheckpoint,
    checkpoint_instructions: m.checkpointInstructions,
    checkpoint_cta_label: m.checkpointCtaLabel,
    sort_order: m.sortOrder,
  }));
}

// ── api target: POST the bundle to an authenticated hgdw-lms endpoint ─────────
//
// RECOMMENDED real path. The endpoint wraps the existing `lesson-moments.ts`
// server actions, so schema ownership and validation stay inside the LMS and the
// CLI only needs a scoped bearer token (never a DB credential).

export const DEFAULT_API_PATH = "/api/admin/lessons/moments";

export interface ApiAttachConfig {
  base: string;
  token: string;
  path?: string;
  fetchLike?: FetchLike;
}

export function buildApiRequest(
  cfg: { base: string; token: string; path?: string },
  bundle: MomentsBundle,
): { url: string; init: { method: string; headers: Record<string, string>; body: string } } {
  const base = cfg.base.replace(/\/+$/, "");
  const path = cfg.path ?? DEFAULT_API_PATH;
  return {
    url: `${base}${path}`,
    init: {
      method: "POST",
      headers: {
        authorization: `Bearer ${cfg.token}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(bundle),
    },
  };
}

export interface ApiAttachResponse {
  lessonSlug: string;
  sectionCount: number;
  momentCount: number;
}

export function parseApiResponse(parsed: unknown): ApiAttachResponse {
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("unexpected hgdw-lms response: expected a JSON object");
  }
  const obj = parsed as Record<string, unknown>;
  const lessonSlug = obj["lessonSlug"];
  if (typeof lessonSlug !== "string" || lessonSlug.length === 0) {
    throw new Error("hgdw-lms response missing `lessonSlug`");
  }
  const sectionCount = typeof obj["sectionCount"] === "number" ? obj["sectionCount"] : 0;
  const momentCount = typeof obj["momentCount"] === "number" ? obj["momentCount"] : 0;
  return { lessonSlug, sectionCount, momentCount };
}

export class ApiAttachTarget implements AttachTarget {
  readonly name = "api" as const;
  private readonly cfg: { base: string; token: string; path?: string };
  private readonly http: FetchLike;

  constructor(cfg: ApiAttachConfig) {
    if (!cfg.base || !cfg.token) {
      throw new Error("api attach requires HGDW_LMS_API_BASE and HGDW_LMS_API_TOKEN");
    }
    this.cfg = { base: cfg.base, token: cfg.token, ...(cfg.path ? { path: cfg.path } : {}) };
    this.http = cfg.fetchLike ?? (globalThis.fetch as unknown as FetchLike);
  }

  async attach(bundle: MomentsBundle): Promise<{ target: AttachTargetName; lessonSlug: string; dryRun: boolean }> {
    const { url, init } = buildApiRequest(this.cfg, bundle);
    log.info("attach", `POST ${url} (${bundle.sections.length} sections, ${bundle.moments.length} moments)`);
    const reply = await this.http(url, init);
    if (!reply.ok) {
      throw new Error(`hgdw-lms attach → ${reply.status}: ${await reply.text()}`);
    }
    const res = parseApiResponse(await reply.json());
    return { target: "api", lessonSlug: res.lessonSlug, dryRun: false };
  }
}

// ── supabase target: direct PostgREST write with the service key ──────────────
//
// FALLBACK only. Bypasses app logic + RLS and couples the tool to the schema,
// so it is gated behind --apply and only used when no endpoint exists yet.

export interface SupabaseAttachConfig {
  url: string;
  serviceKey: string;
  fetchLike?: FetchLike;
}

/**
 * Derive the Supabase project URL from a service-role JWT. The token's payload
 * carries the project `ref`, and PostgREST lives at `https://<ref>.supabase.co`.
 * Lets operators provide only the service key (the URL is implied). Returns
 * null when the token isn't a decodable JWT with a `ref`.
 */
export function supabaseUrlFromServiceKey(key: string): string | null {
  const parts = key.split(".");
  if (parts.length < 2 || !parts[1]) return null;
  try {
    const json = Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const payload = JSON.parse(json) as { ref?: unknown };
    return typeof payload.ref === "string" && payload.ref ? `https://${payload.ref}.supabase.co` : null;
  } catch {
    return null;
  }
}

/**
 * Resolve which Supabase project URL to write to. Precedence is chosen so a
 * stray generic `SUPABASE_URL` (often present for an unrelated project in a
 * shared environment) can never be paired with the HGDW service key:
 *   1. `HGDW_SUPABASE_URL` — explicit, HGDW-specific (allows a custom domain).
 *   2. URL derived from the HGDW service key itself — cryptographically tied to
 *      the key's own project, so it's always consistent with the credential.
 *   3. generic `SUPABASE_URL` — last-resort fallback only when no HGDW key.
 */
export function resolveSupabaseUrl(env: {
  HGDW_SUPABASE_URL?: string;
  SUPABASE_URL?: string;
  HGDW_SUPABASE_SERVICE_KEY?: string;
}): string {
  const explicit = env.HGDW_SUPABASE_URL?.trim();
  if (explicit) return explicit;
  const derived = env.HGDW_SUPABASE_SERVICE_KEY ? supabaseUrlFromServiceKey(env.HGDW_SUPABASE_SERVICE_KEY) : null;
  if (derived) return derived;
  return env.SUPABASE_URL?.trim() ?? "";
}

export function restHeaders(serviceKey: string, prefer?: string): Record<string, string> {
  const h: Record<string, string> = {
    apikey: serviceKey,
    authorization: `Bearer ${serviceKey}`,
    "content-type": "application/json",
  };
  if (prefer) h["Prefer"] = prefer;
  return h;
}

/** Pull the `id` column out of a PostgREST `select=id` response. */
export function parseIdRows(parsed: unknown): string[] {
  if (!Array.isArray(parsed)) throw new Error("unexpected Supabase response: expected an array of rows");
  return parsed.map((row) => {
    const id = typeof row === "object" && row !== null ? (row as Record<string, unknown>)["id"] : undefined;
    if (typeof id !== "string") throw new Error("Supabase row missing string `id`");
    return id;
  });
}

export class SupabaseAttachTarget implements AttachTarget {
  readonly name = "supabase" as const;
  private readonly base: string;
  private readonly serviceKey: string;
  private readonly http: FetchLike;

  constructor(cfg: SupabaseAttachConfig) {
    if (!cfg.url || !cfg.serviceKey) {
      throw new Error("supabase attach requires HGDW_SUPABASE_URL and HGDW_SUPABASE_SERVICE_KEY");
    }
    this.base = cfg.url.replace(/\/+$/, "");
    this.serviceKey = cfg.serviceKey;
    this.http = cfg.fetchLike ?? (globalThis.fetch as unknown as FetchLike);
  }

  private rest(path: string): string {
    return `${this.base}/rest/v1/${path}`;
  }

  private async send(
    method: string,
    path: string,
    opts: { body?: unknown; prefer?: string } = {},
  ): Promise<unknown> {
    const init: { method: string; headers: Record<string, string>; body?: string } = {
      method,
      headers: restHeaders(this.serviceKey, opts.prefer),
    };
    if (opts.body !== undefined) init.body = JSON.stringify(opts.body);
    const reply: HttpReply = await this.http(this.rest(path), init);
    if (!reply.ok) {
      throw new Error(`supabase ${method} ${path} → ${reply.status}: ${await reply.text()}`);
    }
    const text = await reply.text();
    return text ? (JSON.parse(text) as unknown) : null;
  }

  private async resolveOne(path: string, missing: string): Promise<string> {
    const ids = parseIdRows(await this.send("GET", path));
    const id = ids[0];
    if (id === undefined) throw new Error(missing);
    return id;
  }

  async attach(bundle: MomentsBundle): Promise<{ target: AttachTargetName; lessonSlug: string; dryRun: boolean }> {
    const course = bundle.lesson.course;
    const slug = bundle.lesson.slug;
    const courseId = await this.resolveOne(
      `courses?slug=eq.${encodeURIComponent(course)}&select=id`,
      `course "${course}" not found in Supabase`,
    );
    const lessonId = await this.resolveOne(
      `lessons?course_id=eq.${encodeURIComponent(courseId)}&slug=eq.${encodeURIComponent(slug)}&select=id`,
      `lesson "${course}/${slug}" not found in Supabase`,
    );

    await this.send("PATCH", `lessons?id=eq.${encodeURIComponent(lessonId)}`, { body: lessonPatchFor(bundle) });
    await this.send("DELETE", `lesson_video_chapters?lesson_id=eq.${encodeURIComponent(lessonId)}`);
    await this.send("DELETE", `lesson_moments?lesson_id=eq.${encodeURIComponent(lessonId)}`);

    const chapters = chapterRowsFor(lessonId, bundle);
    if (chapters.length > 0) {
      await this.send("POST", "lesson_video_chapters", { body: chapters, prefer: "return=minimal" });
    }
    const moments = momentRowsFor(lessonId, bundle);
    if (moments.length > 0) {
      await this.send("POST", "lesson_moments", { body: moments, prefer: "return=minimal" });
    }
    log.ok("attach", `wrote lesson + ${chapters.length} chapters + ${moments.length} moments via Supabase`);
    return { target: "supabase", lessonSlug: slug, dryRun: false };
  }
}

// ── High-level `attach` step (double-gated: --target AND --apply) ─────────────

export interface AttachOptions {
  target?: AttachTargetName;
  apply?: boolean;
  playbackId?: string;
}

export interface AttachResult {
  lessonId: string;
  target: AttachTargetName;
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

export function chooseAttachTarget(opt?: AttachTargetName): AttachTargetName {
  if (opt) return opt;
  const env = process.env.PALMIER_ATTACH_TARGET;
  if (env === "api" || env === "supabase") return env;
  return "sql";
}

function makeAttachTarget(name: "api" | "supabase"): AttachTarget {
  if (name === "api") {
    return new ApiAttachTarget({
      base: process.env.HGDW_LMS_API_BASE ?? "",
      token: process.env.HGDW_LMS_API_TOKEN ?? "",
    });
  }
  const serviceKey = process.env.HGDW_SUPABASE_SERVICE_KEY ?? "";
  return new SupabaseAttachTarget({ url: resolveSupabaseUrl(process.env), serviceKey });
}

/**
 * Attach a lesson's compiled moments to the platform.
 *
 * SAFETY MODEL (two independent gates, both required for a real write):
 *   1. `target` must be `api` or `supabase` (default `sql` only emits files).
 *   2. `apply` must be true (default dry-runs and prints what it WOULD write).
 * A real write also requires a Mux playback id so we never publish a lesson with
 * a null video. The reviewable JSON + SQL artifacts are always written.
 */
export async function attachLesson(lessonId: string, opts: AttachOptions = {}): Promise<AttachResult> {
  const playbackOpt = opts.playbackId !== undefined ? { playbackId: opts.playbackId } : {};
  const prepared = await prepareLessonMoments(lessonId, playbackOpt);
  const { ws, bundle, compiled, sql, playbackId } = prepared;

  await fs.mkdir(ws.lmsDir, { recursive: true });
  await fs.writeFile(ws.momentsJsonPath, JSON.stringify(bundle, null, 2) + "\n", "utf8");
  await fs.writeFile(ws.momentsSqlPath, sql, "utf8");

  const target = chooseAttachTarget(opts.target);
  const checkpointCount = compiled.moments.filter((m) => m.isCheckpoint).length;
  const notes: string[] = [];

  let applied = false;
  if (target === "sql") {
    notes.push(`review and run ${ws.momentsSqlPath} in the Supabase SQL editor`);
  } else if (!opts.apply) {
    notes.push(
      `dry run — would write via "${target}". Re-run with --apply to perform the real write (requires creds + a Mux playback id).`,
    );
  } else {
    if (!playbackId) {
      throw new Error(
        "refusing to attach with is_published=true but no Mux playback id — run `palmier publish <ID>` first or pass --playback-id",
      );
    }
    const adapter = makeAttachTarget(target);
    const res = await adapter.attach(bundle);
    applied = res.dryRun ? false : true;
    notes.push(`attached "${res.lessonSlug}" via ${res.target}`);
  }

  if (!playbackId) {
    notes.push("no Mux playback id resolved — lesson video_url is null until you publish.");
  }

  return {
    lessonId,
    target,
    applied,
    dryRun: !applied,
    course: bundle.lesson.course,
    lessonSlug: bundle.lesson.slug,
    playbackId,
    sectionCount: compiled.sections.length,
    momentCount: compiled.moments.length,
    checkpointCount,
    jsonPath: ws.momentsJsonPath,
    sqlPath: ws.momentsSqlPath,
    notes,
  };
}
