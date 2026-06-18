# Electron App — Design & Build Spec (vibedevview Studio)

**Status: design / proposal only. No app code is built yet — this is the plan a team builds from.**
This document specifies a macOS desktop app that wraps the existing vibedevview engine in a
friendly UI — a markdown **script editor** with **live slide preview** and one-click
**Produce / Load / Revise** buttons — so a team member who has never opened a terminal can author
a lesson, produce it, and drop it on the Palmier Pro timeline.

The guiding rule for the whole document: **the app never re-implements the pipeline.** It is a
*client* of the same engine and CLI that already ship in this repo. Everything the app does, the
CLI can still do headless (for CI, Devin, and power users). If the app and the engine ever
disagree, the engine wins.

> Legend (matches [`ROADMAP.md`](ROADMAP.md)): **[SEQ]** = big sequential feature that blocks
> others · **[PAR]** = can be built in parallel. Status: ✅done · 🟡in progress · ⬜planned.

**Contents**
1. [Goals & product principles](#1-goals--product-principles)
2. [Who it's for & primary journeys](#2-who-its-for--primary-journeys)
3. [Why an app (and why it's mostly UI)](#3-why-an-app-and-why-its-mostly-ui)
4. [Screens & wireframes](#4-screens--wireframes)
5. [Architecture](#5-architecture)
6. [Engine integration contract](#6-engine-integration-contract)
7. [App state model](#7-app-state-model)
8. [The Palmier "Claude" / AI integration](#8-the-palmier-claude--ai-integration)
9. [The "Revise" button → the revision subagent contract](#9-the-revise-button--the-revision-subagent-contract)
10. [Secrets & security](#10-secrets--security)
11. [Packaging & distribution](#11-packaging--distribution)
12. [Build plan, by team](#12-build-plan-by-team)
13. [Milestones & definition of done](#13-milestones--definition-of-done)
14. [Risks & mitigations](#14-risks--mitigations)
15. [Open questions](#15-open-questions-resolve-before-e0)
16. [Non-goals](#16-non-goals)

---

## 1. Goals & product principles

**Primary goal:** let a non-technical teammate produce a branded HGDW lesson and load it onto the
Palmier timeline **without a terminal, without editing config, and without guessing what a slide
will look like.**

**Principles (in priority order):**

1. **Engine is the single source of truth.** The app shells out to the same code path the CLI
   uses. No forked logic in the renderer. This is what keeps the GUI and the headless/Devin paths
   from ever diverging.
2. **Local-first, like the CLI.** Palmier's MCP is `127.0.0.1:19789` — localhost-only. The app
   runs on the same Mac as Palmier. No tunnels, no remote drive (that stays an advanced CLI/SSH
   path, see [`OPERATOR-GUIDE.md`](OPERATOR-GUIDE.md#appendix--driving-a-remote-mac-over-ssh)).
3. **Show, don't guess.** Every segment renders a live preview thumbnail so the author sees the
   slide as they type — the single biggest improvement over the terminal loop.
4. **Surgical by construction.** The Revise path can only ever touch one clip (it maps to
   `palmier correct`); it can never silently re-produce or wipe the bin. Guardrails are enforced
   in the UI, not just documented.
5. **Human approves text changes.** Any edit to `SAY:`/`SLIDE:` content is shown as a diff and
   requires explicit confirmation before it touches the timeline (Hard Rule #5).
6. **Expectations up front.** Time estimates, "what you should see" states, and a preflight
   (doctor) gate — the same beginner-first stance as the README.

---

## 2. Who it's for & primary journeys

**Personas**
- **Author (primary):** writes/edits lesson scripts, produces, loads. Comfortable with markdown,
  not with terminals. The whole app is built for this person.
- **Reviewer:** opens a produced lesson, watches the preview, requests surgical revisions.
- **Power user / Devin operator:** still uses the CLI or Devin; the app is an *alternative* front
  door, not a replacement.

**Journey A — first run (one-time per machine)**

```
   launch app ─▶ Setup Wizard ─▶ install/locate Node·ffmpeg·Chromium·Palmier
        │            │           ─▶ enter ElevenLabs key (→ keychain)
        │            │           ─▶ optional LLM key for "Draft with AI"
        │            ▼
        │        all green ✓ (mirrors `palmier doctor`)
        ▼
   land in the editor on an example lesson (seeded from examples/B-AB1)
```

**Journey B — produce & load a lesson (the everyday loop)**

```
   open/create lesson ─▶ edit markdown (live preview updates per segment)
        │
        ▼
   [Produce] ─▶ status panel streams: slides 12/12 · voice 12/12 · verify ✓
        │
        ▼
   [Load to Palmier] (Palmier Pro open) ─▶ timeline fills · readback confirms 24 clips / 2 tracks
        │
        ▼
   watch preview / film ─▶ done, or revise
```

**Journey C — revise one thing (surgical)**

```
   click a segment chip ─▶ [Revise] ─▶ pick kind (narration/slide/recording/retime)
        │
        ▼
   (if it edits script text) diff shown ─▶ [Apply] required
        │
        ▼
   app runs `palmier correct <id> --kind <k> --seg <segId>` ─▶ one clip swapped ─▶ confirmed
```

---

## 3. Why an app (and why it's mostly UI)

Today the workflow is: write `script.md` → `palmier produce` → `palmier assemble`. That already
works and is fully local. The app does **not** reinvent any of that — it **drives the same engine
and the same CLI**. Its entire job is to remove the terminal and the round-trips:

```
   BEFORE (today)                                AFTER (this app)
   ─────────────                                 ────────────────
   Terminal: edit script.md in a text editor     ┌───────────────────────────────────────────┐
        │   (no preview — guess the slide)        │  vibedevview Studio (one window)            │
        ▼                                          │                                             │
   $ palmier produce DEMO-1   (watch logs)         │  ┌─ markdown editor ─┐  ┌─ live preview ─┐ │
        │                                          │  │ ## 01 · Cold open │  │  [rendered N1 ] │ │
        ▼                                          │  │ SAY: …            │  │  title card     │ │
   $ open …/DEMO-1-preview.mp4  (check)            │  │ SLIDE: frame:N1   │  │                 │ │
        │                                          │  └───────────────────┘  └─────────────────┘ │
        ▼                                          │  [ Produce ] [ Load to Palmier ] [ Revise ] │
   $ palmier assemble DEMO-1  (load)               │  status: ● slides 12/12 · voice 12/12       │
        │                                          └───────────────────────────────────────────┘
        ▼                                                        │ drives the SAME engine/CLI
   tweak → repeat the whole loop                                 ▼
                                                   Palmier Pro timeline (unchanged)
```

**Design principle:** the engine stays the single source of truth. The app is a *client* of the
CLI/engine, not a fork of it. Anything the app can do, the CLI can still do headless (for CI,
Devin, and power users).

---

## 4. Screens & wireframes

ASCII wireframes below are intentionally low-fidelity — they fix *information architecture and
behavior*, not visual design. Brand styling comes from [`HGDW-DESIGN.md`](../HGDW-DESIGN.md).

### 4.1 Main window (3-pane: Outline · Editor · Preview)

```
┌─ vibedevview Studio ─ Lesson: C1-CLAUDE ────────────────────────────── ● Palmier: connected ─┐
│ File  Edit  Lesson  Help                                       [ Doctor ✓ ]  [ Draft with AI ]│
├──────────────┬───────────────────────────────────┬──────────────────────────────────────────┤
│ OUTLINE      │ EDITOR (CodeMirror, script.md)     │ LIVE PREVIEW (focused segment)           │
│ ──────────   │ ──────────────────────────────────  │ ──────────────────────────────────────── │
│ ▸ 01 Cold ●  │ ## 02 · What is Claude             │  ┌────────────────────────────────────┐  │
│ ▸ 02 What ◀  │ phase: ABSORB                      │  │  HOT GIRLS DONT WORK                 │  │
│ ▸ 03 Cowork  │ duration: 14                       │  │                                      │  │
│ ▸ 04 …       │                                    │  │  What is Claude                      │  │
│ ▸ 05 …       │ SAY: |                             │  │  ─ your new coworker, not a tool ─    │  │
│   …          │   Claude is your coworker, not …   │  │                              [frame:N2]│ │
│ ▸ 12 Outro   │                                    │  └────────────────────────────────────┘  │
│              │ SLIDE: |                           │  Frame: N2-section   bg: gradient        │
│ + add segment│   ```yaml                          │  ⚠ 0 validation errors                   │
│              │   frame: N2                        │  Est. narration: ~13.8s (TTS, last run)  │
│              │   eyebrow: HOT GIRLS DONT WORK     │                                          │
│              │   title: What is Claude            │  [ ◀ prev seg ]      [ next seg ▶ ]       │
├──────────────┴───────────────────────────────────┴──────────────────────────────────────────┤
│ TRANSPORT   [ ● Produce ]  [ ⬆ Load to Palmier ]  [ ✎ Revise ]      backend: ◉ palmier ○ ffmpeg│
│ status: idle · last produced 14:02 · timeline: 24 clips / 2 tracks / bin 24                    │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

Behaviors:
- **Outline** lists segments (`## NN · title`) with a status dot (○ not produced · ● produced ·
  ⚠ error). Click to focus; drag to reorder (rewrites `## NN` numbering on save).
- **Editor** is CodeMirror with markdown + the `script.md` schema: frontmatter keys, `phase`,
  `duration`, `silent`, `SAY/SLIDE/DO`, and a `frame:` autocomplete listing all 16 frame types
  with their exact field names.
- **Preview** renders the focused segment's frame to a thumbnail via the Slides agent (debounced
  on edit). Shows frame type, bg, validation count, and the last-known TTS duration.
- **Transport** = the three verbs + the backend toggle (`palmier` for the real timeline, `ffmpeg`
  for a local preview MP4). Buttons disable until Doctor is green.

### 4.2 First-run Setup Wizard (mirrors README Part 1 + `palmier doctor`)

```
┌─ Welcome to vibedevview Studio ─ Setup (1 of 3) ──────────────────────┐
│  We'll get your Mac ready. This is one-time. ~5–10 min.               │
│                                                                       │
│  Tooling                                                              │
│   ✓ Node 20+            v26.3.0                                        │
│   ✓ ffmpeg / ffprobe    found (Homebrew)                              │
│   ⟳ Chromium (slides)   installing… (npx playwright install)          │
│   ⚠ Palmier Pro         not detected — [ Download Palmier ]           │
│                                        (needs macOS 26 Tahoe+)        │
│                                                                       │
│                                            [ Re-check ]   [ Next ▶ ]  │
├───────────────────────────────────────────────────────────────────────┤
│  Setup (2 of 3) — Keys                                                │
│   ElevenLabs API key  [ ••••••••••••••••  ]  → stored in macOS Keychain│
│     ▸ used for Ja'dan voiceover. Get one at elevenlabs.io.            │
│   LLM key (optional)  [ ••••••••••••••••  ]  enables "Draft with AI"  │
│     provider: ◉ anthropic ○ openai ○ moonshot ○ deepseek             │
│                                            [ ◀ Back ]   [ Next ▶ ]    │
├───────────────────────────────────────────────────────────────────────┤
│  Setup (3 of 3) — Ready                                               │
│   All green ✓   Open Palmier Pro with a project to enable "Load".     │
│                                            [ Finish → open editor ]   │
└───────────────────────────────────────────────────────────────────────┘
```

The wizard is the GUI form of `palmier doctor`; it calls the same checks and writes keys to the
OS keychain (never to a dotfile). Palmier detection = probing `127.0.0.1:19789/mcp`.

### 4.3 Produce status panel (streams engine events)

```
┌─ Producing C1-CLAUDE ─────────────────────────────────────────────────┐
│  ● Script        parsed 12 segments                          ✓        │
│  ● Slides        ████████████░░░░  9/12   rendering seg 10…   ~6s     │
│  ● Voice         ██████░░░░░░░░░░  5/12   ElevenLabs (Ja'dan)         │
│  ● Verify        waiting…                                             │
│  ● Assemble      waiting…                                             │
│                                                                       │
│  log ▾  slide.rendered seg=09 frame=C1 ok                            │
│         voice.done seg=05 dur=11.2s                                   │
│                                                       [ Cancel ]      │
└───────────────────────────────────────────────────────────────────────┘
```

Driven entirely by the engine's `--json` event stream (§6). "Cancel" sends SIGTERM to the child
process; partial assets persist in the lesson folder.

### 4.4 Revise modal (the approval gate)

```
┌─ Revise · segment 05 "Prompting basics" ──────────────────────────────┐
│  Kind:  ◉ narration   ○ slide   ○ recording   ○ retime                │
│                                                                       │
│  ── Edit narration (SAY) ──────────────────────────────────────────  │
│  - Prompting is how you talk to the model.                            │
│  + Prompting is how you *brief* the model — like a teammate.          │
│                                                                       │
│  ⚠ This changes script text. It will re-voice this one segment and    │
│    swap that single clip on the timeline. The rest is untouched.      │
│                                                                       │
│                                   [ Cancel ]   [ Apply this change ]  │
└───────────────────────────────────────────────────────────────────────┘
```

`Apply` runs `palmier correct C1-CLAUDE --kind narration --seg 05`, then reads the timeline back
and confirms exactly one clip changed. If the user picks ≥ ~3 segments to change, the app nudges
toward a full re-produce instead (matches the revision subagent's escalation rule).

### 4.5 Draft-with-AI modal (engine script drafter)

```
┌─ Draft with AI ───────────────────────────────────────────────────────┐
│  Lesson ID   [ C4-AGENTS                  ]                           │
│  Topic / brief                                                        │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ Explain what an AI agent is vs a chatbot, for HGDW beginners,  │   │
│  │ ~2.5 min, end with a confidence-building outro.                │   │
│  └───────────────────────────────────────────────────────────────┘   │
│  Provider: anthropic · model: claude-3-7-sonnet-latest  (from config) │
│                                                                       │
│  Drafts a full script.md you then refine in the editor. It does NOT   │
│  auto-produce.                                  [ Cancel ]  [ Draft ]  │
└───────────────────────────────────────────────────────────────────────┘
```

Calls the engine's existing `palmier script <id>` drafter (surface 1, §8). On success the new
`script.md` opens in the editor for human refinement — never produced unattended.

---

## 5. Architecture

```
   ┌─────────────────────────── Electron app ───────────────────────────┐
   │                                                                     │
   │   RENDERER (UI, web tech)            MAIN (Node, privileged)        │
   │   ────────────────────────           ───────────────────────       │
   │   • Markdown editor (CodeMirror)     • Spawns/links the engine      │
   │   • Live slide preview               • Streams agent progress       │
   │   • Produce / Load / Revise buttons  • Reads back the timeline      │
   │   • Segment list + status            • Manages secrets (keychain)   │
   │            │      ▲                            │      ▲             │
   │            │ IPC  │ events                      │      │            │
   │            ▼      │                             ▼      │            │
   │        ┌──────────────────────────────────────────────────┐        │
   │        │  Engine adapter (in-process import OR child CLI)   │        │
   │        └──────────────────────────────────────────────────┘        │
   └──────────────────────────────┬──────────────────────────────────────┘
                                   │ same calls the CLI makes today
              ┌────────────────────┼─────────────────────┐
              ▼                    ▼                     ▼
        Slides (Chromium)   Voice (ElevenLabs)    Palmier MCP (127.0.0.1:19789)
```

**Process model.** Electron's renderer holds the UI only — `nodeIntegration: false`,
`contextIsolation: true`. All privileged work (spawning the engine, keychain, filesystem, Palmier
MCP) happens in the **main** process and is exposed to the renderer through a narrow, typed
`preload` bridge (no raw `ipcRenderer` in the renderer).

**Two viable ways for the app to call the engine** — pick during the E0 spike:

- **(a) In-process import** of the engine's exported functions (`produce`, `assemble`,
  `buildPlan`, `renderSlides`, …). Fastest UX, tightest coupling; the app must bundle the same
  Node deps (Playwright Chromium, ffmpeg) and any engine crash can take down `main`.
- **(b) Child-process CLI** (`node dist/cli.js … --json`) with a structured event stream. Looser
  coupling, reuses the exact tested path, isolates crashes, easier to keep in lockstep with the
  CLI. **Recommended default** — it guarantees the app and CLI never diverge, and it's the only
  option that lets a future "hand off to Devin" reuse the identical invocation.

> **Engine prerequisite [SEQ]:** expose a stable, machine-readable progress stream (§6) so the UI
> can show live status. This is the one engine change the app hard-depends on; everything in E1+
> assumes it exists.

---

## 6. Engine integration contract

This is the **boundary** between the app and the engine. It is the most important thing to nail
in E0 because every other phase depends on it. None of it exists yet — it's the proposed contract
the Core Engine Team implements first.

### 6.1 Child-CLI invocation

The app spawns the same binary the README documents, adding a `--json` flag that switches stdout
to newline-delimited JSON (NDJSON) events instead of human logs:

```
node dist/cli.js produce  C1-CLAUDE --json --backend palmier
node dist/cli.js assemble C1-CLAUDE --json --backend palmier
node dist/cli.js correct  C1-CLAUDE --json --kind narration --seg 05
node dist/cli.js status   C1-CLAUDE --json
node dist/cli.js doctor              --json
```

Env (`ELEVENLABS_API_KEY`, `PALMIER_LLM_*`, `PALMIER_VOICE`, `PALMIER_TIMELINE`) is injected by
`main` from the keychain — never passed on the command line (so it can't leak into process lists).

### 6.2 `--json` event stream (proposed schema)

Every event is one JSON object per line. All carry `{ "v": 1, "ts": <iso>, "type": <string> }`.
Payloads by type:

```jsonc
{ "type": "run.start",     "cmd": "produce", "lesson": "C1-CLAUDE", "segments": 12 }
{ "type": "script.parsed", "segments": 12, "track": "context/absorb" }
{ "type": "slide.rendered","seg": "09", "frame": "C1", "path": ".../slides/09.png", "i": 9, "n": 12 }
{ "type": "voice.done",    "seg": "05", "durSec": 11.2, "path": ".../audio/individual/seg-05.mp3" }
{ "type": "verify.ok",     "seg": "09" }
{ "type": "verify.fail",   "seg": "07", "reason": "blank region > threshold" }
{ "type": "assemble.cleared", "removedClips": 24, "deletedMedia": 100 }
{ "type": "assemble.placed",  "track": "Slides", "clips": 12 }
{ "type": "timeline.state",   "fps": 30, "totalFrames": 4425, "tracks": 2, "clips": 24, "bin": 24 }
{ "type": "correct.swapped",  "seg": "05", "kind": "narration", "old": "0–11.0s", "new": "0–11.2s" }
{ "type": "warn",  "code": "voice.fallback", "message": "voice X not found; used Ja'dan" }
{ "type": "error", "code": "palmier.unreachable", "message": "no MCP at 127.0.0.1:19789", "fatal": true }
{ "type": "run.end", "cmd": "produce", "ok": true, "ms": 41200 }
```

Rules: a run always ends with exactly one `run.end`; `error` with `fatal:true` precedes a
non-zero exit; the stream is append-only and safe to render incrementally. The status panel
(§4.3) and the timeline readback chip (§4.1) are pure functions of this stream.

### 6.3 Renderer ↔ main IPC channels

Narrow, typed, request/response + event channels over the preload bridge:

| Channel | Direction | Payload → Result |
| --- | --- | --- |
| `doctor:run` | R→M→R | `{}` → `DoctorReport` (per-check ok/fail) |
| `lesson:list` / `lesson:open` / `lesson:save` | R→M→R | id / `{id}` / `{id, markdown}` → script + meta |
| `preview:render` | R→M→R | `{ segment }` → `{ pngPath }` (single-frame Slides render) |
| `produce:start` / `assemble:start` / `correct:start` | R→M | command + opts (spawns child) |
| `run:event` | M→R (stream) | one parsed `--json` event (§6.2) |
| `run:cancel` | R→M | `{ runId }` → SIGTERM the child |
| `secret:set` / `secret:status` | R→M | `{ name, value }` / `{ name }` → keychain write / presence (never returns the value) |

The renderer holds **no** secrets and spawns **no** processes; it only sends intents and renders
events.

---

## 7. App state model

The app is essentially a thin, observable wrapper over on-disk lesson folders
(`~/hgdw-productions/<LESSON_ID>/`, the same layout the CLI uses). It owns very little durable
state of its own:

```
AppState
├─ machine        { doctor: DoctorReport, palmierConnected: bool, backend: "palmier"|"ffmpeg" }
├─ lessons[]      { id, title, path, lastProducedAt, segmentCount }
└─ active
   ├─ lesson      { id, markdown (editor buffer, may be dirty), parsed: Segment[] | ParseError }
   ├─ perSegment  { id → { frame, validation, lastTtsDurSec, slideStatus } }
   ├─ run         null | { runId, cmd, events[], phase, progress }   ← derived from §6.2 stream
   └─ timeline    null | { fps, clips, tracks, bin }                  ← from `status --json` / readback
```

- The **editor buffer** is the only thing that can be "unsaved"; saving writes `script.md`
  verbatim (the human file is the source of truth, exactly as the script agent treats it).
- `parsed`, `perSegment`, `run`, and `timeline` are all **derived** — recomputed from the engine,
  never authored in the app. This keeps the app honest: it shows what the engine reports, nothing
  it made up.
- No database. Lesson discovery is a directory scan of `PALMIER_PRODUCTIONS_DIR`.

---

## 8. The Palmier "Claude" / AI integration

Palmier Pro exposes AI tools over its MCP — notably `list_models` and a family of `generate_*`
tools. There are **two distinct AI surfaces** we can offer, and they're independent:

| Surface | What it is | Where it runs | Status of engine support |
| --- | --- | --- | --- |
| **Engine script drafting** | The engine's built-in LLM drafter (`palmier script`, Anthropic Claude by default via `PALMIER_LLM_*`). Turns a topic brief → full `script.md`. | LLM API (Anthropic/OpenAI/…) | ✅ already in the engine (`src/llm.ts`, `src/agents/script-agent.ts`) |
| **Palmier in-app generation** | Palmier's own `generate_*` tools (`list_models` to enumerate, `generate_*` to create media inside Palmier). | Palmier app / its providers | ⬜ not yet wired into the engine |

**App plan:**
- A **"Draft with AI"** button (§4.5) calls the engine's script drafter (surface 1) to fill a new
  script from a one-line topic — then drops the human into the editor to refine. Reuses
  `PALMIER_LLM_*` config; no new engine code beyond surfacing it.
- A future **"Generate in Palmier"** affordance (surface 2) would call `list_models` to populate a
  model picker and `generate_*` for in-Palmier assets. **Scope it after** a spike that confirms
  the exact tool schemas against a live Palmier build (we've only reverse-engineered the core 27
  tools so far; the `generate_*` schemas need verification). [PAR], post-MVP.

> Keep the two surfaces clearly separated in the UI so operators know whether an asset came from
> *our* pipeline (branded, deterministic slides) or from *Palmier's* generator.

---

## 9. The "Revise" button → the revision subagent contract

The app's **Revise** action maps **directly** onto the revision contract already shipped as the
[`hgdw-revision`](../.devin/skills/hgdw-revision/SKILL.md) skill and the `palmier correct`
command. The UI must honor the same guardrails (this is the GUI twin of the Devin revision
subagent — same narrow contract, same human-approval gate):

```
   user clicks a segment in the timeline strip  ─▶  "Revise"
        │
        ▼
   pick a kind:  ○ narration   ○ slide   ○ recording   ○ retime
        │
        ▼
   if the change edits SAY/SLIDE text  ─▶  show a diff  ─▶  REQUIRE explicit "Apply"   (Hard Rule #5)
        │
        ▼
   app runs:  palmier correct <id> --kind <k> --seg <segId>     (surgical: 1 clip, no bin wipe)
        │
        ▼
   read timeline back  ─▶  confirm exactly one clip changed  ─▶  update status
```

This means the app's Revise path is **surgical by construction** — it can never trigger a full
`produce` or wipe the bin, mirroring the subagent's narrow scope. Bulk changes (≥ ~3 segments)
should nudge the user toward a full re-produce instead.

**Why the same contract on both surfaces:** an operator might revise via Devin (the subagent) one
day and via the app the next. Because both call the identical `palmier correct` path with the
identical guardrails, the result and the safety properties are the same either way.

---

## 10. Secrets & security

- **Keys live in the macOS Keychain**, written by `main` via a keychain binding (e.g. `keytar` or
  Electron `safeStorage`). They are **never** written to `.env`, never logged, and never returned
  to the renderer (the renderer only ever asks "is key X present?").
- Keys are injected into the child engine process via its **environment**, not argv, so they can't
  appear in `ps`/process listings.
- `contextIsolation: true`, `nodeIntegration: false`, a strict CSP, and `sandbox: true` on the
  renderer. The preload bridge exposes only the typed channels in §6.3 — no general `fs`/`exec`.
- The app makes **no outbound network calls of its own** beyond what the engine already does
  (ElevenLabs, the configured LLM, and localhost Palmier). No telemetry by default; crash
  reporting (E4) is opt-in.

---

## 11. Packaging & distribution

- **electron-builder** (or Forge) producing a **notarized, signed** macOS `.dmg` (arm64 first;
  universal if Intel Macs are in scope). macOS 26 Tahoe+ to match Palmier.
- **Heavy runtime deps** (Playwright Chromium, ffmpeg) are the packaging risk. Options, decided in
  E4: (i) bundle pinned binaries in the app resources, or (ii) run `npx playwright install` /
  detect Homebrew ffmpeg on first launch from the Setup Wizard. The wizard already surfaces their
  status, so (ii) degrades gracefully.
- **Auto-update** via electron-updater against GitHub Releases of `vibedevlabs/vibedevview`.
- The engine is **vendored from this same repo** at a pinned version so the bundled CLI and the
  app ship together and can't drift.

---

## 12. Build plan, by team

> Mirrors [`ROADMAP.md`](ROADMAP.md) conventions: explicit ownership, **[SEQ]** vs **[PAR]**.
> Each phase lists its **acceptance criteria** (definition of done for that phase).

### Phase E0 — Foundations (⬜planned)

| Deliverable | Owner | Stream |
| --- | --- | --- |
| Engine `--json` NDJSON event stream (§6.2) across produce/assemble/correct/status/doctor | Core Engine Team | **[SEQ]** (UI status hard-depends on it) |
| Engine adapter decision: in-process vs child-CLI (spike both, pick (b) unless perf forces (a)) | Backend Architecture Team | **[SEQ]** (defines the app↔engine boundary) |
| Electron shell + typed preload bridge + IPC channels (§6.3) + secrets via OS keychain | Backend Architecture Team | **[SEQ]** (foundation) |

**Acceptance:** a headless harness runs `produce --json` and asserts the event sequence
(`run.start` … `run.end`, monotonic counts, exactly one terminal event); the Electron shell boots,
stores/reads a key from the keychain, and round-trips a `doctor:run` IPC call.

### Phase E1 — Editor + preview (⬜planned)

| Deliverable | Owner | Stream |
| --- | --- | --- |
| Markdown editor (CodeMirror) with `script.md` schema awareness + `frame:` autocomplete (16 types) | Frontend Integration Team | **[PAR]** |
| Live slide preview (render the focused segment's frame to a thumbnail via the Slides agent) | Slides & Brand Team | **[PAR]** |
| Segment outline with phase + duration + status chips, reorder-renumber on save | Frontend Integration Team | **[PAR]** |
| Inline validation (surface `parseScript` errors as editor squiggles) | Script & Parsing Team | **[PAR]** |

**Acceptance:** editing a `SLIDE:` block updates the preview within ~1s (debounced); an invalid
frame field shows an inline error; saving writes byte-identical markdown the CLI then parses.

### Phase E2 — Produce / Load / status (⬜planned)

| Deliverable | Owner | Stream |
| --- | --- | --- |
| Produce button → spawn engine, render the §4.3 status panel from the event stream | Frontend Integration Team | **[SEQ]** (needs E0 event stream) |
| Load-to-Palmier button + live timeline readback chip (reuse default clean behavior) | Timeline Integration Team | **[PAR]** |
| Doctor/preflight panel gating Produce/Load (green-checks) | Core Engine Team | **[PAR]** |

**Acceptance:** producing the example lesson shows live per-agent progress and ends green; Load
fills a real Palmier timeline and the readback chip shows the correct clip/track/bin counts;
buttons stay disabled until Doctor is green.

### Phase E3 — AI + Revise (⬜planned)

| Deliverable | Owner | Stream |
| --- | --- | --- |
| "Draft with AI" → engine script drafter (surface 1, §8) | Script & Parsing Team | **[PAR]** |
| "Revise" → `palmier correct` with the approval-diff gate (§4.4, §9) | Frontend Integration Team | **[SEQ]** (must enforce Hard Rule #5) |
| Spike + scope "Generate in Palmier" (`list_models` / `generate_*`, surface 2) | Timeline Integration Team | **[PAR]** (post-MVP) |
| Revise/AI guardrail tests (no full-produce from Revise; text change requires Apply) | QA / Test Team | **[PAR]** |

**Acceptance:** Revise on one segment swaps exactly one clip (verified by readback); a text edit
cannot be applied without the diff confirmation; Draft produces a parseable `script.md` and opens
it without auto-producing.

### Phase E4 — Packaging (⬜planned)

| Deliverable | Owner | Stream |
| --- | --- | --- |
| Notarized/signed macOS build; bundle/locate Chromium + ffmpeg; first-run Setup Wizard (§4.2) | Backend Architecture Team | **[SEQ]** (release gate) |
| Auto-update (electron-updater) + opt-in crash reporting | Backend Architecture Team | **[PAR]** |
| End-to-end smoke on a clean Mac (fresh install → produce → load) | QA / Test Team | **[SEQ]** (ship gate) |

**Acceptance:** a clean Mac installs the `.dmg`, completes the wizard, and produces + loads the
example lesson with no terminal use.

**Parallelism note:** E0 is the critical path — the `--json` event stream **[SEQ]** and the
adapter boundary **[SEQ]** unblock everything. Once they land, the editor/preview (E1) and
produce/load (E2) tracks run largely **[PAR]** across the Frontend, Slides, and Timeline teams.

---

## 13. Milestones & definition of done

| Milestone | Contents | Done when |
| --- | --- | --- |
| **M0 — Contract frozen** | E0 event stream + IPC + adapter | headless harness asserts the event sequence; shell boots with keychain |
| **M1 — Author experience** | E1 editor + preview + validation | can write a lesson and see every slide live, no terminal |
| **M2 — MVP (internal)** | E2 produce/load/status + doctor gate | a teammate produces & loads the example lesson end-to-end in the GUI |
| **M3 — AI + Revise** | E3 Draft-with-AI + surgical Revise | one-segment fixes and AI drafts work with guardrails enforced |
| **M4 — Shippable** | E4 notarized build + wizard + smoke | clean-Mac install → produce → load with zero terminal steps |

**MVP = M2.** Drafting and Revise (M3) are fast-follows; "Generate in Palmier" is explicitly
post-MVP pending the schema spike.

---

## 14. Risks & mitigations

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| **Packaging Chromium + ffmpeg** bloats/breaks the build | High | Wizard detects/installs on first run (§11 option ii); bundling is a later optimization |
| **Palmier `generate_*` schemas** differ from assumptions | Med | Surface 2 is post-MVP and gated behind a live-build spike; MVP doesn't depend on it |
| **In-process adapter crashes take down `main`** | Med | Default to child-CLI (b); crashes isolate to the child and surface as an `error` event |
| **Palmier not open** when user hits Load | High | Doctor probes `127.0.0.1:19789`; Load disabled with a clear "open a Palmier project" hint |
| **Engine/app drift** | Med | Child-CLI adapter + vendored pinned engine version so they ship and update together |
| **Secret leakage** | Low/High-impact | Keychain-only, env-not-argv injection, renderer never sees values (§10) |
| **Long produce feels frozen** | Med | Live per-agent progress + cancel from the event stream (§4.3) |

---

## 15. Open questions (resolve before E0)

1. **Which "Claude feature" first?** Confirm priority: (1) engine script drafting (already
   supported, ship in E3) vs (2) Palmier's in-app `generate_*` (needs a schema spike, post-MVP).
2. **In-process vs child-CLI adapter** — settle in the E0 spike (recommended: child-CLI (b)).
3. **Where do lesson folders live** relative to the app — keep `~/hgdw-productions`, or an
   app-managed library with import/export? (Default: keep `~/hgdw-productions`.)
4. **Multi-machine** — does the app ever need to drive a *remote* Palmier, or is it strictly local
   (matching the CLI)? Default assumption: strictly local; remote stays a CLI/SSH advanced path.
5. **Distribution channel** — GitHub Releases + auto-update only, or also a signed direct download
   on a team site?

---

## 16. Non-goals

- Re-implementing any agent in the renderer — the engine remains the source of truth.
- A web-hosted version — Palmier's MCP is localhost-only, so this is a desktop app by nature.
- Replacing Devin — Devin remains the recommended way to *drive* the workflow; the app is for
  operators who prefer a GUI. Both call the same engine and honor the same revision contract.
- A general-purpose video editor — Palmier *is* the editor; this app authors + drives, it does not
  edit the timeline by hand.
