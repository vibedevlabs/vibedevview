import { describe, expect, it } from "vitest";
import type { Course } from "../src/course/course.js";
import type { AttachOptions, AttachResult } from "../src/deliver/attach.js";
import { attachCourse } from "../src/deliver/batch.js";

/**
 * Contract: attachCourse(opts) loads course.yaml, flattens it to sort order,
 * and calls the (injectable) per-lesson attach for EACH lesson in that order.
 *   • Passes through target + apply to every lesson.
 *   • A lesson that throws is recorded as status "error" and does NOT abort the
 *     rest of the walk.
 *   • Summary counts (applied/dryrun/errors/total) reflect the per-lesson
 *     outcomes; result rows carry sortOrder + module + course/slug.
 * Failure modes covered: missing course.yaml, a mid-list failure, all-dry-run,
 * mixed apply/error, ordering across modules.
 */

const COURSE: Course = {
  course: "build-with-ai",
  title: "Build With AI",
  modules: [
    { title: "Absorb 1", lessons: [{ id: "B-AB1", slug: "build-loop", order: 1 }] },
    {
      title: "Command 1",
      lessons: [
        { id: "B-DEMO1", slug: "team-files", order: 1 },
        { id: "B-CMD2", slug: "your-move", order: 2 },
      ],
    },
  ],
};

function okResult(lessonId: string, course: string, slug: string, applied: boolean): AttachResult {
  return {
    lessonId,
    target: "supabase",
    applied,
    dryRun: !applied,
    course,
    lessonSlug: slug,
    playbackId: applied ? "pb1" : null,
    sectionCount: 3,
    momentCount: 1,
    checkpointCount: 1,
    jsonPath: `/x/${lessonId}.json`,
    sqlPath: `/x/${lessonId}.sql`,
    notes: [],
  };
}

describe("attachCourse", () => {
  it("attaches every lesson in sort order, passing target+apply through", async () => {
    const calls: Array<{ lessonId: string; opts: AttachOptions }> = [];
    const res = await attachCourse({
      target: "supabase",
      apply: true,
      loadCourseFn: async () => COURSE,
      attachFn: async (lessonId, opts) => {
        calls.push({ lessonId, opts });
        const slug = { "B-AB1": "build-loop", "B-DEMO1": "team-files", "B-CMD2": "your-move" }[lessonId]!;
        return okResult(lessonId, "build-with-ai", slug, true);
      },
    });

    expect(calls.map((c) => c.lessonId)).toEqual(["B-AB1", "B-DEMO1", "B-CMD2"]);
    expect(calls.every((c) => c.opts.target === "supabase" && c.opts.apply === true)).toBe(true);
    expect({ total: res.total, applied: res.applied, dryrun: res.dryrun, errors: res.errors }).toEqual({
      total: 3,
      applied: 3,
      dryrun: 0,
      errors: 0,
    });
    expect(res.results.map((r) => [r.sortOrder, r.lessonId, r.module, `${r.course}/${r.slug}`, r.status])).toEqual([
      [1, "B-AB1", "Absorb 1", "build-with-ai/build-loop", "applied"],
      [2, "B-DEMO1", "Command 1", "build-with-ai/team-files", "applied"],
      [3, "B-CMD2", "Command 1", "build-with-ai/your-move", "applied"],
    ]);
  });

  it("isolates a mid-list failure: continues the walk and records the error", async () => {
    const seen: string[] = [];
    const res = await attachCourse({
      target: "supabase",
      apply: true,
      loadCourseFn: async () => COURSE,
      attachFn: async (lessonId) => {
        seen.push(lessonId);
        if (lessonId === "B-DEMO1") throw new Error(`lesson "build-with-ai/team-files" not found in Supabase`);
        return okResult(lessonId, "build-with-ai", lessonId === "B-AB1" ? "build-loop" : "your-move", true);
      },
    });

    // All three were attempted even though the 2nd threw.
    expect(seen).toEqual(["B-AB1", "B-DEMO1", "B-CMD2"]);
    expect({ applied: res.applied, errors: res.errors, total: res.total }).toEqual({ applied: 2, errors: 1, total: 3 });
    const failed = res.results.find((r) => r.lessonId === "B-DEMO1")!;
    expect(failed.status).toBe("error");
    expect(failed.error).toBe(`lesson "build-with-ai/team-files" not found in Supabase`);
    expect(failed.sectionCount).toBeNull();
    // The error row still carries placement from course.yaml (course/slug from the plan).
    expect(`${failed.course}/${failed.slug}`).toBe("build-with-ai/team-files");
  });

  it("counts dry-runs when apply is false (no writes)", async () => {
    const res = await attachCourse({
      loadCourseFn: async () => COURSE,
      attachFn: async (lessonId, opts) => {
        expect(opts.apply).toBe(false);
        return okResult(lessonId, "build-with-ai", "x", false);
      },
    });
    expect({ applied: res.applied, dryrun: res.dryrun, errors: res.errors }).toEqual({ applied: 0, dryrun: 3, errors: 0 });
  });

  it("throws when there is no course.yaml", async () => {
    await expect(attachCourse({ loadCourseFn: async () => undefined })).rejects.toThrow(/no course\.yaml/);
  });
});
