import type { EngineEvent, StudioApi } from "../../shared/ipc";

/**
 * A sample lesson used only when the app runs in a plain browser (no Electron
 * bridge) — so the editor + live preview + validation can be exercised without
 * the engine/filesystem. In the real app `window.studio` is provided by preload.
 */
export const SAMPLE_SCRIPT = `---
lesson: DEMO-1
title: Build With AI
track: BUILD / ABSORB 1
voice: Ja'dan
---

## 01 · Cold open
phase: SOURCE
duration: 9

SAY:
By the end of this session you'll ship a tiny app — without writing the boring parts yourself.

SLIDE:
\`\`\`yaml
frame: N1-title
eyebrow: HGDW · Build
title: Build With AI
subtitle: Set it up once, automate it forever
\`\`\`

## 02 · The shift
phase: ABSORB
duration: 8

SAY:
The skill isn't typing code. It's describing the outcome precisely enough that the machine can.

SLIDE:
\`\`\`yaml
frame: C2-statement
title: Describe the outcome. Let the machine type.
\`\`\`

## 03 · Three moves
phase: MIRROR
duration: 12

SAY:
Three moves: name the goal, hand it the context, review the diff.

SLIDE:
\`\`\`yaml
frame: C4-steps
title: The loop
body:
  - Name the goal in one sentence
  - Hand it the context it needs
  - Review the diff, then ship
\`\`\`

## 04 · Outro
phase: COMMAND
duration: 6

SAY:
Now go automate the boring parts.

SLIDE:
\`\`\`yaml
frame: O1-outro
title: Your turn
subtitle: Pick one boring task and automate it today
\`\`\`
`;

const isStub = typeof window === "undefined" || !window.studio;

const stub: StudioApi = {
  listLessons: async () => ["DEMO-1"],
  readScript: async () => SAMPLE_SCRIPT,
  writeScript: async () => {},
  status: async () => ({ lessonId: "DEMO-1", title: "Build With AI", totalDuration: null, segments: [] }),
  doctor: async () => ({
    ok: false,
    checks: [
      { name: "Node.js >= 20", ok: true, detail: "v20.x (browser stub)" },
      { name: "Palmier Pro MCP", ok: false, detail: "not running (browser stub)", fix: "open the desktop app on your Mac" },
    ],
  }),
  draft: async () => SAMPLE_SCRIPT,
  produce: async () => ({ ok: false, error: "Produce requires the desktop app (Electron)." }),
  correct: async () => ({ ok: false, error: "Revise requires the desktop app (Electron)." }),
  deliverPreview: async () => ({
    export: { ok: false, error: "Deliver requires the desktop app (Electron)." },
    publish: { ok: false, error: "Deliver requires the desktop app (Electron)." },
    attach: { ok: false, error: "Deliver requires the desktop app (Electron)." },
  }),
  onEvent: (_handler: (e: EngineEvent) => void) => () => {},
  slideUrl: async () => null,
};

/** The Studio API: the real preload bridge in Electron, a stub in the browser. */
export const studio: StudioApi = isStub ? stub : window.studio!;
export const RUNNING_IN_BROWSER = isStub;
