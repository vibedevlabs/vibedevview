import React from "react";

export interface RunState {
  running: boolean;
  phase: string | null;
  slides: number;
  voices: number;
  lastMessage: string;
  ok: boolean | null;
}

export const initialRunState: RunState = {
  running: false,
  phase: null,
  slides: 0,
  voices: 0,
  lastMessage: "Idle",
  ok: null,
};

/** Bottom bar reflecting the live engine event stream during Produce/Revise. */
export function StatusPanel(props: { state: RunState }): React.JSX.Element {
  const s = props.state;
  const led = s.running ? "run" : s.ok === true ? "ok" : s.ok === false ? "bad" : "";
  return (
    <div className="statusbar">
      <span>
        <span className={`dot-led ${led}`} />
        {s.running ? `Running · ${s.phase ?? "…"}` : s.ok === true ? "Done" : s.ok === false ? "Failed" : "Ready"}
      </span>
      <span className="status-counts">
        slides {s.slides} · voices {s.voices}
      </span>
      <span className="status-msg">{s.lastMessage}</span>
    </div>
  );
}
