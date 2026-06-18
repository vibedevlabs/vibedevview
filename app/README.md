# vibedevview Studio (desktop app)

A desktop UI that wraps the **existing engine** so you can author a lesson — edit the script,
see the slides update live, and produce the video — without touching a terminal. It is a thin
client of the CLI/engine: it spawns `palmier … --json` under the hood and never reimplements
production logic.

Scope and design rationale live in [`../docs/ELECTRON-APP.md`](../docs/ELECTRON-APP.md). The
MVP (phases **E0–E3**) is implemented; macOS packaging (E4), ElevenLabs voice, and live Palmier
load/correct are a Mac-only follow-up.

## What it does

- **Structured segment cards** — edit each segment with a frame-type picker + per-frame fields +
  a narration (SAY) box. A `</> Source` toggle drops to the raw `script.md` (CodeMirror, frame
  autocomplete, inline validation).
- **Live WYSIWYG preview** — the focused segment renders as the engine's own `buildDeck()` slide
  in an iframe: exact pixels of the produced video, updated as you type, with zero Chromium spawn.
- **Produce + live status** — runs the engine and streams phase/slide/voice progress (ffmpeg
  backend verified; Palmier backend is the Mac follow-up).
- **Doctor** — preflight checks before producing.
- **Draft with AI** and **Revise** — generate or surgically correct a script; both show a diff and
  require approval before anything is written (Hard Rule #5).

## Prerequisites

- The engine must be built once so the app can spawn `dist/cli.js`:
  ```bash
  cd ..            # repo root
  npm install
  npm run build
  ```
- Node 20+ and the engine's runtime deps (ffmpeg, Playwright Chromium). See the root
  [`README.md`](../README.md) Part 1.

## Install & run

```bash
cd app
npm install
npm run dev          # launch the Electron app (electron-vite dev)
```

To exercise just the renderer (editor + preview + validation) in a browser, without Electron:

```bash
npm run preview:web  # vite dev server; engine actions are disabled in browser mode
```

## Build & checks

```bash
npm run typecheck    # tsc on the node + web TS projects
npm run build        # electron-vite build → out/
npm test             # vitest — serialize round-trip + spawn-engine NDJSON parsing
```

## Where lessons live

The app reads/writes lessons from the same folder as the CLI: `~/hgdw-productions/<lessonId>/`,
overridable with `PALMIER_PRODUCTIONS_DIR`. Open a lesson by its id (e.g. `B-AB1`).

## Layout

```
app/
  src/main/       Electron main process + engine-adapter (child-CLI, NDJSON parsing)
  src/preload/    contextBridge exposing the StudioApi to the renderer
  src/renderer/   React UI (Editor, Preview, Outline, SegmentForm, StatusPanel, dialogs)
  src/shared/     IPC contract types shared by main + renderer
  test/           vitest specs (serialize round-trip, spawn-engine parsing)
```
