import { describe, expect, it } from "vitest";
import {
  assertCourseInvariants,
  flattenCourse,
  parseCourse,
  resolveLessonPlacement,
  type Course,
} from "../src/course/course.js";

/**
 * Contracts under test:
 *
 * parseCourse(text): validates the zod schema AND cross-entry invariants
 *   (unique lesson id, unique lesson slug across the whole course). Throws on
 *   malformed/empty docs.
 *
 * flattenCourse(course): pure. Produces one LessonPlacement per lesson, ordered
 *   module-major. Module + lesson ordering uses explicit `order` when present
 *   (all-or-none, unique) else authoring order. `sortOrder` is a 1-based running
 *   sequence across the whole course; `moduleIndex`/`orderInModule` are 1-based.
 *
 * resolveLessonPlacement(course, id): the placement for one id, or undefined.
 */

const YAML_DOC = `
course: build-with-ai
title: Build With AI
modules:
  - title: Absorb 1
    order: 1
    lessons:
      - id: B-AB1
        slug: build-loop
        order: 1
      - id: B-DEMO1
        slug: team-files
        order: 2
  - title: Command 1
    order: 2
    lessons:
      - id: B-CMD1
        slug: first-build
        order: 1
`;

describe("parseCourse", () => {
  it("parses a valid course and resolves placements module-major", () => {
    const course = parseCourse(YAML_DOC);
    const flat = flattenCourse(course);
    expect(flat.map((p) => p.lessonId)).toEqual(["B-AB1", "B-DEMO1", "B-CMD1"]);
    expect(flat.map((p) => p.sortOrder)).toEqual([1, 2, 3]);
    expect(flat[2]).toEqual({
      lessonId: "B-CMD1",
      course: "build-with-ai",
      slug: "first-build",
      module: "Command 1",
      moduleIndex: 2,
      orderInModule: 1,
      sortOrder: 3,
    });
  });

  it("rejects a duplicate lesson id", () => {
    expect(() =>
      parseCourse(`
course: c
title: C
modules:
  - title: M
    lessons:
      - { id: X, slug: a }
      - { id: X, slug: b }
`),
    ).toThrow(/duplicate lesson id "X"/);
  });

  it("rejects a duplicate lesson slug across modules", () => {
    expect(() =>
      parseCourse(`
course: c
title: C
modules:
  - title: M1
    lessons: [{ id: A, slug: dup }]
  - title: M2
    lessons: [{ id: B, slug: dup }]
`),
    ).toThrow(/duplicate lesson slug "dup"/);
  });

  it("rejects an empty/malformed doc (missing course)", () => {
    expect(() => parseCourse("title: x\nmodules: []\n")).toThrow();
  });
});

describe("flattenCourse ordering", () => {
  it("uses authoring order when no explicit order is given", () => {
    const course: Course = {
      course: "c",
      title: "C",
      modules: [
        { title: "M", lessons: [{ id: "L1", slug: "s1" }, { id: "L2", slug: "s2" }] },
      ],
    };
    expect(flattenCourse(course).map((p) => [p.lessonId, p.orderInModule])).toEqual([
      ["L1", 1],
      ["L2", 2],
    ]);
  });

  it("sorts by explicit order (independent of authoring order)", () => {
    const course: Course = {
      course: "c",
      title: "C",
      modules: [
        {
          title: "M",
          lessons: [
            { id: "L2", slug: "s2", order: 2 },
            { id: "L1", slug: "s1", order: 1 },
          ],
        },
      ],
    };
    expect(flattenCourse(course).map((p) => p.lessonId)).toEqual(["L1", "L2"]);
  });

  it("rejects mixing explicit and implicit lesson order", () => {
    const course: Course = {
      course: "c",
      title: "C",
      modules: [
        { title: "M", lessons: [{ id: "L1", slug: "s1", order: 1 }, { id: "L2", slug: "s2" }] },
      ],
    };
    expect(() => flattenCourse(course)).toThrow(/mixing explicit and implicit order/);
  });

  it("rejects duplicate explicit order within a module", () => {
    const course: Course = {
      course: "c",
      title: "C",
      modules: [
        { title: "M", lessons: [{ id: "L1", slug: "s1", order: 1 }, { id: "L2", slug: "s2", order: 1 }] },
      ],
    };
    expect(() => flattenCourse(course)).toThrow(/duplicate lesson .* order 1/);
  });
});

describe("resolveLessonPlacement", () => {
  it("returns the placement for a known lesson and undefined otherwise", () => {
    const course = parseCourse(YAML_DOC);
    expect(resolveLessonPlacement(course, "B-DEMO1")?.slug).toBe("team-files");
    expect(resolveLessonPlacement(course, "B-DEMO1")?.sortOrder).toBe(2);
    expect(resolveLessonPlacement(course, "NOPE")).toBeUndefined();
  });
});

describe("assertCourseInvariants", () => {
  it("passes a clean course", () => {
    expect(() => assertCourseInvariants(parseCourse(YAML_DOC))).not.toThrow();
  });
});
