import React, { useCallback, useEffect, useMemo, useState } from "react";
import { studio, RUNNING_IN_BROWSER } from "./lib/bridge";
import { buildPreviewDeck, type PreviewDeck } from "./lib/preview";
import { validateScript } from "./lib/validate";
import { serializeScript } from "./lib/serialize";
import { Editor } from "./components/Editor";
import { Preview } from "./components/Preview";
import { Outline } from "./components/Outline";
import { SegmentForm } from "./components/SegmentForm";
import { Doctor } from "./components/Doctor";
import { ReviseDialog } from "./components/ReviseDialog";
import { DraftWithAI } from "./components/DraftWithAI";
import { DeliverDialog } from "./components/DeliverDialog";
import { StatusPanel, initialRunState, type RunState } from "./components/StatusPanel";
import type { Segment } from "vibedevview/types";
import type { BackendName, EngineEvent } from "../shared/ipc";

type EditorMode = "structured" | "source";

export function App(): React.JSX.Element {
  const [lessons, setLessons] = useState<string[]>([]);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [script, setScript] = useState<string>("");
  const [activeSeg, setActiveSeg] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorMode>("structured");
  const [backend, setBackend] = useState<BackendName>("ffmpeg");
  const [run, setRun] = useState<RunState>(initialRunState);
  const [modal, setModal] = useState<"doctor" | "revise" | "draft" | "deliver" | null>(null);

  // Load lesson list + first lesson on mount.
  useEffect(() => {
    studio.listLessons().then(async (ids) => {
      setLessons(ids);
      if (ids[0]) await openLesson(ids[0]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to engine progress events.
  useEffect(() => {
    return studio.onEvent((e: EngineEvent) => {
      setRun((prev) => reduceEvent(prev, e));
    });
  }, []);

  const openLesson = useCallback(async (id: string) => {
    const text = await studio.readScript(id);
    setLessonId(id);
    setScript(text ?? "");
    const v = validateScript(text ?? "");
    setActiveSeg(v.manifest?.segments[0]?.id ?? null);
  }, []);

  const newLesson = useCallback(async () => {
    const id = window.prompt("New lesson id (e.g. B-DEMO1):")?.trim();
    if (!id) return;
    try {
      await studio.newLesson(id);
      const ids = await studio.listLessons();
      setLessons(ids);
      await openLesson(id);
    } catch (e) {
      window.alert(`Could not create lesson: ${(e as Error).message}`);
    }
  }, [openLesson]);

  const { manifest, error } = useMemo(() => validateScript(script), [script]);
  const deck: PreviewDeck | null = useMemo(() => {
    try {
      return buildPreviewDeck(script);
    } catch {
      return null;
    }
  }, [script]);

  const activeSegment: Segment | null = manifest?.segments.find((s) => s.id === activeSeg) ?? null;
  const focusIndex = deck && activeSeg != null && activeSeg in deck.indexBySeg ? deck.indexBySeg[activeSeg]! : null;

  // Structured-form edit → update one segment → re-serialize the script.
  const onSegmentChange = useCallback(
    (next: Segment) => {
      if (!manifest) return;
      const updated = { ...manifest, segments: manifest.segments.map((s) => (s.id === next.id ? next : s)) };
      setScript(serializeScript(updated));
    },
    [manifest],
  );

  async function save() {
    if (lessonId) await studio.writeScript(lessonId, script);
  }

  async function produce() {
    if (!lessonId) return;
    await save();
    setRun({ ...initialRunState, running: true, lastMessage: "Producing…" });
    const res = await studio.produce({ lessonId, backend, review: false });
    setRun((prev) => ({
      ...prev,
      running: false,
      ok: res.ok,
      lastMessage: res.ok ? res.result?.message ?? "Done" : res.error ?? "Failed",
    }));
  }

  return (
    <div className="app">
      <div className="topbar">
        <span className="brand">
          vibedev<span className="dot">view</span> Studio
        </span>
        <select className="lesson-select" value={lessonId ?? ""} onChange={(e) => openLesson(e.target.value)}>
          {lessons.length === 0 && <option value="">no lessons</option>}
          {lessons.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <button onClick={newLesson} title="Create a new lesson folder seeded with the example script">
          + New lesson
        </button>
        <select className="lesson-select" value={backend} onChange={(e) => setBackend(e.target.value as BackendName)}>
          <option value="ffmpeg">ffmpeg (preview)</option>
          <option value="palmier">palmier (Mac)</option>
        </select>
        <div className="spacer" />
        {RUNNING_IN_BROWSER && <span className="note">browser preview — engine actions disabled</span>}
        <button onClick={() => setModal("draft")} disabled={!lessonId}>
          Draft with AI
        </button>
        <button onClick={() => setModal("revise")} disabled={!lessonId || !activeSeg}>
          Revise segment
        </button>
        <button onClick={() => setModal("doctor")}>Doctor</button>
        <button onClick={() => setModal("deliver")} disabled={!lessonId}>
          Deliver
        </button>
        <button onClick={save} disabled={!lessonId}>
          Save
        </button>
        <button className="primary" onClick={produce} disabled={!lessonId || !!error || run.running}>
          {run.running ? "Producing…" : "Produce"}
        </button>
      </div>

      <div className="workbench">
        <div className="pane">
          <div className="pane-head">
            <h2>Outline</h2>
          </div>
          <Outline manifest={manifest ?? null} activeId={activeSeg} onSelect={setActiveSeg} />
        </div>

        <div className="pane">
          <div className="pane-head">
            <h2>{mode === "structured" ? "Segment" : "Source"}</h2>
            <div className="editor-toggle">
              <button className={mode === "structured" ? "on" : ""} onClick={() => setMode("structured")}>
                Fields
              </button>
              <button className={mode === "source" ? "on" : ""} onClick={() => setMode("source")}>
                {"</> Source"}
              </button>
            </div>
          </div>
          {mode === "structured" ? (
            <SegmentForm segment={activeSegment} onChange={onSegmentChange} />
          ) : (
            <>
              <Editor value={script} onChange={setScript} />
            </>
          )}
          <div className={`validation ${error ? "bad" : "ok"}`}>
            {error ? error : `Valid · ${manifest?.segments.length ?? 0} segments`}
          </div>
        </div>

        <div className="pane">
          <div className="pane-head">
            <h2>Live preview</h2>
          </div>
          <Preview deck={deck} focusIndex={focusIndex} />
        </div>
      </div>

      <StatusPanel state={run} />

      {modal === "doctor" && <Doctor onClose={() => setModal(null)} />}
      {modal === "deliver" && lessonId && <DeliverDialog lessonId={lessonId} onClose={() => setModal(null)} />}
      {modal === "revise" && lessonId && activeSeg && (
        <ReviseDialog
          lessonId={lessonId}
          segId={activeSeg}
          editedScript={script}
          onClose={() => setModal(null)}
          onApplied={() => lessonId && openLesson(lessonId)}
        />
      )}
      {modal === "draft" && lessonId && (
        <DraftWithAI
          lessonId={lessonId}
          currentScript={script}
          onClose={() => setModal(null)}
          onApply={async (s) => {
            // Persist immediately so Produce can't run against a stale on-disk
            // script (the "applied but never saved" footgun). Re-open from disk
            // so the editor + outline reflect exactly what was written.
            await studio.writeScript(lessonId, s);
            await openLesson(lessonId);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

/** Fold an engine event into the run-state shown in the status bar. */
function reduceEvent(prev: RunState, e: EngineEvent): RunState {
  switch (e.type) {
    case "phase":
      return { ...prev, running: true, phase: `${e.name} ${e.status}`, lastMessage: `${e.name} ${e.status}` };
    case "slide.rendered":
      return { ...prev, slides: prev.slides + 1, lastMessage: `slide ${e.frameId}${e.verified ? "" : " (check)"}` };
    case "voice.done":
      return { ...prev, voices: prev.voices + 1, lastMessage: `voice ${e.segId} · ${e.duration.toFixed(1)}s` };
    case "assemble.placed":
      return { ...prev, lastMessage: `assembled ${e.clipCount} clips` };
    case "error":
      return { ...prev, ok: false, lastMessage: `error: ${e.message}` };
    case "result":
      return { ...prev, running: false, ok: true, lastMessage: e.result.message };
    default:
      return prev;
  }
}
