import React, { useState } from "react";
import { studio } from "../lib/bridge";

/**
 * Pure validation for a new lesson id. Trims, rejects empty/whitespace-only,
 * and flags ids that collide with an existing lesson (case-sensitive, matching
 * the on-disk folder names). Kept pure so it's unit-testable without a DOM.
 */
export function newLessonIdState(raw: string, existing: string[]): { id: string; duplicate: boolean; valid: boolean } {
  const id = raw.trim();
  const duplicate = id.length > 0 && existing.includes(id);
  return { id, duplicate, valid: id.length > 0 && !duplicate };
}

/**
 * In-app "New lesson" dialog. Electron's renderer does NOT implement
 * window.prompt() (it no-ops and returns null), so the toolbar button must use
 * a real modal to collect the lesson id. Scaffolds the folder via
 * studio.newLesson (`palmier init`) and hands the created id back to the app.
 */
export function NewLessonDialog(props: {
  existing: string[];
  onClose: () => void;
  onCreated: (id: string) => void | Promise<void>;
}): React.JSX.Element {
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { id: trimmed, duplicate, valid } = newLessonIdState(id, props.existing);

  async function create() {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      await studio.newLesson(trimmed);
      await props.onCreated(trimmed);
      props.onClose();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>New lesson</h3>
        <div className="field">
          <label>Lesson id</label>
          <input
            autoFocus
            value={id}
            placeholder="e.g. B-DEMO1"
            onChange={(e) => setId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && valid && !busy) create();
            }}
          />
          <div className="note">
            Creates <span style={{ fontFamily: "var(--mono)" }}>~/hgdw-productions/{trimmed || "<id>"}</span> seeded
            with the example script. Then draft over it with “Draft with AI”.
          </div>
        </div>

        {duplicate && <div className="validation bad">A lesson “{trimmed}” already exists.</div>}
        {error && <div className="validation bad">{error}</div>}

        <div className="actions">
          <button onClick={props.onClose} disabled={busy}>
            Cancel
          </button>
          <button className="primary" onClick={create} disabled={!valid || busy}>
            {busy ? "Creating…" : "Create lesson"}
          </button>
        </div>
      </div>
    </div>
  );
}
