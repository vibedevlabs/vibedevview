import React, { useState } from "react";
import { studio } from "../lib/bridge";
import { diffLines, hasChanges } from "../lib/diff";

/**
 * Draft-with-AI: generate a script.md from a topic brief via the engine's LLM
 * drafter. The result is shown as a diff against the current script and only
 * applied on explicit approval (Hard Rule #5 holds for AI edits too).
 */
export function DraftWithAI(props: {
  lessonId: string;
  currentScript: string;
  onClose: () => void;
  onApply: (script: string) => void;
}): React.JSX.Element {
  const [brief, setBrief] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const script = await studio.draft({ lessonId: props.lessonId, brief });
      setDraft(script);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const diff = draft == null ? [] : diffLines(props.currentScript, draft);
  const changed = draft != null && hasChanges(props.currentScript, draft);

  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Draft with AI</h3>
        <div className="field">
          <label>Topic brief</label>
          <textarea
            value={brief}
            placeholder="e.g. A 90-second intro to prompt-driven development for non-engineers"
            onChange={(e) => setBrief(e.target.value)}
          />
        </div>

        {error && <div className="validation bad">{error}</div>}

        {draft != null && (
          <>
            <div className="note">
              {changed ? "Review the proposed script before applying:" : "The draft matches your current script."}
            </div>
            <div className="diff">
              {diff.slice(0, 400).map((l, i) => (
                <div key={i} className={l.kind === "add" ? "add" : l.kind === "del" ? "del" : undefined}>
                  {l.kind === "add" ? "+ " : l.kind === "del" ? "- " : "  "}
                  {l.text}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="actions">
          <button onClick={props.onClose} disabled={busy}>
            Cancel
          </button>
          {draft == null ? (
            <button className="primary" onClick={generate} disabled={busy || brief.trim().length === 0}>
              {busy ? "Drafting…" : "Generate"}
            </button>
          ) : (
            <button className="primary" onClick={() => props.onApply(draft)} disabled={!changed}>
              Apply to editor
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
