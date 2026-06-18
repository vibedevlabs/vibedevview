import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PreviewDeck } from "../lib/preview";

/**
 * Live WYSIWYG preview: loads the engine's own HTML deck into a sandboxed
 * same-origin iframe and shows the focused segment's frame — the exact pixels
 * the Slides agent will render, with zero Chromium spawn. The app's strict CSP
 * blocks the deck's inline navigation script, so we drive frame selection from
 * the parent by toggling `.is-active` on the same-origin document instead.
 */
export function Preview(props: { deck: PreviewDeck | null; focusIndex: number | null }): React.JSX.Element {
  const wrap = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.25);

  // Scale the fixed 1920x1080 deck down to the pane width.
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1920));
    ro.observe(el);
    setScale(el.clientWidth / 1920);
    return () => ro.disconnect();
  }, []);

  const lastHtml = useRef<string | null>(null);

  // Reload the deck and/or show the focused frame. When the html changes we must
  // wait for srcdoc to finish parsing (load event) before toggling `.is-active`,
  // otherwise we'd mark the old document active and the freshly-loaded blank deck
  // would show nothing. Focus-only changes apply immediately on the live doc.
  useEffect(() => {
    const iframe = frame.current;
    if (!iframe) return;
    const html = props.deck?.html ?? "<!doctype html><body style='background:#000'></body>";
    const target = props.focusIndex ?? 0;
    const applyActive = () => {
      const frames = iframe.contentDocument?.querySelectorAll<HTMLElement>(".frame");
      frames?.forEach((f, k) => f.classList.toggle("is-active", k === target));
    };
    if (lastHtml.current !== html) {
      lastHtml.current = html;
      iframe.onload = applyActive;
      iframe.srcdoc = html;
    } else {
      applyActive();
    }
  }, [props.deck?.html, props.focusIndex]);

  return (
    <div className="preview-wrap">
      <div className="preview-frame" ref={wrap} style={{ height: wrap.current ? wrap.current.clientWidth / (16 / 9) : undefined }}>
        <iframe
          ref={frame}
          title="slide preview"
          sandbox="allow-scripts allow-same-origin"
          style={{ transform: `scale(${scale})` }}
        />
      </div>
      <div className="preview-meta">
        {props.focusIndex == null ? (
          <span>This segment has no slide.</span>
        ) : (
          <>
            <span>
              frame <span className="frame-id">{props.deck?.frames[props.focusIndex]?.frameId}</span>
            </span>
            <span>·</span>
            <span>
              {props.focusIndex + 1} / {props.deck?.frames.length ?? 0}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
