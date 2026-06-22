import { type Course, flattenCourse, loadCourse } from "../course/course.js";
import { type AttachOptions, type AttachResult, attachLesson } from "./attach.js";

/**
 * Walk `course.yaml` and attach every lesson in sort order, so a whole course
 * lands in the LMS with one command instead of attaching videos one by one.
 * Each lesson goes through the same `attachLesson` (same safety gating: a real
 * write still needs `target=api|supabase` AND `apply`). One lesson failing
 * (e.g. not produced yet, or not found in the LMS) does NOT stop the rest — it
 * is recorded as an error and the walk continues.
 */

export type BatchLessonStatus = "applied" | "dryrun" | "error";

export interface BatchLessonResult {
  lessonId: string;
  sortOrder: number;
  module: string;
  course: string | null;
  slug: string | null;
  status: BatchLessonStatus;
  sectionCount: number | null;
  momentCount: number | null;
  error: string | null;
}

export interface BatchAttachResult {
  course: string;
  title: string;
  total: number;
  applied: number;
  dryrun: number;
  errors: number;
  results: BatchLessonResult[];
}

export interface BatchAttachOptions {
  target?: AttachOptions["target"];
  apply?: boolean;
  /** Override the course.yaml path (defaults to the productions dir). */
  coursePath?: string;
  /** Injectable per-lesson attach (defaults to the real attachLesson). */
  attachFn?: (lessonId: string, opts: AttachOptions) => Promise<AttachResult>;
  /** Injectable course loader (defaults to the real loadCourse). */
  loadCourseFn?: (filePath?: string) => Promise<Course | undefined>;
}

export async function attachCourse(opts: BatchAttachOptions = {}): Promise<BatchAttachResult> {
  const load = opts.loadCourseFn ?? loadCourse;
  const attach = opts.attachFn ?? attachLesson;
  const course = await load(opts.coursePath);
  if (!course) {
    throw new Error("no course.yaml — author one to declare the course tree before batch-attaching");
  }

  const flat = flattenCourse(course);
  const results: BatchLessonResult[] = [];
  for (const p of flat) {
    try {
      const r = await attach(p.lessonId, { target: opts.target, apply: opts.apply === true });
      results.push({
        lessonId: p.lessonId,
        sortOrder: p.sortOrder,
        module: p.module,
        course: r.course,
        slug: r.lessonSlug,
        status: r.applied ? "applied" : "dryrun",
        sectionCount: r.sectionCount,
        momentCount: r.momentCount,
        error: null,
      });
    } catch (e) {
      results.push({
        lessonId: p.lessonId,
        sortOrder: p.sortOrder,
        module: p.module,
        course: p.course,
        slug: p.slug,
        status: "error",
        sectionCount: null,
        momentCount: null,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return {
    course: course.course,
    title: course.title,
    total: results.length,
    applied: results.filter((r) => r.status === "applied").length,
    dryrun: results.filter((r) => r.status === "dryrun").length,
    errors: results.filter((r) => r.status === "error").length,
    results,
  };
}
