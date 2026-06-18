# Electron App — Scope (vibedevview Studio)

**Status: scope / proposal only.** This document specifies a desktop app that wraps the existing
vibedevview engine in a friendly UI — a markdown **script editor** with **live slide preview**
and one-click **Produce / Load / Revise** buttons — so a non-technical team member can make a
lesson without touching a terminal. Nothing here is built yet; this is the plan.

> Legend (matches [`ROADMAP.md`](ROADMAP.md)): **[SEQ]** = big sequential feature that blocks
> others · **[PAR]** = can be built in parallel. Status: ✅done · 🟡in progress · ⬜planned.

---

## 1. Why an app (and why it's mostly UI)

Today the workflow is: write `script.md` → `palmier produce` → `palmier assemble`. That already
works and is fully local. The app does **not** reinvent any of that — it **drives the same
engine and the same CLI**. Its entire job is to remove the terminal and the round-trips:

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

## 2. Architecture

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

Two viable ways for the app to call the engine — pick during spike:

- **(a) In-process import** of the engine's exported functions (`produce`, `assemble`,
  `buildPlan`, `renderSlides`, …). Fastest UX, tightest coupling; the app must bundle the same
  Node deps (Playwright Chromium, ffmpeg).
- **(b) Child-process CLI** (`node dist/cli.js …`) with `--json` progress events. Looser
  coupling, reuses the exact tested path, easier to keep in lockstep with the CLI. **Recommended
  default** — it guarantees the app and CLI never diverge.

> **Engine prerequisite [SEQ]:** expose a stable, machine-readable progress stream
> (`--json` events: `slide.rendered`, `voice.done`, `assemble.placed`, `error`) so the UI can
> show live status. This is the one engine change the app hard-depends on.

---

## 3. The Palmier "Claude" / AI integration

Palmier Pro exposes AI tools over its MCP — notably `list_models` and a family of `generate_*`
tools. There are **two distinct AI surfaces** we can offer, and they're independent:

| Surface | What it is | Where it runs | Status of engine support |
| --- | --- | --- | --- |
| **Engine script drafting** | The engine's built-in LLM drafter (`palmier script`, Anthropic Claude by default via `PALMIER_LLM_*`). Turns a topic brief → full `script.md`. | LLM API (Anthropic/OpenAI/…) | ✅ already in the engine (`src/llm.ts`, `src/agents/script-agent.ts`) |
| **Palmier in-app generation** | Palmier's own `generate_*` tools (`list_models` to enumerate, `generate_*` to create media inside Palmier). | Palmier app / its providers | ⬜ not yet wired into the engine |

**App plan:**
- A **"Draft with AI"** button in the editor calls the engine's script drafter (surface 1) to
  fill a new script from a one-line topic — then drops the human into the editor to refine.
  Reuses `PALMIER_LLM_*` config; no new engine code beyond surfacing it.
- A future **"Generate in Palmier"** affordance (surface 2) would call `list_models` to populate
  a model picker and `generate_*` for in-Palmier assets. **Scope it after** a spike that
  confirms the exact tool schemas against a live Palmier build (we've only reverse-engineered the
  core 27 tools so far; the `generate_*` schemas need verification). [PAR], post-MVP.

> Keep the two surfaces clearly separated in the UI so operators know whether an asset came from
> *our* pipeline (branded, deterministic slides) or from *Palmier's* generator.

---

## 4. The "Revise" button → the revision subagent contract

The app's **Revise** action maps **directly** onto the revision contract already shipped as the
[`hgdw-revision`](../.devin/skills/hgdw-revision/SKILL.md) skill and the `palmier correct`
command. The UI must honor the same guardrails:

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

---

## 5. Build plan, by team

> Mirrors [`ROADMAP.md`](ROADMAP.md) conventions: explicit ownership, **[SEQ]** vs **[PAR]**.

### Phase E0 — Foundations (⬜planned)

| Deliverable | Owner | Stream |
| --- | --- | --- |
| Engine `--json` progress event stream (`slide.rendered`, `voice.done`, `assemble.placed`, `error`) | Core Engine Team | **[SEQ]** (UI status hard-depends on it) |
| Engine adapter decision: in-process vs child-CLI (spike both, pick (b) unless perf forces (a)) | Backend Architecture Team | **[SEQ]** (defines the app↔engine boundary) |
| Electron shell + secure IPC + secrets via OS keychain (ElevenLabs / LLM keys) | Backend Architecture Team | **[SEQ]** (foundation) |

### Phase E1 — Editor + preview (⬜planned)

| Deliverable | Owner | Stream |
| --- | --- | --- |
| Markdown editor (CodeMirror) with `script.md` schema awareness + frame autocomplete | Frontend Integration Team | **[PAR]** |
| Live slide preview (render the focused segment's frame to a thumbnail via the Slides agent) | Slides & Brand Team | **[PAR]** |
| Segment list / outline with phase + duration + status chips | Frontend Integration Team | **[PAR]** |
| Inline validation (surface `parseScript` errors as editor squiggles) | Script & Parsing Team | **[PAR]** |

### Phase E2 — Produce / Load / status (⬜planned)

| Deliverable | Owner | Stream |
| --- | --- | --- |
| Produce button → run engine, stream agent progress to a status panel | Frontend Integration Team | **[SEQ]** (needs E0 event stream) |
| Load-to-Palmier button + live timeline readback (reuse default clean behavior) | Timeline Integration Team | **[PAR]** |
| Doctor/preflight panel (green-checks before enabling Produce) | Core Engine Team | **[PAR]** |

### Phase E3 — AI + Revise (⬜planned)

| Deliverable | Owner | Stream |
| --- | --- | --- |
| "Draft with AI" → engine script drafter (surface 1) | Script & Parsing Team | **[PAR]** |
| "Revise" button → `palmier correct` with the approval-diff gate | Frontend Integration Team | **[SEQ]** (must enforce Hard Rule #5) |
| Spike + scope "Generate in Palmier" (`list_models` / `generate_*`, surface 2) | Timeline Integration Team | **[PAR]** (post-MVP) |

### Phase E4 — Packaging (⬜planned)

| Deliverable | Owner | Stream |
| --- | --- | --- |
| Notarized macOS build; bundle/locate Chromium + ffmpeg; first-run setup wizard (mirrors README Part 1) | Backend Architecture Team | **[SEQ]** (release gate) |
| Auto-update + crash reporting | Backend Architecture Team | **[PAR]** |

**Parallelism note:** E0 is the critical path — the `--json` event stream **[SEQ]** and the
adapter boundary **[SEQ]** unblock everything. Once they land, the editor/preview (E1) and
produce/load (E2) tracks run largely **[PAR]** across the Frontend, Slides, and Timeline teams.

---

## 6. Open questions (resolve before E0)

1. **Which "Claude feature"?** Confirm whether the priority is (1) engine script drafting
   (already supported) or (2) Palmier's in-app `generate_*` — the latter needs a schema spike.
2. **In-process vs child-CLI adapter** — settle in the E0 spike (recommended: child-CLI).
3. **Where do lesson folders live** relative to the app (keep `~/hgdw-productions`, or an
   app-managed library with import/export)?
4. **Multi-machine** — is there ever a need to drive a *remote* Palmier from the app, or is it
   strictly local (matching the CLI)? Default assumption: strictly local.

---

## 7. Non-goals

- Re-implementing any agent in the renderer — the engine remains the source of truth.
- A web-hosted version — Palmier's MCP is localhost-only, so this is a desktop app by nature.
- Replacing Devin — Devin remains the recommended way to *drive* the workflow; the app is for
  operators who prefer a GUI. Both call the same engine.
