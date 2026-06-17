import { BRAND, VIDEO } from "../brand.js";
import type { Background, FrameType, SlideSpec } from "../types.js";

export interface DeckSlide {
  frameId: string;
  spec: SlideSpec;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Default background for a frame type when the spec does not set one. */
export function defaultBg(frame: FrameType): Background {
  switch (frame) {
    case "N1-title":
    case "N2-section":
    case "C7-stat":
    case "O1-outro":
      return "gradient";
    default:
      return "dark";
  }
}

function eyebrow(spec: SlideSpec): string {
  return spec.eyebrow ? `<div class="eyebrow">${esc(spec.eyebrow)}</div>` : "";
}

function footer(spec: SlideSpec): string {
  const text = spec.footer ?? BRAND.wordmark;
  return `<div class="wordmark">${esc(text)}</div>`;
}

function bullets(items: string[]): string {
  return `<ul class="bullets">${items.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`;
}

/** Render the inner HTML for a single frame based on its type. */
function renderFrameBody(spec: SlideSpec): string {
  const title = spec.title ? esc(spec.title) : "";
  const subtitle = spec.subtitle ? `<p class="subtitle">${esc(spec.subtitle)}</p>` : "";
  switch (spec.frame) {
    case "N1-title":
      return `<div class="center">${eyebrow(spec)}<h1 class="hero">${title}</h1>${subtitle}</div>`;
    case "N2-section":
      return `<div class="center">${eyebrow(spec)}<h1 class="section-title">${title}</h1>${subtitle}</div>`;
    case "N3-quote":
      return `<div class="center"><blockquote class="quote">${title || esc(spec.body?.[0] ?? "")}</blockquote>${
        spec.subtitle ? `<p class="attribution">— ${esc(spec.subtitle)}</p>` : ""
      }</div>`;
    case "N4-vocab":
      return `<div>${eyebrow(spec)}<h2 class="frame-title">${title}</h2><div class="tags">${(spec.tags ?? [])
        .map((t) => `<span class="tag">${esc(t)}</span>`)
        .join("")}</div></div>`;
    case "N5-agenda":
      return `<div>${eyebrow(spec)}<h2 class="frame-title">${title}</h2><ol class="agenda">${(spec.body ?? [])
        .map((b) => `<li>${esc(b)}</li>`)
        .join("")}</ol></div>`;
    case "C1-bullets":
      return `<div>${eyebrow(spec)}<h2 class="frame-title">${title}</h2>${subtitle}${bullets(spec.body ?? [])}</div>`;
    case "C2-statement":
      return `<div class="center"><h1 class="statement">${title || esc(spec.body?.[0] ?? "")}</h1>${subtitle}</div>`;
    case "C3-compare":
      return `<div>${eyebrow(spec)}<h2 class="frame-title">${title}</h2><div class="columns">${(spec.columns ?? [])
        .map(
          (col) =>
            `<div class="column"><div class="column-head">${esc(col.heading)}</div>${bullets(col.items)}</div>`,
        )
        .join("")}</div></div>`;
    case "C4-steps":
      return `<div>${eyebrow(spec)}<h2 class="frame-title">${title}</h2><ol class="steps">${(spec.body ?? [])
        .map((b, i) => `<li><span class="step-n">${i + 1}</span><span>${esc(b)}</span></li>`)
        .join("")}</ol></div>`;
    case "C5-callout":
      return `<div>${eyebrow(spec)}<h2 class="frame-title">${title}</h2><div class="callout">${(spec.body ?? [])
        .map((b) => `<p>${esc(b)}</p>`)
        .join("")}</div></div>`;
    case "C6-code":
      return `<div>${eyebrow(spec)}<h2 class="frame-title">${title}</h2><pre class="code"><code>${esc(
        spec.code ?? "",
      )}</code></pre></div>`;
    case "C7-stat":
      return `<div class="center"><div class="stat">${esc(spec.stat ?? title)}</div><div class="stat-label">${esc(
        spec.statLabel ?? spec.subtitle ?? "",
      )}</div></div>`;
    case "C8-figure":
      return `<div>${eyebrow(spec)}<h2 class="frame-title">${title}</h2><div class="figure">${
        spec.image
          ? `<img src="${esc(spec.image)}" alt="${esc(spec.caption ?? "")}"/>`
          : `<div class="figure-placeholder">figure</div>`
      }</div>${spec.caption ? `<p class="caption">${esc(spec.caption)}</p>` : ""}</div>`;
    case "D1-placeholder":
      return `<div class="center demo">${eyebrow(spec)}<div class="demo-badge">DEMO</div><h2 class="demo-title">${
        title || "Screen recording"
      }</h2>${subtitle}</div>`;
    case "D2-lowerthird":
      return `<div class="lowerthird-stage"><div class="lowerthird"><div class="lt-title">${title}</div>${
        spec.subtitle ? `<div class="lt-sub">${esc(spec.subtitle)}</div>` : ""
      }</div></div>`;
    case "O1-outro":
      return `<div class="center">${eyebrow(spec)}<h1 class="hero">${title || BRAND.wordmark}</h1>${subtitle}</div>`;
    default:
      return `<div class="center"><h1>${title}</h1></div>`;
  }
}

function renderSlide(slide: DeckSlide, index: number): string {
  const bg = slide.spec.bg ?? defaultBg(slide.spec.frame);
  return `<section class="frame frame--${bg}" data-index="${index}" data-frame="${slide.spec.frame}" data-frame-id="${esc(
    slide.frameId,
  )}">
    <div class="frame-inner">${renderFrameBody(slide.spec)}</div>
    ${footer(slide.spec)}
  </section>`;
}

/** Build a single self-contained HTML deck containing every slide. */
export function buildDeck(slides: DeckSlide[]): string {
  const css = deckCss();
  const body = slides.map((s, i) => renderSlide(s, i)).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=${VIDEO.cssWidth}, height=${VIDEO.cssHeight}" />
<title>HGDW Deck</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
<style>${css}</style>
</head>
<body>
<div id="deck">
${body}
</div>
<script>
  (function () {
    var frames = Array.prototype.slice.call(document.querySelectorAll('.frame'));
    function show(i) {
      var idx = Math.max(0, Math.min(frames.length - 1, i | 0));
      frames.forEach(function (f, k) { f.classList.toggle('is-active', k === idx); });
    }
    function fromHash() {
      var n = parseInt((location.hash || '').replace('#', ''), 10);
      return Number.isFinite(n) ? Math.max(0, Math.min(frames.length - 1, n)) : 0;
    }
    window.__show = show;          // used by the renderer to step through slides
    window.__frameCount = frames.length;
    window.addEventListener('hashchange', function () { show(fromHash()); });
    show(fromHash());
    // Signal to the renderer that fonts + layout are ready.
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
      window.__deckReady = true;
    });
  })();
</script>
</body>
</html>`;
}

function deckCss(): string {
  const { colors, gradient, fonts, border } = BRAND;
  return `
  :root {
    --yellow: ${colors.yellow}; --coral: ${colors.coral}; --sunset: ${colors.sunset};
    --dark: ${colors.darkBg}; --text: ${colors.text}; --soft: ${colors.softText};
    --gradient: ${gradient};
    --sans: '${fonts.sans}', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
    --mono: '${fonts.mono}', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${VIDEO.cssWidth}px; height: ${VIDEO.cssHeight}px; background: var(--dark); }
  #deck { width: ${VIDEO.cssWidth}px; height: ${VIDEO.cssHeight}px; }
  .frame {
    display: none; position: relative; width: ${VIDEO.cssWidth}px; height: ${VIDEO.cssHeight}px;
    overflow: hidden; font-family: var(--sans); color: var(--text);
    padding: 56px 64px 64px;
  }
  .frame.is-active { display: flex; flex-direction: column; }
  /* 3px gradient border */
  .frame::after {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    border: ${border} solid transparent;
    background: var(--gradient) border-box; -webkit-mask:
      linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude;
  }
  .frame--dark { background: radial-gradient(1200px 700px at 18% 8%, rgba(255,126,95,0.10), transparent 55%), var(--dark); }
  .frame--gradient { background: var(--gradient); color: var(--dark); }
  .frame--light { background: #f6efe6; color: var(--dark); }
  .frame-inner { flex: 1; display: flex; flex-direction: column; justify-content: center; min-height: 0; }
  .center { text-align: center; align-items: center; }
  .frame .center { display: flex; flex-direction: column; justify-content: center; }

  .eyebrow { font-size: 15px; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 700; opacity: 0.78; margin-bottom: 18px; }
  .frame--gradient .eyebrow { opacity: 0.7; }
  .hero { font-size: 64px; font-weight: 900; letter-spacing: -0.03em; line-height: 1.02; }
  .section-title { font-size: 52px; font-weight: 800; letter-spacing: -0.02em; }
  .subtitle { margin-top: 16px; font-size: 22px; color: var(--soft); font-weight: 400; }
  .frame--gradient .subtitle { color: rgba(10,8,8,0.72); }
  .frame-title { font-size: 38px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 22px; }

  .bullets { list-style: none; display: flex; flex-direction: column; gap: 14px; }
  .bullets li { position: relative; padding-left: 30px; font-size: 23px; line-height: 1.35; color: var(--text); }
  .bullets li::before { content: ''; position: absolute; left: 0; top: 12px; width: 12px; height: 12px; border-radius: 3px; background: var(--gradient); }

  .statement { font-size: 50px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1;
    background: var(--gradient); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .quote { font-size: 42px; font-weight: 700; line-height: 1.2; max-width: 760px; }
  .attribution { margin-top: 20px; color: var(--soft); font-size: 20px; }

  .tags { display: flex; flex-wrap: wrap; gap: 14px; }
  .tag { font-family: var(--mono); font-size: 22px; padding: 12px 18px; border-radius: 12px;
    border: 1px solid rgba(255,213,107,0.4); background: rgba(255,126,95,0.10); color: var(--yellow); }

  .agenda, .steps { list-style: none; counter-reset: a; display: flex; flex-direction: column; gap: 16px; }
  .agenda li { font-size: 24px; counter-increment: a; }
  .agenda li::before { content: counter(a, decimal-leading-zero) '  '; color: var(--coral); font-family: var(--mono); font-weight: 700; }
  .steps li { display: flex; align-items: center; gap: 18px; font-size: 24px; }
  .step-n { display: inline-grid; place-items: center; width: 46px; height: 46px; border-radius: 12px; font-family: var(--mono); font-weight: 700;
    color: var(--dark); background: var(--gradient); flex: none; }

  .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
  .column { border: 1px solid var(--border, rgba(246,239,230,0.12)); border-radius: 16px; padding: 24px; background: rgba(246,239,230,0.04); }
  .column-head { font-size: 22px; font-weight: 800; margin-bottom: 16px; color: var(--yellow); }

  .callout { border-left: 4px solid var(--coral); border-radius: 12px; padding: 22px 26px; background: rgba(255,82,99,0.10); }
  .callout p { font-size: 23px; line-height: 1.4; }
  .callout p + p { margin-top: 12px; }

  pre.code { font-family: var(--mono); font-size: 19px; line-height: 1.5; padding: 24px 26px; border-radius: 14px;
    background: #050404; border: 1px solid rgba(246,239,230,0.12); color: var(--text); white-space: pre-wrap; overflow: hidden; }

  .stat { font-size: 132px; font-weight: 900; letter-spacing: -0.04em; line-height: 1; }
  .frame--gradient .stat { color: var(--dark); }
  .stat-label { margin-top: 14px; font-size: 24px; font-weight: 600; }
  .frame--gradient .stat-label { color: rgba(10,8,8,0.7); }

  .figure { flex: 1; display: grid; place-items: center; }
  .figure img { max-width: 100%; max-height: 360px; border-radius: 14px; border: 1px solid rgba(246,239,230,0.12); }
  .figure-placeholder { width: 70%; height: 320px; display: grid; place-items: center; border: 2px dashed rgba(246,239,230,0.25);
    border-radius: 14px; color: var(--soft); text-transform: uppercase; letter-spacing: 0.2em; font-size: 16px; }
  .caption { margin-top: 16px; text-align: center; color: var(--soft); font-size: 18px; }

  .demo .demo-badge { font-family: var(--mono); font-weight: 700; letter-spacing: 0.3em; font-size: 18px; color: var(--dark);
    background: var(--gradient); padding: 8px 16px; border-radius: 999px; margin-bottom: 20px; }
  .demo-title { font-size: 44px; font-weight: 800; }

  .lowerthird-stage { flex: 1; display: flex; align-items: flex-end; }
  .lowerthird { background: rgba(5,4,4,0.86); border-left: 5px solid var(--coral); padding: 16px 24px; border-radius: 10px; }
  .lt-title { font-size: 30px; font-weight: 800; }
  .lt-sub { font-size: 18px; color: var(--soft); margin-top: 4px; }

  .wordmark { position: absolute; left: 64px; bottom: 28px; font-size: 13px; letter-spacing: 0.28em;
    font-weight: 800; text-transform: uppercase; opacity: 0.6; }
  .frame--gradient .wordmark { color: var(--dark); opacity: 0.55; }
  `;
}
