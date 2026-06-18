import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PreviewDeck } from "../lib/preview";

interface DeckWindow extends Window {
  __show?: (i: number) => void;
  __deckReady?: boolean;
}

/**
 * Live WYSIWYG preview: loads the engine's own HTML deck into a sandboxed
 * iframe and jumps to the focused segment's frame via `window.__show(i)` — the
 * exact pixels the Slides agent will render, with zero Chromium spawn.
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

  // Reload the deck HTML when it changes.
  useEffect(() => {
    const iframe = frame.current;
    if (!iframe) return;
    iframe.srcdoc = props.deck?.html ?? "<!doctype html><body style='background:#000'></body>";
  }, [props.deck?.html]);

  // Step to the focused frame once the deck signals ready.
  useEffect(() => {
    const iframe = frame.current;
    if (!iframe || props.focusIndex == null) return;
    const target = props.focusIndex;
    let tries = 0;
    const tick = () => {
      const w = iframe.contentWindow as DeckWindow | null;
      if (w?.__show) {
        w.__show(target);
      } else if (tries++ < 40) {
        setTimeout(tick, 25);
      }
    };
    tick();
  }, [props.focusIndex, props.deck?.html]);

  return (
    <div className="preview-wrap">
      <div className="preview-frame" ref={wrap} style={{ height: wrap.current ? wrap.current.clientWidth / (16 / 9) : undefined }}>
        <iframe
          ref={frame}
          title="slide preview"
          sandbox="allow-scripts"
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
