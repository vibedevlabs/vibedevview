import React from "react";
import type { Manifest } from "vibedevview/types";

/** Left rail: one card per segment, the primary way to navigate a lesson. */
export function Outline(props: {
  manifest: Manifest | null;
  activeId: string | null;
  onSelect: (segId: string) => void;
}): React.JSX.Element {
  if (!props.manifest) return <div className="empty">No valid script yet.</div>;
  return (
    <div className="outline">
      {props.manifest.segments.map((seg) => {
        const kinds = [seg.say && "SAY", seg.slide && "SLIDE", seg.do?.length && "DO"].filter(Boolean) as string[];
        return (
          <button
            key={seg.id}
            className={`seg-card${seg.id === props.activeId ? " active" : ""}`}
            onClick={() => props.onSelect(seg.id)}
          >
            <div className="row">
              <span className="seg-id">{seg.id}</span>
              <span className="seg-label">{seg.label ?? "(untitled)"}</span>
            </div>
            <div className="chips">
              {seg.phase && <span className="chip phase">{seg.phase}</span>}
              {seg.slide && <span className="chip frame">{seg.slide.frame}</span>}
              {kinds.map((k) => (
                <span key={k} className="chip">
                  {k}
                </span>
              ))}
              <span className="chip dur">{seg.durationEstimate}s</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
