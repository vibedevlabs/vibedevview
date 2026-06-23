import React from "react";
import { FRAME_TYPES, type Background, type Segment, type SlideSpec } from "vibedevview/types";

const BACKGROUNDS: Background[] = ["gradient", "dark", "light"];
const PHASES = ["SOURCE", "ABSORB", "MIRROR", "COMMAND"] as const;

/** Which optional slide fields each frame type surfaces, so the form stays focused. */
const FIELDS_BY_FRAME: Record<string, Array<keyof SlideSpec>> = {
  "N1-title": ["eyebrow", "title", "subtitle"],
  "N2-section": ["eyebrow", "title"],
  "N3-quote": ["title", "subtitle"],
  "N4-vocab": ["title", "tags"],
  "N5-agenda": ["title", "body"],
  "C1-bullets": ["title", "body"],
  "C2-statement": ["title"],
  "C3-compare": ["title", "columns"],
  "C4-steps": ["title", "body"],
  "C5-callout": ["title", "body"],
  "C6-code": ["title", "code", "lang"],
  "C7-stat": ["stat", "statLabel", "title"],
  "C8-figure": ["title", "image", "caption"],
  "C9-grid": ["eyebrow", "title", "cards"],
  "C10-flow": ["eyebrow", "title", "body"],
  "C11-icons": ["eyebrow", "title", "cards"],
  "D1-placeholder": ["eyebrow", "title"],
  "D2-lowerthird": ["title", "subtitle"],
  "O1-outro": ["title", "subtitle"],
};

const lines = (v?: string[]) => (v ?? []).join("\n");
const toLines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

export function SegmentForm(props: { segment: Segment | null; onChange: (next: Segment) => void }): React.JSX.Element {
  const seg = props.segment;
  if (!seg) return <div className="empty">Select a segment to edit its fields.</div>;

  const patch = (over: Partial<Segment>) => props.onChange({ ...seg, ...over });
  const patchSlide = (over: Partial<SlideSpec>) => {
    if (!seg.slide) return;
    props.onChange({ ...seg, slide: { ...seg.slide, ...over } });
  };

  const slide = seg.slide;
  const shown = slide ? FIELDS_BY_FRAME[slide.frame] ?? ["title"] : [];

  return (
    <div className="seg-form">
      <div className="field">
        <label>Label</label>
        <input value={seg.label ?? ""} onChange={(e) => patch({ label: e.target.value || undefined })} />
      </div>

      <div className="field">
        <label>Phase</label>
        <select value={seg.phase ?? ""} onChange={(e) => patch({ phase: (e.target.value || undefined) as Segment["phase"] })}>
          <option value="">—</option>
          {PHASES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Duration estimate (s)</label>
        <input
          type="number"
          min={1}
          value={seg.durationEstimate}
          onChange={(e) => patch({ durationEstimate: Math.max(1, Number(e.target.value) || 1) })}
        />
      </div>

      <div className="field">
        <label>Narration (SAY)</label>
        <textarea value={seg.say ?? ""} onChange={(e) => patch({ say: e.target.value || undefined })} />
      </div>

      {slide && (
        <>
          <div className="field">
            <label>Frame type</label>
            <select value={slide.frame} onChange={(e) => patchSlide({ frame: e.target.value as SlideSpec["frame"] })}>
              {FRAME_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Background</label>
            <select value={slide.bg ?? ""} onChange={(e) => patchSlide({ bg: (e.target.value || undefined) as Background })}>
              <option value="">default</option>
              {BACKGROUNDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {shown.includes("eyebrow") && (
            <TextField label="Eyebrow" value={slide.eyebrow} onChange={(v) => patchSlide({ eyebrow: v })} />
          )}
          {shown.includes("title") && <TextField label="Title" value={slide.title} onChange={(v) => patchSlide({ title: v })} />}
          {shown.includes("subtitle") && (
            <TextField label="Subtitle" value={slide.subtitle} onChange={(v) => patchSlide({ subtitle: v })} />
          )}
          {shown.includes("stat") && <TextField label="Stat" value={slide.stat} onChange={(v) => patchSlide({ stat: v })} />}
          {shown.includes("statLabel") && (
            <TextField label="Stat label" value={slide.statLabel} onChange={(v) => patchSlide({ statLabel: v })} />
          )}
          {shown.includes("image") && <TextField label="Image path" value={slide.image} onChange={(v) => patchSlide({ image: v })} />}
          {shown.includes("caption") && (
            <TextField label="Caption" value={slide.caption} onChange={(v) => patchSlide({ caption: v })} />
          )}
          {shown.includes("lang") && <TextField label="Code language" value={slide.lang} onChange={(v) => patchSlide({ lang: v })} />}

          {shown.includes("body") && (
            <div className="field">
              <label>Body (one item per line)</label>
              <textarea value={lines(slide.body)} onChange={(e) => patchSlide({ body: toLines(e.target.value) })} />
            </div>
          )}
          {shown.includes("tags") && (
            <div className="field">
              <label>Tags (one per line)</label>
              <textarea value={lines(slide.tags)} onChange={(e) => patchSlide({ tags: toLines(e.target.value) })} />
            </div>
          )}
          {shown.includes("code") && (
            <div className="field">
              <label>Code</label>
              <textarea className="mono" value={slide.code ?? ""} onChange={(e) => patchSlide({ code: e.target.value || undefined })} />
            </div>
          )}
          {shown.includes("cards") && (
            <div className="field">
              <label>Cards (stat optional)</label>
              {(slide.cards ?? []).map((card, i) => (
                <div className="field" key={i}>
                  <input
                    placeholder="Icon / emoji (optional, e.g. ⚡)"
                    value={card.icon ?? ""}
                    onChange={(e) => {
                      const cards = [...(slide.cards ?? [])];
                      cards[i] = { ...card, icon: e.target.value || undefined };
                      patchSlide({ cards });
                    }}
                  />
                  <input
                    placeholder="Stat (optional, e.g. 80%)"
                    value={card.stat ?? ""}
                    onChange={(e) => {
                      const cards = [...(slide.cards ?? [])];
                      cards[i] = { ...card, stat: e.target.value || undefined };
                      patchSlide({ cards });
                    }}
                  />
                  <input
                    placeholder="Title"
                    value={card.title}
                    onChange={(e) => {
                      const cards = [...(slide.cards ?? [])];
                      cards[i] = { ...card, title: e.target.value };
                      patchSlide({ cards });
                    }}
                  />
                  <input
                    placeholder="Detail line (optional)"
                    value={card.body ?? ""}
                    onChange={(e) => {
                      const cards = [...(slide.cards ?? [])];
                      cards[i] = { ...card, body: e.target.value || undefined };
                      patchSlide({ cards });
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                className="ghost"
                onClick={() => patchSlide({ cards: [...(slide.cards ?? []), { title: "" }] })}
              >
                + Add card
              </button>
            </div>
          )}
          {shown.includes("columns") && (
            <div className="field">
              <label>Columns</label>
              {(slide.columns ?? []).map((col, i) => (
                <div className="field" key={i}>
                  <input
                    placeholder="Heading"
                    value={col.heading}
                    onChange={(e) => {
                      const columns = [...(slide.columns ?? [])];
                      columns[i] = { ...col, heading: e.target.value };
                      patchSlide({ columns });
                    }}
                  />
                  <textarea
                    placeholder="Items (one per line)"
                    value={lines(col.items)}
                    onChange={(e) => {
                      const columns = [...(slide.columns ?? [])];
                      columns[i] = { ...col, items: toLines(e.target.value) };
                      patchSlide({ columns });
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TextField(props: { label: string; value?: string; onChange: (v: string | undefined) => void }): React.JSX.Element {
  return (
    <div className="field">
      <label>{props.label}</label>
      <input value={props.value ?? ""} onChange={(e) => props.onChange(e.target.value || undefined)} />
    </div>
  );
}
