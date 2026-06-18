import React, { useEffect, useState } from "react";
import { studio } from "../lib/bridge";
import type { DoctorResult } from "../../shared/ipc";

/** Modal that runs `palmier doctor --json` and lists each preflight check. */
export function Doctor(props: { onClose: () => void }): React.JSX.Element {
  const [result, setResult] = useState<DoctorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    studio
      .doctor()
      .then(setResult)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Doctor — preflight checks</h3>
        {error && <div className="validation bad">{error}</div>}
        {!result && !error && <div className="note">Running checks…</div>}
        {result && (
          <div className="doctor-list">
            {result.checks.map((c) => (
              <div className="doctor-row" key={c.name}>
                <span className="dot-led" style={{ background: c.ok ? "var(--ok)" : "var(--bad)" }} />
                <span className="name">{c.name}</span>
                <span className="detail">{c.detail}</span>
                {!c.ok && c.fix && <span className="fix">↳ {c.fix}</span>}
              </div>
            ))}
          </div>
        )}
        <div className="actions">
          <button onClick={props.onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
