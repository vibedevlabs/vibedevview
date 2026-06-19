import { describe, expect, it } from "vitest";
import { newLessonIdState } from "../src/renderer/components/NewLessonDialog";

/**
 * Contract — newLessonIdState(raw, existing): pure gate for the New-lesson
 * dialog's Create button.
 *  - trims surrounding whitespace into `id`.
 *  - valid iff trimmed id is non-empty AND not already an existing lesson.
 *  - duplicate iff a non-empty trimmed id collides (case-sensitive) with existing.
 * Failure modes covered: empty string, whitespace-only, leading/trailing spaces,
 * exact duplicate, case-different (NOT a duplicate — folders are case-sensitive),
 * empty `existing` list.
 */
describe("newLessonIdState", () => {
  it("accepts a fresh, non-colliding id and trims it", () => {
    expect(newLessonIdState("  B-DEMO1 ", ["B-AB1"])).toEqual({ id: "B-DEMO1", duplicate: false, valid: true });
  });

  it("rejects empty and whitespace-only input (not a duplicate, just invalid)", () => {
    expect(newLessonIdState("", ["B-AB1"])).toEqual({ id: "", duplicate: false, valid: false });
    expect(newLessonIdState("    ", ["B-AB1"])).toEqual({ id: "", duplicate: false, valid: false });
  });

  it("flags an exact (post-trim) collision as duplicate and invalid", () => {
    expect(newLessonIdState("  B-AB1  ", ["B-AB1", "B-DEMO1"])).toEqual({
      id: "B-AB1",
      duplicate: true,
      valid: false,
    });
  });

  it("treats a case-different id as NOT a duplicate (folder names are case-sensitive)", () => {
    expect(newLessonIdState("b-ab1", ["B-AB1"])).toEqual({ id: "b-ab1", duplicate: false, valid: true });
  });

  it("accepts any non-empty id when there are no existing lessons", () => {
    expect(newLessonIdState("FIRST", [])).toEqual({ id: "FIRST", duplicate: false, valid: true });
  });
});
