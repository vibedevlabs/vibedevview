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
- **Deliver** — runs the deliver chain (export → publish → attach + moments) as a **dry-run-only**
  preview: the ffprobe export verdict, the Mux publish dry-run, and the LMS moments + SQL it *would*
  write. It uploads nothing and writes no database; a real publish/attach (`--apply`) stays a
  CLI/Devin step, so the GUI can never trip the engine's two-gate write.

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

If `npm run dev` fails with `Error: Electron uninstall` (or `dyld: Library not loaded:
@rpath/Electron Framework.framework`), see **Troubleshooting** below — Electron's binary
didn't install cleanly.

To exercise just the renderer (editor + preview + validation) in a browser, without Electron:

```bash
npm run preview:web  # vite dev server; engine actions are disabled in browser mode
```

## Troubleshooting

### `Error: Electron uninstall` / `dyld: Library not loaded: @rpath/Electron Framework.framework`

electron-vite locates Electron via `node_modules/electron/path.txt`, which points at the
extracted binary. Either symptom means that binary didn't install cleanly:

- **`Error: Electron uninstall`** — `path.txt` is missing. Usual cause: your npm skipped the
  package's install scripts (you'll have seen `npm warn allow-scripts … electron@… (postinstall:
  node install.js)`), so the download never ran.
- **`dyld: … Electron Framework.framework … no such file`** — `path.txt` exists but the
  `Electron.app` bundle is **incomplete** (only `Contents/MacOS/Electron` extracted, no
  `Contents/Frameworks/`). Electron's bundled zip extractor can fail silently and leave a
  half-unpacked bundle.

First try Electron's own installer:

```bash
node node_modules/electron/install.js
npm run dev
```

If that exits 0 but the app still won't launch (no `path.txt`, or the `dyld` error), download the
official build and unpack it with macOS `ditto`, which handles `.app` bundles correctly:

```bash
cd node_modules/electron
VER=$(node -p "require('./package.json').version")
rm -rf dist path.txt
curl -L -o /tmp/electron.zip "https://github.com/electron/electron/releases/download/v${VER}/electron-v${VER}-darwin-arm64.zip"
mkdir -p dist
ditto -x -k /tmp/electron.zip dist
printf 'Electron.app/Contents/MacOS/Electron' > path.txt
./dist/Electron.app/Contents/MacOS/Electron --version   # should print v$VER
cd ../.. && npm run dev
```

Notes: on an Intel Mac use `darwin-x64` instead of `darwin-arm64`. If `--version` is blocked by
Gatekeeper, run `xattr -dr com.apple.quarantine node_modules/electron/dist/Electron.app` once and
retry. If you paste these into zsh and see `no such user or named directory`, your shell isn't
treating `#` as a comment — drop the comments.

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
