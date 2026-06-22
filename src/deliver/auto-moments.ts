import { hasDo } from "../types.js";
import type { Manifest } from "../types.js";
import type { MomentsDoc } from "./moments.js";

/**
 * Derive a moments document straight from the produced script instead of
 * hand-authoring `moments.yaml`. Two rules, both anchored to segments (so
 * `compileMoments` resolves them against the real produced timeline):
 *
 *   • Sections (LMS chapters) — one per phase run. A new section opens whenever
 *     the phase changes from the previous segment, titled by the phase.
 *   • Moments — one checkpoint per `DO:` segment (the "now you do it" beats),
 *     with the segment's DO steps as the checkpoint instructions.
 *
 * It's a sensible starting point the author can edit; a hand-authored
 * `moments.yaml` still takes precedence when present.
 */

export interface AutoMomentsLessonRef {
  course: string;
  slug: string;
  title?: string;
  content?: string;
}

export const PHASE_LABELS: Record<NonNullable<Manifest["segments"][number]["phase"]>, string> = {
  SOURCE: "Source",
  ABSORB: "Absorb",
  MIRROR: "Mirror",
  COMMAND: "Command",
};

const DEFAULT_CTA = "I did it — continue";

function stepLine(n: number, step: { action: string; target?: string; note?: string }): string {
  const target = step.target ? ` — ${step.target}` : "";
  const note = step.note ? ` (${step.note})` : "";
  return `${n}. ${step.action}${target}${note}`;
}

export function buildAutoMomentsDoc(manifest: Manifest, lesson: AutoMomentsLessonRef): MomentsDoc {
  const sections: MomentsDoc["sections"] = [];
  let lastPhase: string | undefined;
  for (const seg of manifest.segments) {
    if (seg.phase && seg.phase !== lastPhase) {
      sections.push({ seg: seg.id, title: PHASE_LABELS[seg.phase] });
      lastPhase = seg.phase;
    }
  }

  const moments: MomentsDoc["moments"] = manifest.segments.filter(hasDo).map((seg) => ({
    seg: seg.id,
    kind: "pause" as const,
    title: seg.label ? `Do it: ${seg.label}` : `Do it (segment ${seg.id})`,
    instructions: (seg.do ?? []).map((d, i) => stepLine(i + 1, d)).join("\n"),
    cta: DEFAULT_CTA,
  }));

  return {
    lesson: {
      course: lesson.course,
      slug: lesson.slug,
      ...(lesson.title ? { title: lesson.title } : {}),
      ...(lesson.content ? { content: lesson.content } : {}),
    },
    sections,
    moments,
  };
}
