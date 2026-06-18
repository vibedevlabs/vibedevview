import React, { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import { autocompletion, type CompletionContext } from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";
import { FRAME_TYPES } from "vibedevview/types";
import { validateScript } from "../lib/validate";

/** Squiggle the whole doc with the parse error message when the script is invalid. */
const scriptLinter = linter((view): Diagnostic[] => {
  const text = view.state.doc.toString();
  const { error } = validateScript(text);
  if (!error) return [];
  return [{ from: 0, to: Math.max(1, view.state.doc.length), severity: "error", message: error }];
});

/** Offer the 16 frame types after `frame:` so non-experts don't memorize codes. */
function frameCompletions(ctx: CompletionContext) {
  const line = ctx.state.doc.lineAt(ctx.pos);
  const before = line.text.slice(0, ctx.pos - line.from);
  if (!/frame:\s*\S*$/.test(before)) return null;
  const word = ctx.matchBefore(/[\w-]*$/);
  if (!word) return null;
  return {
    from: word.from,
    options: FRAME_TYPES.map((f) => ({ label: f, type: "enum" })),
  };
}

export function Editor(props: { value: string; onChange: (text: string) => void }): React.JSX.Element {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChange = useRef(props.onChange);
  onChange.current = props.onChange;

  useEffect(() => {
    if (!host.current) return;
    const state = EditorState.create({
      doc: props.value,
      extensions: [
        basicSetup,
        markdown(),
        oneDark,
        lintGutter(),
        scriptLinter,
        autocompletion({ override: [frameCompletions] }),
        keymap.of([indentWithTab, ...defaultKeymap]),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChange.current(u.state.doc.toString());
        }),
        EditorView.theme({ "&": { height: "100%" }, ".cm-scroller": { overflow: "auto" } }),
      ],
    });
    const v = new EditorView({ state, parent: host.current });
    view.current = v;
    return () => v.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconcile external value changes (e.g. structured-form edits, lesson load).
  useEffect(() => {
    const v = view.current;
    if (!v) return;
    const current = v.state.doc.toString();
    if (current !== props.value) {
      v.dispatch({ changes: { from: 0, to: current.length, insert: props.value } });
    }
  }, [props.value]);

  return <div className="cm-host" ref={host} />;
}
