# Roadmap

Status legend: ✅ done · 🟡 in progress · ⬜ planned
Work-stream legend: **[SEQ]** big sequential feature (needs coordination / blocks others) ·
**[PAR]** can be worked on in parallel.

Team ownership is explicit per deliverable so there's clear accountability.

---

## Phase 0 — Core engine (✅ complete)

Initiated through Devin / CLI. This is what ships in this repo today.

| Deliverable | Owner | Stream | Status |
| --- | --- | --- | --- |
| TypeScript engine, types, workspace, CLI scaffold | Core Engine Team | **[SEQ]** (foundation) | ✅ |
| Script Agent + markdown script parser | Script & Parsing Team | **[PAR]** | ✅ |
| Slides Agent: deck generator (16 frames) + Chromium render + color verify | Slides & Brand Team | **[PAR]** | ✅ |
| Voice Agent: ElevenLabs TTS + ffprobe durations → timeline.json | Voice & Audio Team | **[PAR]** | ✅ |
| Recording Agent: manifest + labeled placeholders | Recording Team | **[PAR]** | ✅ |
| Orchestrator main loop + correction loop | Core Engine Team | **[SEQ]** (integrates agents) | ✅ |
| Pluggable timeline backend (ffmpeg + Palmier MCP) | Timeline Integration Team | **[SEQ]** (interface blocks both backends) | ✅ |
| `palmier doctor` preflight | Core Engine Team | **[PAR]** | ✅ |
| Unit tests (parse, alignment, plan, voices) + mutation-proofed | QA / Test Team | **[PAR]** | ✅ |
| Docs (README, HGDW-DESIGN, ARCHITECTURE, ROADMAP) + team SKILL | Docs Team | **[PAR]** | ✅ |

**Parallelism note:** once the Core Engine Team landed the types/workspace foundation **[SEQ]**,
the four agent teams worked fully **[PAR]**. The Timeline Integration Team's backend *interface*
was the one **[SEQ]** gate before the ffmpeg and Palmier backends could be built independently.

---

## Phase 1 — Production hardening on real hardware (🟡 next)

Goal: reliable runs on the iMac workstation with live Palmier Pro, plus real screen recordings.

| Deliverable | Owner | Stream | Status |
| --- | --- | --- | --- |
| Validate live Palmier MCP `import_media` / `add_clips` end-to-end on a real Mac | Timeline Integration Team | **[SEQ]** (gates real-timeline output) | ✅ |
| Idempotent load: clean timeline **+** reset media bin by default (`--no-clean`/`--keep-bin` opt-outs); `palmier clear`; surgical `correct`; close MCP client after live ops | Timeline Integration Team | **[SEQ]** | ✅ |
| Recording Agent **Mode B** (operate the Mac to capture real `.mov` screen recordings) | Recording Team | **[PAR]** | ⬜ |
| Confirm the team's ElevenLabs voices (incl. Courtney) + per-voice settings | Voice & Audio Team | **[PAR]** | ⬜ |
| Caption / lower-third (`D2`) auto-generation from `SAY` text | Slides & Brand Team | **[PAR]** | ⬜ |
| CI: typecheck + build + test on push (browser/ffmpeg kept out of CI) | QA / Test Team | **[PAR]** | 🟡 |

---

## Phase 2 — Electron app (vibedevview Studio) (🟡 MVP landed)

Wrap the **existing engine** (no rewrite) in a desktop app the team initiates productions from.
The app lives in-repo under [`app/`](../app). Full scope, architecture diagrams, AI integration,
and the per-team build plan are in **[`docs/ELECTRON-APP.md`](ELECTRON-APP.md)**.

| Deliverable | Owner | Stream | Status |
| --- | --- | --- | --- |
| **E0** Engine `--json` progress event stream (UI status depends on it) | Core Engine Team | **[SEQ]** | ✅ |
| **E2** Engine adapter (child-CLI + NDJSON) + Electron shell | Backend Architecture Team | **[SEQ]** (foundation) | ✅ |
| **E1** Structured segment editor + raw markdown source + frame autocomplete + live slide preview | Frontend Integration Team / Slides & Brand Team | **[PAR]** | ✅ |
| **E2** Produce + live status panel + Doctor (ffmpeg backend verified) | Frontend / Timeline Integration Team | **[SEQ]** (needs event stream) | ✅ |
| **E3** "Draft with AI" (engine script drafter) + "Revise" → `palmier correct` w/ diff approval gate | Script & Parsing / Frontend Integration Team | **[PAR]** | ✅ |
| Live Palmier backend Load/Revise verification (Mac-only) | Timeline Integration Team | **[SEQ]** | ⬜ (Mac follow-up) |
| Scope "Generate in Palmier" (`list_models` / `generate_*`) after schema spike | Timeline Integration Team | **[PAR]** (post-MVP) | ⬜ |
| **E4** Packaging / notarization / auto-update | Backend Architecture Team | **[SEQ]** (release gate) | ⬜ (Mac follow-up) |

**Parallelism note:** the engine event stream + adapter/shell **[SEQ]** landed first; then the
editor/preview and produce/status tracks ran largely **[PAR]**. The MVP (E0–E3) is built and
verified on Linux against the ffmpeg backend; ElevenLabs voices, live Palmier load/correct, and
notarized macOS packaging (E4) are the remaining Mac-only follow-up.

---

## Phase 3 — Scale & polish (⬜ later)

| Deliverable | Owner | Stream |
| --- | --- | --- |
| Multi-lesson batch productions | Core Engine Team | **[PAR]** |
| Asset library / reuse across lessons | Slides & Brand Team | **[PAR]** |
| Brand-kit theming (multiple shows) | Slides & Brand Team | **[PAR]** |
| Extract to standalone published npm package | Core Engine Team | **[SEQ]** |
