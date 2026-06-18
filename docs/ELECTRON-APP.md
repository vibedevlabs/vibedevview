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
10. [The "Deliver" chain → export · publish · attach + moments](#10-the-deliver-chain--export--publish--attach--moments)
11. ["Hand off to Devin" → the Producer + Revision topology](#11-hand-off-to-devin--the-producer--revision-topology)
12. [Secrets & security](#12-secrets--security)
13. [Packaging & distribution](#13-packaging--distribution)
14. [Build plan, by team](#14-build-plan-by-team)
15. [Milestones & definition of done](#15-milestones--definition-of-done)
16. [Risks & mitigations](#16-risks--mitigations)
17. [Open questions](#17-open-questions-resolve-before-e0)
18. [Non-goals](#18-non-goals)

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

**Journey D — deliver a finished lesson (export → publish → attach + moments)**

```
   produced + loaded lesson ─▶ [Deliver]
        │
        ▼
   export  ─▶  one finished MP4 (ffprobe-verified)
        │
        ▼
   publish ─▶  upload to Mux ─▶ mux:<playbackId>            (dry-run unless target=mux)
        │
        ▼
   attach + moments ─▶ preview the LMS rows (sql/api/supabase)
        │
        ▼
   review the diff ─▶ REQUIRE explicit "Apply"  ─▶  rows written (gated)  ─▶  confirmed
```

> Deliver is **safe by default**: export + publish dry-run + a moments/attach *preview* run with
> zero credentials and zero writes. A real publish or a real attach each take an explicit,
> separate opt-in (see §10). The everyday loop (A–C) never has to touch it.

**Journey E — hand off to Devin (when the app isn't enough)**

```
   stuck / want multi-step reasoning ─▶ [Ask Devin]
        │
        ├─ local  ─▶ spawn the Devin CLI on this Mac (reaches Palmier + the local engine)
        └─ cloud  ─▶ /handoff to a Devin session (for fan-out across lessons)
        │
        ▼
   Devin drives the SAME `palmier … --json` commands the app does
        │
        ▼
   produce-from-brief · cross-segment fixes · deliver — under the Producer + Revision topology (§11)
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
        ▼                                          │  [ Produce ] [ Load ] [ Revise ] [ Deliver ] [ Ask Devin ] │
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
│ TRANSPORT  [ ● Produce ] [ ⬆ Load ] [ ✎ Revise ] [ 🚀 Deliver ] [ 🤖 Ask Devin ]  ◉ palmier ○ ffmpeg│
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
- **Transport** = the five verbs + the backend toggle (`palmier` for the real timeline, `ffmpeg`
  for a local preview MP4). Buttons disable until Doctor is green. **Produce / Load / Revise** are
  the everyday loop; **Deliver** opens the export → publish → attach + moments panel (§4.6, §10);
  **Ask Devin** opens the hand-off modal (§4.7, §11). Deliver stays disabled until a lesson has
  been produced + loaded.

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

### 4.6 Deliver panel (export → publish → attach + moments)

A staged panel — each step unlocks the next, and the two "real" steps are explicitly gated. It is
a thin UI over `palmier export` / `publish` / `moments` / `attach` (§10).

```
┌─ Deliver · C1-CLAUDE ─────────────────────────────────────────────────────────────┐
│                                                                                    │
│  1 · EXPORT                                                            [ Export ]  │
│      videos/C1-CLAUDE.mp4 · 1920×1080@24 · 147.5s · drift 0.02s · within tol ✓     │
│                                                                                    │
│  2 · PUBLISH        target: ◉ dry-run   ○ mux                        [ Publish ]   │
│      dry-run: would upload C1-CLAUDE.mp4 (12.4 MB) to Mux                          │
│      ⚠ selecting "mux" requires MUX_TOKEN_ID / MUX_TOKEN_SECRET in the keychain    │
│                                                                                    │
│  3 · MOMENTS        moments.yaml ✓ 2 sections · 5 moments (3 prompt · 2 link)      │
│      [ Open moments.yaml ]   [ Compile preview ]                                   │
│                                                                                    │
│  4 · ATTACH         target: ◉ sql   ○ api   ○ supabase                             │
│      ┌──────────────────────────────────────────────────────────────────────┐    │
│      │ PREVIEW (dry-run) — lms/C1-CLAUDE-moments.sql                          │    │
│      │  UPDATE lessons SET video_url='mux:REPLACE…', player_type='interactive'│    │
│      │  + 2 chapters · 5 moments  (no rows written)                           │    │
│      └──────────────────────────────────────────────────────────────────────┘    │
│      ☐ Apply for real   (requires a real target + a Mux playback id)   [ Attach ]  │
└────────────────────────────────────────────────────────────────────────────────────┘
```

Behaviors:
- **Export** runs `palmier export <id>` and shows the ffprobe verdict (`withinTolerance`). Disabled
  until the lesson is produced.
- **Publish** defaults to **dry-run**; switching to `mux` is what makes it real, and the UI hard-checks
  the Mux secrets are present first. On success it shows `mux:<playbackId>` and stores it for step 4.
- **Moments** edits the sidecar `moments.yaml` and shows the *compiled* section/moment counts and the
  kind breakdown — never authored in the app, always compiled by the engine.
- **Attach** always renders the **dry-run preview** (the emitted SQL + counts) first. The
  `☐ Apply for real` checkbox is the second gate: it stays disabled unless a real target (`api`/`supabase`)
  is selected **and** a Mux playback id exists — mirroring the engine's double-gate (§10). `sql` can
  never write; it only emits the file to run by hand.

### 4.7 "Hand off to Devin" modal

```
┌─ Ask Devin ───────────────────────────────────────────────────────────────┐
│  Run Devin:  ◉ local CLI (this Mac)    ○ cloud session (/handoff)          │
│  What should Devin do?                                                      │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │ Produce C2 from the brief in topic-brief.md, load it, then deliver  │     │
│  │ a dry-run attach preview so I can review the moments.                │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│  Devin uses the SAME `palmier … --json` commands. It will ask before any    │
│  script edit (Hard Rule #5) and before any real publish/attach (§10).       │
│                                                  [ Cancel ]   [ Hand off ]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **local CLI** spawns the Devin CLI on this Mac through the *same* child-process adapter the app uses
  for the engine (§5b) — so Devin can reach Palmier's localhost MCP and the local engine.
- **cloud session** emits a `/handoff` with the lesson context for fan-out across *different* lessons
  (cloud sessions can't reach this Mac's localhost Palmier — see §11).
- The prompt is free-form because Devin is the multi-step **reasoning** layer; the app stays the
  deterministic single-window tool. Maps onto the Producer + Revision topology in §11.

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
node dist/cli.js export   C1-CLAUDE --json
node dist/cli.js publish  C1-CLAUDE --json --target dryrun
node dist/cli.js moments  C1-CLAUDE --json --playback-id <id>
node dist/cli.js attach   C1-CLAUDE --json --target sql          # add --target api|supabase + --apply to write
```

> The deliver commands write their final result as a single JSON object on stdout today; the
> streaming `--json` events below are the proposed shape for the app's progress panel (§4.6). A
> future Devin hand-off (§4.7, §11) spawns the **identical** invocations through the same adapter.

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
{ "type": "export.rendered",  "path": ".../videos/C1-CLAUDE.mp4", "sec": 147.5, "drift": 0.02, "withinTol": true }
{ "type": "publish.uploaded", "target": "mux", "bytes": 13010234, "uploadId": "abc123" }
{ "type": "publish.asset_ready", "playbackId": "k1pLAY…", "status": "ready" }
{ "type": "moments.compiled", "sections": 2, "moments": 5, "checkpoints": 1, "sql": ".../lms/C1-CLAUDE-moments.sql" }
{ "type": "attach.previewed", "target": "sql", "sections": 2, "moments": 5, "applied": false }
{ "type": "attach.applied",   "target": "api", "lessonSlug": "meet-claude", "sections": 2, "moments": 5, "applied": true }
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
| `export:start` / `publish:start` / `moments:start` / `attach:start` | R→M | command + opts (`target`, `apply`, `playbackId`) → spawns child (§10) |
| `devin:handoff` | R→M | `{ mode: "local"\|"cloud", prompt }` → spawns the Devin CLI or emits `/handoff` (§11) |
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

## 10. The "Deliver" chain → export · publish · attach + moments

Producing + loading gets a lesson onto the **Palmier timeline**. Delivering turns it into a
**published, interactive LMS lesson**. The app's **Deliver** panel (§4.6) is a thin UI over four
engine commands that already exist and are tested in the CLI — the app does not add logic, it just
sequences and gates them. Strict order `[SEQ]`:

```
   export  ─▶  publish  ─▶  moments  ─▶  attach
   one MP4     mux:<id>     *.yaml→sql    LMS rows
   (ffprobe)   (Mux)        (no writes)   (double-gated)
```

| Step | CLI | Default (safe) | What makes it "real" | Extra guard |
| --- | --- | --- | --- | --- |
| **Export** | `palmier export <id>` | renders `videos/<id>.mp4`, ffprobe-verifies | n/a (local only) | drift must be within tolerance |
| **Publish** | `palmier publish <id>` | `dryrun` — prints what it *would* upload | `--target mux` | needs `MUX_TOKEN_ID`/`SECRET` |
| **Moments** | `palmier moments <id>` | compiles `moments.yaml` → JSON + idempotent SQL, **no DB writes** | n/a (never writes) | negative/past-end anchors hard-error |
| **Attach** | `palmier attach <id>` | dry-run preview of the LMS rows | `--target api\|supabase` **and** `--apply` | also requires a Mux playback id |

### 10.1 The two-gate safety model

A real attach write requires **both** an explicit real `--target` **and** `--apply`. With only one
(or neither) it dry-runs and prints the rows it *would* write. Even with both, it refuses to write
if there's no Mux playback id (you can't publish an interactive lesson with no video). The JSON
bundle + the idempotent SQL are written on **every** run, so the `sql` target alone is a complete,
zero-credential workflow: emit the file, review it, run it by hand in Supabase. In the app this is
the `☐ Apply for real` checkbox, disabled until both conditions hold (§4.6).

### 10.2 Authoring moments — the `moments.yaml` sidecar

Moments are authored in a sidecar next to `script.md`, anchored to a **segment** (`seg:` + optional
`offset:`) or an **absolute** timestamp (`at:`). The engine resolves anchors to absolute seconds
against the produced alignment:

```yaml
lesson: { course: meet-your-coworker, slug: meet-claude, title: Meet Claude }
sections:
  - { seg: "01", title: "What Claude is" }
  - { at: "1:12", title: "Your first prompt" }
moments:
  - { seg: "03", kind: prompt, title: "Install Claude Code", body: "curl -fsSL https://claude.ai/install.sh | sh", copyable: true }
  - { seg: "05", offset: 4, kind: link,  title: "Docs", url: "https://docs.claude.com" }
  - { at: "2:05",          kind: pause,  title: "Try it yourself", instructions: "Open Claude and say hello", cta: "I did it — continue" }
```

| kind | LMS mapping |
| --- | --- |
| `prompt` / `snippet` / `note` | `lesson_moments.artifact_kind=<kind>`, `artifact_copyable=true` |
| `link` | `artifact_kind='link'` + `artifact_url` |
| `file` | `artifact_kind='file'` + `artifact_url`, `artifact_copyable=false` |
| `pause` | `is_checkpoint=true` + `checkpoint_instructions` + `checkpoint_cta_label` |
| section | a `lesson_video_chapters` row (coarse chapter) |

The compiled lesson row also sets the interactive-player fields: `video_url='mux:<id>'`,
`lesson_type='video'`, `player_type='interactive'`, `is_published=true`, `allow_preview=true`.
(ABSORB-only segments get no moments.)

### 10.3 The three attach targets (`sql` · `api` · `supabase`)

Behind one `AttachTarget` interface — same pattern as the timeline backends (ffmpeg/palmier):

| Target | How it lands | Creds (local env / keychain) | Tradeoff |
| --- | --- | --- | --- |
| **`sql`** (default, safe) | emit `lms/<id>-moments.sql` to run/review in Supabase | none | zero risk, manual last step |
| **`api`** (recommended) | `POST` to an authenticated hgdw-lms endpoint that wraps the LMS server actions | `HGDW_LMS_API_BASE` + scoped `HGDW_LMS_API_TOKEN` | goes through app validation, schema stays owned by the LMS |
| **`supabase`** (fallback) | direct PostgREST write with the service key | `HGDW_SUPABASE_URL` + `HGDW_SUPABASE_SERVICE_KEY` | fastest, but bypasses RLS/app logic, couples to the schema |

**`api` endpoint contract** (the recommended path; a small companion endpoint to add on hgdw-lms,
targeting `staging`, as a separate confirmed PR — no prod data):

```
POST {HGDW_LMS_API_BASE}/api/admin/lessons/moments
Authorization: Bearer {HGDW_LMS_API_TOKEN}
Content-Type: application/json

  body  = the moments bundle { lesson, sections[], moments[] }   (same JSON the engine compiles)
  200   = { "lessonSlug": "meet-claude", "sectionCount": 2, "momentCount": 5 }
  non-2xx = failure (the engine surfaces the message; nothing is considered applied)
```

The endpoint authenticates the token, confirms the Mux asset is `ready` before flipping
`is_published`, resolves `course.slug` + `lesson.slug` → `lesson_id`, then upserts the lesson and
**replaces** its chapters + moments in one idempotent transaction. Full details + the verify steps
live in [`OPERATOR-GUIDE.md` → Part 4](OPERATOR-GUIDE.md#part-4--deliver-export--publish--attach--moments).

---

## 11. "Hand off to Devin" → the Producer + Revision topology

The earlier spec under-specified Devin (it only appeared as a non-goal: "don't replace Devin").
But Devin is the recommended way to *drive* the whole workflow — so the app makes it a **first-class
4th action** (`Ask Devin`, §4.7) alongside Produce / Load / Revise. This is straightforward because
the app already calls the engine through a **child-process adapter** (§5b); spawning the **Devin
CLI** locally is the same mechanism, just a different child.

**Two AI surfaces in the app — keep them distinct:**

| Surface | What it is | When to use |
| --- | --- | --- |
| **Draft with AI** (§4.5, §8) | the engine's built-in LLM drafter (`palmier script`) — one shot, topic → `script.md` | quick first draft of a single script |
| **Ask Devin** (§4.7) | the full multi-step **reasoning** agent driving `palmier … --json` | produce-from-brief, cross-segment fixes, the whole deliver chain |

**Maps onto the agent topology already documented in the operator guide + the `hgdw-revision`
skill:**

- **Producer (main Devin session, local):** the one-pass build — script → produce → load — and now
  the deliver chain (export → publish → attach + moments) under the same gates (§10). This is what
  the `Ask Devin` modal's *local CLI* mode spawns.
- **Revision subagent (local):** the surgical `palmier correct` loop — the exact contract the
  **Revise** button enforces (§9). The app's two human-facing surfaces (Revise button, Ask-Devin
  modal) therefore map 1:1 onto the two Devin roles.

**Local vs cloud — the one hard constraint.** Revision and delivery that touch Palmier or the
lesson's files must run on the **same Mac** (Palmier's MCP is localhost; the assets are on that
disk). So the `Ask Devin` modal's **local CLI** mode is the default and the only one that can drive
Palmier. The **cloud `/handoff`** mode is for the *different* axis — fanning out **separate** lessons
(C1/C2/C3) across machines/operators in parallel; a cloud session cannot reach this Mac's localhost
Palmier. The UI states this so an operator never picks cloud for a job that needs the local timeline.

> Net: the app doesn't *replace* Devin, it **launches** it — and because Devin and the app both call
> the identical `palmier … --json` commands with the identical guardrails, handing a job back and
> forth between them is lossless.

---

## 12. Secrets & security

- **Keys live in the macOS Keychain**, written by `main` via a keychain binding (e.g. `keytar` or
  Electron `safeStorage`). They are **never** written to `.env`, never logged, and never returned
  to the renderer (the renderer only ever asks "is key X present?").
- Keys are injected into the child engine process via its **environment**, not argv, so they can't
  appear in `ps`/process listings.
- `contextIsolation: true`, `nodeIntegration: false`, a strict CSP, and `sandbox: true` on the
  renderer. The preload bridge exposes only the typed channels in §6.3 — no general `fs`/`exec`.
- The app makes **no outbound network calls of its own** beyond what the engine already does
  (ElevenLabs, the configured LLM, and localhost Palmier — plus, for Deliver, Mux and the chosen
  attach target only when the operator opts in).
- **Keys the keychain holds:** `ELEVENLABS_API_KEY`, `PALMIER_LLM_API_KEY`, and the **opt-in
  delivery** keys — `MUX_TOKEN_ID`/`MUX_TOKEN_SECRET` (publish), `HGDW_LMS_API_BASE` +
  `HGDW_LMS_API_TOKEN` (the `api` attach target), and `HGDW_SUPABASE_URL` +
  `HGDW_SUPABASE_SERVICE_KEY` (the `supabase` fallback). Delivery keys are only read when the
  operator picks a real target — the safe defaults need none. No telemetry by default; crash
  reporting (E4) is opt-in.

---

## 13. Packaging & distribution

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

## 14. Build plan, by team

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

### Phase E3.5 — Deliver + Hand off to Devin (engine ✅ built · UI ⬜planned)

> The **engine/CLI side of this phase already exists and is tested** on `vibedevview`: `palmier
> export` / `publish` / `moments` / `attach` (the `sql`/`api`/`supabase` targets, double-gated) ship
> today with mutation-proofed tests. What remains is the **UI + Devin surface** over them.

| Deliverable | Owner | Stream | Status |
| --- | --- | --- | --- |
| `export` / `publish` / `moments` / `attach` engine commands + `AttachTarget` (sql/api/supabase) + double-gate | Core Engine Team | **[SEQ]** (everything below depends on it) | ✅ **built** |
| Deliver panel (§4.6): staged export→publish→moments→attach with the dry-run preview + `Apply` gate | Frontend Integration Team | **[SEQ]** (needs the E0 event stream extended with deliver events §6.2) | ⬜ planned |
| Wire deliver `--json` events (`export.rendered`, `publish.asset_ready`, `moments.compiled`, `attach.previewed/applied`) into the status stream | Core Engine Team | **[PAR]** | ⬜ planned |
| "Ask Devin" modal (§4.7) → spawn the local Devin CLI / emit cloud `/handoff` via the child adapter | Backend Architecture Team | **[PAR]** | ⬜ planned |
| companion hgdw-lms `api` endpoint (§10.3) — separate PR, targets `staging`, no prod data | Backend Architecture Team | **[PAR]** (unblocks the `api` target only; `sql`/`supabase` work without it) | ⬜ planned |
| Deliver/Devin guardrail tests (attach never writes without target+apply+playbackId; cloud handoff blocked for Palmier-bound jobs) | QA / Test Team | **[PAR]** | ⬜ planned |

**Acceptance:** the Deliver panel runs export (ffprobe-green) → publish (dry-run) → attach
*preview* with **zero** writes and zero credentials; flipping to a real target + `Apply` is blocked
until a Mux playback id exists; "Ask Devin (local)" launches a Devin CLI that drives the identical
`palmier … --json` commands; choosing "cloud" for a Palmier-bound job is disallowed with a clear hint.

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

## 15. Milestones & definition of done

| Milestone | Contents | Done when |
| --- | --- | --- |
| **M0 — Contract frozen** | E0 event stream + IPC + adapter | headless harness asserts the event sequence; shell boots with keychain |
| **M1 — Author experience** | E1 editor + preview + validation | can write a lesson and see every slide live, no terminal |
| **M2 — MVP (internal)** | E2 produce/load/status + doctor gate | a teammate produces & loads the example lesson end-to-end in the GUI |
| **M3 — AI + Revise** | E3 Draft-with-AI + surgical Revise | one-segment fixes and AI drafts work with guardrails enforced |
| **M3.5 — Deliver + Devin** | E3.5 Deliver panel + Ask-Devin (engine already built ✅) | export→publish→attach *preview* runs in the GUI with zero writes; Ask-Devin (local) drives the same CLI |
| **M4 — Shippable** | E4 notarized build + wizard + smoke | clean-Mac install → produce → load with zero terminal steps |

**MVP = M2.** Drafting and Revise (M3) are fast-follows; Deliver + Ask-Devin (M3.5) wrap the
already-built delivery engine in UI; "Generate in Palmier" is explicitly post-MVP pending the
schema spike.

---

## 16. Risks & mitigations

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| **Packaging Chromium + ffmpeg** bloats/breaks the build | High | Wizard detects/installs on first run (§13 option ii); bundling is a later optimization |
| **Palmier `generate_*` schemas** differ from assumptions | Med | Surface 2 is post-MVP and gated behind a live-build spike; MVP doesn't depend on it |
| **In-process adapter crashes take down `main`** | Med | Default to child-CLI (b); crashes isolate to the child and surface as an `error` event |
| **Palmier not open** when user hits Load | High | Doctor probes `127.0.0.1:19789`; Load disabled with a clear "open a Palmier project" hint |
| **Engine/app drift** | Med | Child-CLI adapter + vendored pinned engine version so they ship and update together |
| **Secret leakage** | Low/High-impact | Keychain-only, env-not-argv injection, renderer never sees values (§12) |
| **Long produce feels frozen** | Med | Live per-agent progress + cancel from the event stream (§4.3) |
| **Accidental prod write from Deliver** | Low/High-impact | Double-gate: real attach needs `--target`+`--apply`+a Mux playback id; `sql` default writes nothing (§10.1) |
| **`api` target without the LMS endpoint** | Med | `sql`/`supabase` targets work standalone; the `api` endpoint is a separate confirmed PR (staging, no prod data) |

---

## 17. Open questions (resolve before E0)

1. **Which "Claude feature" first?** Confirm priority: (1) engine script drafting (already
   supported, ship in E3) vs (2) Palmier's in-app `generate_*` (needs a schema spike, post-MVP).
2. **In-process vs child-CLI adapter** — settle in the E0 spike (recommended: child-CLI (b)).
3. **Where do lesson folders live** relative to the app — keep `~/hgdw-productions`, or an
   app-managed library with import/export? (Default: keep `~/hgdw-productions`.)
4. **Multi-machine** — does the app ever need to drive a *remote* Palmier, or is it strictly local
   (matching the CLI)? Default assumption: strictly local; remote stays a CLI/SSH advanced path.
5. **Distribution channel** — GitHub Releases + auto-update only, or also a signed direct download
   on a team site?
6. **`api` attach token scope** — what minimum permission set does `HGDW_LMS_API_TOKEN` need on the
   companion endpoint, and is it per-operator or per-machine? (Default lean: per-operator, scoped to
   the moments endpoint only.)

---

## 18. Non-goals

- Re-implementing any agent in the renderer — the engine remains the source of truth.
- A web-hosted version — Palmier's MCP is localhost-only, so this is a desktop app by nature.
- Replacing Devin — Devin remains the recommended way to *drive* the workflow, and the app makes
  this **first-class** via the "Ask Devin" surface (§4.7, §11) rather than hiding it: the app
  *launches* Devin, it doesn't replace it. The app is for operators who prefer a GUI; both call the
  same engine and honor the same revision + delivery contracts.
- Owning the LMS schema — the `attach` step writes through the LMS (`api`) or emits reviewable SQL
  (`sql`); the app never becomes the source of truth for the LMS data model (§10.3).
- A general-purpose video editor — Palmier *is* the editor; this app authors + drives, it does not
  edit the timeline by hand.
