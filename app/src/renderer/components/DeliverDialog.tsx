import React, { useEffect, useState } from "react";
import { studio } from "../lib/bridge";
import type { AttachResult, DeliverPreview, ExportResult, PublishResult } from "../../shared/ipc";

function mb(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

/**
 * Deliver panel — a thin, **dry-run-only** UI over the engine's deliver chain
 * (`export → publish → attach`, §4.6/§10). It runs each step in its safe-by-
 * default mode (publish `--target dryrun`, attach `--target sql`, never `--apply`),
 * so it writes nothing to Mux or the LMS. A real publish/attach is left to the
 * CLI / "Ask Devin". Each step degrades to a clear hint when a prerequisite
 * (a produced lesson / a `moments.yaml`) is missing.
 */
export function DeliverDialog(props: { lessonId: string; onClose: () => void }): React.JSX.Element {
  const [preview, setPreview] = useState<DeliverPreview | null>(null);
  const [running, setRunning] = useState(false);

  const run = React.useCallback(() => {
    setRunning(true);
    setPreview(null);
    studio
      .deliverPreview(props.lessonId)
      .then(setPreview)
      .finally(() => setRunning(false));
  }, [props.lessonId]);

  useEffect(() => run(), [run]);

  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>
          Deliver <span style={{ fontFamily: "var(--mono)" }}>{props.lessonId}</span>
        </h3>

        <div className="note" style={{ marginBottom: 12 }}>
          Safe preview — <strong>dry-run only</strong>. This exports a finished MP4 and previews the
          publish + LMS rows, but writes nothing to Mux or the database. A real publish/attach is a
          deliberate CLI&nbsp;/&nbsp;“Ask&nbsp;Devin” step.
        </div>

        {running && <div className="note">Running export → publish → attach (dry-run)…</div>}

        {preview && (
          <div className="deliver-steps">
            <ExportStep step={1} outcome={preview.export} />
            <PublishStep step={2} outcome={preview.publish} />
            <AttachStep step={3} outcome={preview.attach} />
          </div>
        )}

        <div className="actions">
          <button onClick={run} disabled={running}>
            {running ? "Running…" : "Re-run preview"}
          </button>
          <button className="primary" onClick={props.onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function StepShell(props: {
  step: number;
  title: string;
  ok: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="deliver-step">
      <div className="deliver-step-head">
        <span className={`dot-led ${props.ok ? "ok" : "bad"}`} />
        <span className="deliver-step-title">
          {props.step} · {props.title}
        </span>
      </div>
      <div className="deliver-step-body">{props.children}</div>
    </div>
  );
}

function ExportStep(props: { step: number; outcome: DeliverPreview["export"] }): React.JSX.Element {
  if (!props.outcome.ok) {
    return (
      <StepShell step={props.step} title="Export" ok={false}>
        <div className="validation bad">{props.outcome.error}</div>
      </StepShell>
    );
  }
  const r: ExportResult = props.outcome.value;
  return (
    <StepShell step={props.step} title="Export" ok={r.withinTolerance}>
      <div className="kv">
        <code>{r.path}</code>
        <span>
          {r.clipCount} clips · {r.durationSeconds.toFixed(1)}s (plan {r.expectedDuration.toFixed(1)}s · drift{" "}
          {r.driftSeconds.toFixed(2)}s) · {r.width}×{r.height}@{r.fps} · {mb(r.sizeBytes)}
        </span>
        <span className={r.withinTolerance ? "verdict ok" : "verdict bad"}>
          ffprobe: {r.withinTolerance ? "within tolerance ✓" : "duration drift — check"}
        </span>
        {r.notes.map((n, i) => (
          <span key={i} className="note">
            {n}
          </span>
        ))}
      </div>
    </StepShell>
  );
}

function PublishStep(props: { step: number; outcome: DeliverPreview["publish"] }): React.JSX.Element {
  if (!props.outcome.ok) {
    return (
      <StepShell step={props.step} title="Publish (Mux)" ok={false}>
        <div className="validation bad">{props.outcome.error}</div>
      </StepShell>
    );
  }
  const r: PublishResult = props.outcome.value;
  return (
    <StepShell step={props.step} title="Publish (Mux)" ok>
      <div className="kv">
        <span>
          {r.dryRun ? "dry-run — nothing uploaded" : "uploaded"} · {mb(r.sizeBytes)} · status {r.status}
        </span>
        <span>playback id: {r.playbackId ?? "— (set on a real publish)"}</span>
        <span className="note">
          To publish for real: <code>palmier publish {r.lessonId} --target mux</code> (needs Mux creds).
        </span>
      </div>
    </StepShell>
  );
}

function AttachStep(props: { step: number; outcome: DeliverPreview["attach"] }): React.JSX.Element {
  if (!props.outcome.ok) {
    return (
      <StepShell step={props.step} title="Moments + Attach (LMS preview)" ok={false}>
        <div className="note">{props.outcome.error}</div>
        <div className="note">
          Optional — author <code>moments.yaml</code> (sections / prompts / links) to add interactivity.
        </div>
      </StepShell>
    );
  }
  const r: AttachResult = props.outcome.value;
  return (
    <StepShell step={props.step} title="Moments + Attach (LMS preview)" ok>
      <div className="kv">
        <span>
          target <code>{r.target}</code> · {r.applied ? "applied" : "dry-run — no rows written"}
        </span>
        <span>
          {r.sectionCount} sections · {r.momentCount} moments · {r.checkpointCount} checkpoints → course{" "}
          <code>{r.course}</code> / <code>{r.lessonSlug}</code>
        </span>
        <span className="note">
          reviewable SQL: <code>{r.sqlPath}</code>
        </span>
        {r.notes.map((n, i) => (
          <span key={i} className="note">
            {n}
          </span>
        ))}
        <span className="note">
          To write for real: <code>palmier attach {r.lessonId} --target api --apply</code> (double-gated; needs a
          playback id).
        </span>
      </div>
    </StepShell>
  );
}
