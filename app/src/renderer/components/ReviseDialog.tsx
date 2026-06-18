import React, { useEffect, useMemo, useState } from "react";
import { studio } from "../lib/bridge";
import { diffLines, hasChanges } from "../lib/diff";
import type { FeedbackKind } from "../../shared/ipc";

const KINDS: { value: FeedbackKind; label: string; editsScript: boolean }[] = [
  { value: "narration", label: "Narration (re-voice)", editsScript: true },
  { value: "slide", label: "Slide (re-render)", editsScript: true },
  { value: "recording", label: "Recording (re-capture)", editsScript: false },
  { value: "retime", label: "Retime only", editsScript: false },
];

/**
 * Revise = surgical single-segment correction. When the edit changes script.md
 * (narration/slide) we enforce Hard Rule #5: show the diff and require explicit
 * approval before writing the script and running `palmier correct --seg`.
 */
export function ReviseDialog(props: {
  lessonId: string;
  segId: string;
  /** Current in-editor script (may contain unsaved edits). */
  editedScript: string;
  onClose: () => void;
  onApplied: () => void;
}): React.JSX.Element {
  const [onDisk, setOnDisk] = useState<string | null>(null);
  const [kind, setKind] = useState<FeedbackKind>("slide");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    studio.readScript(props.lessonId).then((s) => setOnDisk(s ?? ""));
  }, [props.lessonId]);

  const diff = useMemo(() => (onDisk == null ? [] : diffLines(onDisk, props.editedScript)), [onDisk, props.editedScript]);
  const changed = onDisk != null && hasChanges(onDisk, props.editedScript);
  const editsScript = KINDS.find((k) => k.value === kind)!.editsScript;
  const needsApproval = editsScript && changed;

  async function apply() {
    setBusy(true);
    setError(null);
    try {
      if (editsScript && changed) await studio.writeScript(props.lessonId, props.editedScript);
      const res = await studio.correct({ lessonId: props.lessonId, segId: props.segId, kind, backend: "ffmpeg" });
      if (!res.ok) {
        setError(res.error ?? "correction failed");
        return;
      }
      props.onApplied();
      props.onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>
          Revise segment <span style={{ fontFamily: "var(--mono)" }}>{props.segId}</span>
        </h3>

        <div className="field">
          <label>What changed?</label>
          <div className="kinds">
            {KINDS.map((k) => (
              <label key={k.value}>
                <input type="radio" name="kind" checked={kind === k.value} onChange={() => setKind(k.value)} />
                {k.label}
              </label>
            ))}
          </div>
        </div>

        {editsScript && (
          <>
            <div className="note">
              {changed
                ? "This will overwrite script.md with your edits, then re-render only this segment. Review the diff:"
                : "No script.md changes detected — this will just re-render this segment from the current script."}
            </div>
            {changed && (
              <div className="diff">
                {diff.map((l, i) => (
                  <div key={i} className={l.kind === "add" ? "add" : l.kind === "del" ? "del" : undefined}>
                    {l.kind === "add" ? "+ " : l.kind === "del" ? "- " : "  "}
                    {l.text}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {error && <div className="validation bad">{error}</div>}

        <div className="actions">
          <button onClick={props.onClose} disabled={busy}>
            Cancel
          </button>
          <button className="primary" onClick={apply} disabled={busy}>
            {busy ? "Applying…" : needsApproval ? "Approve & re-render" : "Re-render segment"}
          </button>
        </div>
      </div>
    </div>
  );
}
