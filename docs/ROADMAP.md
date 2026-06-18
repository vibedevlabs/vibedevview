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

## Phase 2 — Electron app with markdown editor (⬜ planned)

Wrap the **existing engine** (no rewrite) in a desktop app the team initiates productions from.
Full scope, architecture diagrams, AI integration, and the per-team build plan are in
**[`docs/ELECTRON-APP.md`](ELECTRON-APP.md)**. Summary of the critical path below.

| Deliverable | Owner | Stream | Status |
| --- | --- | --- | --- |
| Engine `--json` progress event stream (UI status depends on it) | Core Engine Team | **[SEQ]** | ⬜ |
| Engine adapter (in-process vs child-CLI) + Electron shell + keychain secrets | Backend Architecture Team | **[SEQ]** (foundation) | ⬜ |
| Markdown editor (`script.md` schema + frame autocomplete) + live slide preview | Frontend Integration Team / Slides & Brand Team | **[PAR]** | ⬜ |
| Produce / Load-to-Palmier buttons + live status panel | Frontend / Timeline Integration Team | **[SEQ]** (needs event stream) | ⬜ |
| "Draft with AI" (engine script drafter) + "Revise" → `palmier correct` w/ approval gate | Script & Parsing / Frontend Integration Team | **[PAR]** | ⬜ |
| Scope "Generate in Palmier" (`list_models` / `generate_*`) after schema spike | Timeline Integration Team | **[PAR]** (post-MVP) | ⬜ |
| Packaging / notarization / auto-update | Backend Architecture Team | **[SEQ]** (release gate) | ⬜ |

**Parallelism note:** the engine event stream + adapter/shell **[SEQ]** must land first; then the
editor/preview and produce/load tracks run largely **[PAR]**. See the scope doc for the full
phased breakdown (E0–E4).

---

## Phase 3 — Scale & polish (⬜ later)

| Deliverable | Owner | Stream |
| --- | --- | --- |
| Multi-lesson batch productions | Core Engine Team | **[PAR]** |
| Asset library / reuse across lessons | Slides & Brand Team | **[PAR]** |
| Brand-kit theming (multiple shows) | Slides & Brand Team | **[PAR]** |
| Extract to standalone published npm package | Core Engine Team | **[SEQ]** |
