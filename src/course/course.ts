import { promises as fs } from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";
import { Workspace } from "../workspace.js";

/**
 * course.yaml — authored once, up front, to declare how the course sits in the
 * LMS. Each lesson's placement (course slug, lesson slug, sort order) lives here
 * instead of being hand-synced into every lesson's moments file, so producing a
 * lesson can drop it into the right LMS slot automatically.
 *
 *   course: build-with-ai          # LMS course slug
 *   title: Build With AI
 *   modules:
 *     - title: Absorb 1
 *       lessons:
 *         - id: B-AB1              # = productions folder + script.md lesson id
 *           slug: build-loop       # LMS lesson slug
 *           order: 1
 *         - id: B-DEMO1
 *           slug: team-files
 *           order: 2
 */

export const CourseLessonSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  order: z.number().int().positive().optional(),
});
export const CourseModuleSchema = z.object({
  title: z.string().min(1),
  order: z.number().int().positive().optional(),
  lessons: z.array(CourseLessonSchema).min(1),
});
export const CourseSchema = z.object({
  course: z.string().min(1),
  title: z.string().min(1),
  modules: z.array(CourseModuleSchema).min(1),
});

export type CourseLesson = z.infer<typeof CourseLessonSchema>;
export type CourseModule = z.infer<typeof CourseModuleSchema>;
export type Course = z.infer<typeof CourseSchema>;

/** A single lesson's fully-resolved position in the course. */
export interface LessonPlacement {
  lessonId: string;
  /** LMS course slug (from the top-level `course:`). */
  course: string;
  /** LMS lesson slug. */
  slug: string;
  /** Module (LMS chapter) title this lesson belongs to. */
  module: string;
  /** 1-based module position after ordering. */
  moduleIndex: number;
  /** 1-based position within the module after ordering. */
  orderInModule: number;
  /** 1-based running sequence across the whole course (module-major). */
  sortOrder: number;
}

/**
 * Resolve the effective order of a list. If ANY entry declares an explicit
 * `order`, ALL must declare a unique one (sorted by it); otherwise authoring
 * order is used. Mixing explicit + implicit is ambiguous and rejected.
 */
function orderedIndices<T extends { order?: number }>(items: T[], kind: string): number[] {
  const explicit = items.filter((i) => i.order !== undefined).length;
  if (explicit === 0) return items.map((_, i) => i);
  if (explicit !== items.length) {
    throw new Error(`course.yaml: every ${kind} must declare \`order\` or none — mixing explicit and implicit order is ambiguous`);
  }
  const seen = new Set<number>();
  for (const i of items) {
    if (seen.has(i.order!)) throw new Error(`course.yaml: duplicate ${kind} order ${i.order}`);
    seen.add(i.order!);
  }
  return items
    .map((item, idx) => ({ idx, order: item.order! }))
    .sort((a, b) => a.order - b.order)
    .map((e) => e.idx);
}

/** Validate cross-entry invariants the zod schema can't express. */
export function assertCourseInvariants(course: Course): void {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      if (ids.has(lesson.id)) throw new Error(`course.yaml: duplicate lesson id "${lesson.id}"`);
      ids.add(lesson.id);
      if (slugs.has(lesson.slug)) throw new Error(`course.yaml: duplicate lesson slug "${lesson.slug}"`);
      slugs.add(lesson.slug);
    }
  }
}

/** Parse + validate a course.yaml document. Pure. */
export function parseCourse(text: string): Course {
  const course = CourseSchema.parse(YAML.parse(text) ?? {});
  assertCourseInvariants(course);
  return course;
}

/**
 * Flatten the course into an ordered list of lesson placements: modules ordered
 * (explicit `order` or authoring), lessons ordered within each module, and a
 * 1-based `sortOrder` running across the whole course. Pure.
 */
export function flattenCourse(course: Course): LessonPlacement[] {
  const out: LessonPlacement[] = [];
  const moduleOrder = orderedIndices(course.modules, "module");
  let sortOrder = 0;
  moduleOrder.forEach((modIdx, m) => {
    const mod = course.modules[modIdx]!;
    const lessonOrder = orderedIndices(mod.lessons, `lesson in module "${mod.title}"`);
    lessonOrder.forEach((lessonIdx, l) => {
      const lesson = mod.lessons[lessonIdx]!;
      sortOrder += 1;
      out.push({
        lessonId: lesson.id,
        course: course.course,
        slug: lesson.slug,
        module: mod.title,
        moduleIndex: m + 1,
        orderInModule: l + 1,
        sortOrder,
      });
    });
  });
  return out;
}

/** The placement for one lesson id, or undefined if it isn't in the course. */
export function resolveLessonPlacement(course: Course, lessonId: string): LessonPlacement | undefined {
  return flattenCourse(course).find((p) => p.lessonId === lessonId);
}

/** Default location of course.yaml: the productions dir root. */
export function courseFilePath(): string {
  return path.join(Workspace.productionsDir(), "course.yaml");
}

/**
 * Load course.yaml from disk. Returns `undefined` when the file is absent (the
 * course tree is optional — lessons without one keep their hand-authored
 * frontmatter). Reads only.
 */
export async function loadCourse(filePath: string = courseFilePath()): Promise<Course | undefined> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw err;
  }
  return parseCourse(raw);
}
