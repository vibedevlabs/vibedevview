import { describe, expect, it } from "vitest";
import { buildAutoMomentsDoc } from "../src/deliver/auto-moments.js";
import type { Manifest, Segment } from "../src/types.js";

/**
 * Contract: buildAutoMomentsDoc(manifest, lesson) is pure and produces a
 * MomentsDoc where
 *   • lesson.course/slug come from the placement; title is carried through.
 *   • sections: one per phase RUN — a new section opens only when the phase
 *     changes from the previous segment (anchored by `seg`), titled by phase.
 *   • moments: one `pause` checkpoint per DO segment (in segment order),
 *     anchored by `seg`, instructions = numbered DO steps, default CTA.
 *   • segments without a DO block produce no moments; without a phase, no
 *     section.
 */

function seg(partial: Partial<Segment> & { id: string }): Segment {
  return {
    id: partial.id,
    frameId: partial.frameId ?? partial.id,
    label: partial.label,
    phase: partial.phase,
    say: partial.say,
    slide: partial.slide,
    do: partial.do,
    voice: partial.voice,
    silent: partial.silent ?? false,
    durationEstimate: partial.durationEstimate ?? 5,
  };
}

function manifest(segments: Segment[]): Manifest {
  return { lessonId: "B-AB1", title: "Build With AI", voiceDefault: "Ja'dan", segments };
}

const LESSON = { course: "build-with-ai", slug: "build-loop", title: "Build With AI" };

describe("buildAutoMomentsDoc", () => {
  it("opens a section per phase run and one checkpoint per DO segment", () => {
    const doc = buildAutoMomentsDoc(
      manifest([
        seg({ id: "01", phase: "SOURCE" }),
        seg({ id: "02", phase: "SOURCE" }),
        seg({ id: "03", phase: "ABSORB" }),
        seg({
          id: "09",
          phase: "MIRROR",
          label: "Kick off the build",
          do: [
            { action: "Open the terminal", target: "iTerm" },
            { action: "Run the production", target: "palmier produce B-AB1", note: "let logs scroll" },
          ],
        }),
      ]),
      LESSON,
    );

    // SOURCE run (01), ABSORB (03), MIRROR (09) → 3 sections, not 4 (02 is same phase as 01).
    expect(doc.sections).toEqual([
      { seg: "01", title: "Source" },
      { seg: "03", title: "Absorb" },
      { seg: "09", title: "Mirror" },
    ]);

    expect(doc.moments).toHaveLength(1);
    expect(doc.moments[0]).toEqual({
      seg: "09",
      kind: "pause",
      title: "Do it: Kick off the build",
      instructions:
        "1. Open the terminal — iTerm\n2. Run the production — palmier produce B-AB1 (let logs scroll)",
      cta: "I did it — continue",
    });
    expect(doc.lesson).toEqual({ course: "build-with-ai", slug: "build-loop", title: "Build With AI" });
  });

  it("re-opens a section when a phase recurs after a different one", () => {
    const doc = buildAutoMomentsDoc(
      manifest([
        seg({ id: "01", phase: "SOURCE" }),
        seg({ id: "02", phase: "ABSORB" }),
        seg({ id: "03", phase: "SOURCE" }),
      ]),
      LESSON,
    );
    expect(doc.sections).toEqual([
      { seg: "01", title: "Source" },
      { seg: "02", title: "Absorb" },
      { seg: "03", title: "Source" },
    ]);
  });

  it("produces no moments when no segment has a DO block, and no sections when no phases", () => {
    const doc = buildAutoMomentsDoc(
      manifest([seg({ id: "01", say: "hi" }), seg({ id: "02", say: "bye" })]),
      LESSON,
    );
    expect(doc.sections).toEqual([]);
    expect(doc.moments).toEqual([]);
  });

  it("falls back to a segment-id title when a DO segment has no label, and keeps DO order", () => {
    const doc = buildAutoMomentsDoc(
      manifest([
        seg({ id: "07", do: [{ action: "Show the file" }] }),
        seg({ id: "04", do: [{ action: "Type the command" }] }),
      ]),
      LESSON,
    );
    expect(doc.moments.map((m) => [m.seg, m.title])).toEqual([
      ["07", "Do it (segment 07)"],
      ["04", "Do it (segment 04)"],
    ]);
    expect(doc.moments[0]!.instructions).toBe("1. Show the file");
  });

  it("omits title/content from lesson when not provided", () => {
    const doc = buildAutoMomentsDoc(manifest([seg({ id: "01" })]), { course: "c", slug: "s" });
    expect(doc.lesson).toEqual({ course: "c", slug: "s" });
  });
});
