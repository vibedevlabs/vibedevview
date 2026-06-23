import { formatTimestamp } from "./alignment.js";
import { hasDo } from "./types.js";
import type { Alignment, Manifest, RecordingManifest } from "./types.js";

/**
 * Recording state for a DO segment. `pending` means produce hasn't run yet (no
 * recording-manifest), so the segment *will* need a recording; `todo` and
 * `placeholder` both still need a real capture; only `recorded` is done.
 */
export type RecordingStatus = "recorded" | "placeholder" | "todo" | "pending";

export interface RecordingStep {
  n: number;
  action: string;
  target?: string;
  note?: string;
}

export interface RecordingNeed {
  segId: string;
  label: string | null;
  status: RecordingStatus;
  /** Absolute start on the timeline (seconds), when alignment is available. */
  startSeconds: number | null;
  durationSeconds: number;
  steps: RecordingStep[];
  /** The existing real recording (status=recorded) or rendered placeholder, if any. */
  recordingPath: string | null;
}

/** True when this segment still needs a human to capture a real screen recording. */
export function needsRecording(status: RecordingStatus): boolean {
  return status !== "recorded";
}

/**
 * The ordered list of DO (screen-recording) segments and what each needs. Pure:
 * keeps manifest order, includes only segments with a DO block, and folds in the
 * recording-manifest status + the per-step checklist (action/target/note) and
 * alignment timings when present. This is the unit-tested contract behind the
 * `recordings` CLI report and the produce banner.
 */
export function buildRecordingPlan(
  manifest: Manifest,
  recording?: RecordingManifest,
  alignment?: Alignment,
): RecordingNeed[] {
  return manifest.segments
    .filter((seg) => hasDo(seg))
    .map((seg) => {
      const entry = recording?.segments[seg.id];
      const align = alignment?.segments[seg.id];
      const steps: RecordingStep[] = (seg.do ?? []).map((d, i) => ({
        n: i + 1,
        action: d.action,
        ...(d.target ? { target: d.target } : {}),
        ...(d.note ? { note: d.note } : {}),
      }));
      return {
        segId: seg.id,
        label: seg.label ?? null,
        status: entry?.status ?? "pending",
        startSeconds: align?.start ?? null,
        durationSeconds: align?.duration ?? entry?.duration ?? seg.durationEstimate,
        steps,
        recordingPath: entry?.path ?? null,
      };
    });
}

/**
 * Human-readable report lines for `palmier recordings <id>`. Each DO segment gets
 * a 🎥 callout with its timestamp/length and the numbered capture steps; a closing
 * line counts how many still need a real recording. Pure (returns lines) so it can
 * be asserted in tests and printed by the CLI.
 */
export function formatRecordingReport(lessonId: string, needs: RecordingNeed[]): string[] {
  if (needs.length === 0) {
    return [`No screen recordings needed for "${lessonId}" — no segments have a DO block.`];
  }

  const lines: string[] = [];
  const pending = needs.filter((n) => needsRecording(n.status));
  lines.push(`Screen recordings for "${lessonId}" — ${pending.length} of ${needs.length} still needed:`);
  lines.push("");

  for (const need of needs) {
    const at = need.startSeconds != null ? `${formatTimestamp(need.startSeconds)} · ` : "";
    const len = `~${Math.round(need.durationSeconds)}s @ 1920x1080`;
    const label = need.label ? ` ${need.label}` : "";
    if (needsRecording(need.status)) {
      lines.push(`🎥 RECORD — segment ${need.segId}${label}  [${need.status}]`);
      lines.push(`   ${at}target length ${len}`);
      if (need.steps.length === 0) {
        lines.push(`   (no steps listed — capture the action described in the script)`);
      }
      for (const step of need.steps) {
        const target = step.target ? ` — ${step.target}` : "";
        const note = step.note ? ` (${step.note})` : "";
        lines.push(`   ${step.n}. ${step.action}${target}${note}`);
      }
    } else {
      lines.push(`✅ segment ${need.segId}${label} — recorded${need.recordingPath ? ` (${need.recordingPath})` : ""}`);
    }
    lines.push("");
  }

  if (pending.length > 0) {
    lines.push(`Capture the ${pending.length} clip(s) above, drop them in the lesson's recordings/ folder, then re-run produce.`);
  } else {
    lines.push("All screen recordings are captured.");
  }
  return lines;
}
