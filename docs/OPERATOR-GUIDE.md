# Operator Guide

How to **author** an HGDW lesson script and **run** the pipeline end-to-end from any
compatible Mac. The default path is **local, on your own Mac** — either by asking **Devin**
(recommended) or by running the `palmier` CLI yourself. Driving a *shared/remote* Mac over SSH
is possible but advanced; it lives in the [appendix](#appendix--driving-a-remote-mac-over-ssh).

This is the day-to-day runbook. If you've never used any of these tools, start with the
[README](../README.md) (zero-assumption setup), then come back here for depth. For the visual
system and the 16 frame types see [`HGDW-DESIGN.md`](../HGDW-DESIGN.md); for the internals see
[`docs/ARCHITECTURE.md`](ARCHITECTURE.md).

---

## Mental model

```
            you write                    the engine produces                 the assembler places
        ┌───────────────┐          ┌──────────────────────────┐         ┌───────────────────────────┐
        │   script.md   │  ──────▶ │ Script → Slides → Voice → │ ──────▶ │ Palmier Pro timeline (Mac) │
        │ (markdown +   │          │ Recording  (assets on disk)│         │   or  ffmpeg preview MP4   │
        │  SAY / SLIDE) │          └──────────────────────────┘         └───────────────────────────┘
        └───────────────┘                     │                                      ▲
                                              └──── coordinate ONLY through files ────┘
```

Two facts drive everything below:

1. **The engine *generates* assets; Palmier only *arranges* them.** Voiceover (ElevenLabs),
   slides (headless Chrome), recordings (screen capture) are all produced first, on disk.
   Palmier's MCP then imports those files and lays clips on the timeline. That's why you
   need an ElevenLabs key even when "driving Palmier by MCP."
2. **Palmier's MCP is localhost-only** (`http://127.0.0.1:19789/mcp`), bound to the Mac
   running Palmier Pro. The pipeline drives it from the *same machine* — normally you (or a
   *local* Devin agent) run the CLI on that Mac.

---

## Who does the thinking — Devin's role & agent topology

It helps to separate two layers:

- **The code "agents"** — Script, Slides, Voice, Recording, Orchestrator — are deterministic
  functions inside this engine. They don't reason; they render, call TTS, verify, and place
  clips. They coordinate **only** through files in the working dir (see
  [`ARCHITECTURE.md`](ARCHITECTURE.md)).
- **Devin** is the *reasoning* layer that drives the engine in a session: it writes/edits the
  script, runs the CLI, reads the timeline back, and decides what to fix.

```
        ┌──────────────────── ONE local Devin session (on the operator's Mac) ───────────────────┐
        │                                                                                          │
        │   PRODUCER role                              REVISION subagent (skill: hgdw-revision)    │
        │   ───────────────                            ───────────────────────────────────────    │
        │   topic ─▶ draft script (you approve)        human feedback on ONE part                 │
        │         ─▶ palmier produce                          │                                   │
        │         ─▶ load full timeline                       ▼                                   │
        │                                              palmier correct --seg <id>  (surgical)     │
        │                                              verify just that clip ─▶ report            │
        │                                                                                          │
        └──────────────────────────────────────────────────────────────────────────────────────┘
                       both talk to the SAME local Palmier (127.0.0.1:19789)
```

**Two Devin roles, by design:**

| Role | Skill | Scope | Touches the bin? |
| --- | --- | --- | --- |
| **Producer** | [`hgdw-video-production`](../.devin/skills/hgdw-video-production/SKILL.md) | script → `produce` → load the full timeline | yes — clean build resets it |
| **Revision subagent** | [`hgdw-revision`](../.devin/skills/hgdw-revision/SKILL.md) | one piece of feedback → `correct` one clip → verify | no — surgical, never wipes |

**Why split revision into its own subagent?**

1. **Context hygiene** — revision is a long, chatty back-and-forth ("fix the typo at 1:23",
   "punch up seg 5"). Isolating it keeps the Producer's context clean and the loop fast.
2. **Tighter guardrails** — the revision agent is scoped to *only* `correct` + verify, so it
   can't accidentally re-`produce` and stomp the whole timeline. It must get human approval
   before changing any script text (Hard Rule #5).
3. **Parallelizable reasoning** — because `correct` is surgical, several segment fixes can be
   reasoned about independently. (Timeline *writes* still serialize — there's one Palmier.)

**Local subagent — not a cloud child session.** Revision (and production) execution must run on
the **same Mac as Palmier** (localhost MCP + assets on that disk). A Devin *cloud child session*
runs on a separate VM and cannot reach the Mac's Palmier or its files, so it's the wrong tool
for revising a live timeline. Cloud child sessions are still useful here for a different axis:
fanning out **different lessons** (C1 / C2 / C3) across operators/machines in parallel — each
still needs its own Mac with Palmier.

---

# Part 1 — Authoring a script

A lesson is **one markdown file**, `script.md`. It has YAML frontmatter, then one `##`
heading per segment. Each segment can carry narration (`SAY:`), a slide (`SLIDE:`), and/or
recording steps (`DO:`).

### Frontmatter

```yaml
---
lesson: C1-CLAUDE                                  # LESSON_ID — must match the working-dir name
title: Meet Your New Coworker — Claude & Cowork    # shown in logs / outro fallback
track: CONTEXT / ABSORB 1                           # optional, free text
voice: Ja'dan                                       # default voice for every SAY in this script
---
```

### Segment anatomy

```markdown
## 01 · Cold open
phase: SOURCE          # SOURCE | ABSORB | MIRROR | COMMAND  (HGDW arc; optional)
duration: 9            # seconds. The Voice Agent overrides this with the REAL TTS length
                       # when there's a SAY block; it's the authority for silent slides.
silent: true           # optional — no narration; slide is held for `duration` seconds

SAY:
By the end of this session you will do three things.

SLIDE:
```yaml
frame: N1-title
title: Build With AI
subtitle: Specs, Agents & the Build Loop
```

DO:
- Open the editor and show the file tree   # only if this segment is a screen recording
```

Rules of thumb:

- **`SAY:` is the timing authority.** When a segment has narration, its real duration is the
  rendered ElevenLabs clip length; the slide is held exactly that long. `duration:` only sets
  the length of `silent:` slides (or segments with no `SAY`).
- A segment may be **slide-only** (`silent: true`, no `SAY`), **voice-only** (rare), or both.
- `DO:` segments produce a screen recording. If no recording exists, the Recording Agent emits
  a **labeled placeholder** (`D1` dark frame naming the app) — it never fabricates footage.
- Never hand-edit the generated `segments.json`; edit `script.md` and re-run `palmier script`.

### Frame reference (exact field names per frame)

`bg` (`gradient` | `dark` | `light`) and `footer` are accepted on any frame. Text is HTML-escaped.
Fields marked *(falls back …)* will reuse another field if omitted.

| Frame | Fields you set | Notes |
| --- | --- | --- |
| `N1-title` | `eyebrow`, `title`, `subtitle` | Big opening title card (gradient). |
| `N2-section` | `eyebrow`, `title`, `subtitle` | Section divider (gradient). |
| `N3-quote` | `title` *(quote; falls back to `body[0]`)*, `subtitle` *(attribution)* | Keep attribution short (≤ ~760px / 42px). |
| `N4-vocab` | `eyebrow`, `title`, `tags[]` | Vocab chips; often `silent: true`. |
| `N5-agenda` | `eyebrow`, `title`, `body[]` | Roadmap / agenda list. |
| `C1-bullets` | `eyebrow`, `title`, `subtitle`, `body[]` | Title + bullet list (dark). |
| `C2-statement` | `title` *(gradient text; falls back to `body[0]`)*, `subtitle` | One big statement. |
| `C3-compare` | `eyebrow`, `title`, `columns[] {heading, items[]}` | Two-column compare. |
| `C4-steps` | `eyebrow`, `title`, `body[]` | Numbered steps. |
| `C5-callout` | `eyebrow`, `title`, `body[]` | Coral callout box. |
| `C6-code` | `eyebrow`, `title`, `code` | `lang` is accepted but not rendered. |
| `C7-stat` | `stat` *(falls back to `title`)*, `statLabel` *(falls back to `subtitle`)* | Big number. |
| `C8-figure` | `title`, `image`, `caption` | `image` = path/URL to a figure. |
| `D1-placeholder` | `eyebrow`, `title`, `subtitle` | Demo placeholder (also the auto recording placeholder). |
| `D2-lowerthird` | `title`, `subtitle` | Lower-third label over a recording. |
| `O1-outro` | `eyebrow`, `title` *(falls back to wordmark)*, `subtitle` | Closing card. |

Two worked examples:

```yaml
# compare
frame: C3-compare
eyebrow: Two modes
title: Chat vs. Cowork
columns:
  - heading: Chat
    items: ["One turn at a time", "You hold the context", "Great for quick answers"]
  - heading: Cowork
    items: ["Runs a whole task", "Keeps its own context", "Great for real work"]
```

```yaml
# stat
frame: C7-stat
stat: "10×"
statLabel: faster from idea to first draft
bg: gradient
```

---

# Part 2 — Running from any compatible Mac

### Prerequisites (once per machine)

| Need | Why | Install |
| --- | --- | --- |
| macOS 26 (Tahoe)+ | Required by Palmier Pro (live timeline only) | — |
| Node ≥ 20 | Runtime | `brew install node` |
| ffmpeg + ffprobe | Voice encoding + slide verification | `brew install ffmpeg` |
| Chromium | Headless slide rendering | `npx playwright install chromium` |
| ElevenLabs key | TTS voiceover | `export ELEVENLABS_API_KEY=sk_...` |
| Palmier Pro **open with a project** | Exposes the MCP at `127.0.0.1:19789` | live-timeline runs only |

> **Homebrew PATH:** on Apple Silicon, brew installs to `/opt/homebrew/bin`, which is **not**
> on a non-interactive SSH shell's PATH. For remote runs always prefix:
> `export PATH="/opt/homebrew/bin:$PATH"`.

```bash
git clone https://github.com/vibedevlabs/vibedevview
cd vibedevview
npm install && npm run build
npx playwright install chromium
npm link                       # optional: puts `palmier` on PATH (else use `node dist/cli.js`)
export ELEVENLABS_API_KEY=sk_...
palmier doctor                 # must be all-ok before producing
```

### A. Local preview (no Palmier needed)

```bash
palmier init B-AB1             # seeds an editable script.md (skip if you wrote your own)
palmier produce B-AB1          # → ~/hgdw-productions/B-AB1/videos/B-AB1-preview.mp4
open ~/hgdw-productions/B-AB1/videos/B-AB1-preview.mp4
```

### B. Live Palmier timeline (on the Mac running Palmier Pro)

Open Palmier Pro with a project loaded, then:

```bash
PALMIER_TIMELINE=palmier palmier produce <LESSON_ID>
# or assemble from already-produced assets:
PALMIER_TIMELINE=palmier palmier assemble <LESSON_ID>
```

Clips drop onto the **Slides** / **Recordings** / **Voiceover** tracks at their computed
timestamps. By default the timeline + media bin are cleared first (see Part 3).

> Driving a **remote/shared** Mac over SSH is possible but advanced — see the
> [appendix](#appendix--driving-a-remote-mac-over-ssh). For a team, the recommended path is
> that each person runs locally on their own Mac (above), with no SSH or Tailscale.

### C. vibedevview Studio (the desktop app — no terminal)

For operators who'd rather not touch the terminal, **vibedevview Studio** is a desktop GUI that
wraps this exact engine. It's a thin client: every button spawns the same `palmier` CLI with
`--json` and renders the streamed events, so there's no second copy of the logic to drift.

```bash
cd vibedevview/app
npm install
npm run dev            # launches the Electron app
# or: npm run preview:web   # renderer-only, in a browser (editor + live preview; engine actions disabled)
```

It gives you a structured **segment-card editor** with a `</>` raw-source toggle, a pixel-accurate
**live slide preview** (the engine's own deck HTML), **Produce** with a streaming status bar,
**Doctor**, surgical **Revise** (with the diff-approval gate), **Draft with AI**, and a **Deliver**
panel. The Deliver panel is **dry-run only** — it exports the MP4 and previews publish/attach
(the SQL it *would* write), but never uploads to Mux or writes a database; real `--apply` writes
stay a CLI/Devin step (§4.1). The app needs the engine built first (`npm install && npm run build`
in the repo root). See [`app/README.md`](../app/README.md).

---

## Launching via Devin (CLI or Desktop)

For anyone who doesn't want to memorize commands, Devin drives the whole workflow on the
operator's own Mac. Because Devin's local agent runs *on that Mac*, it can reach Palmier's
localhost MCP and run this CLI directly — **no SSH, no Tailscale.**

**Install once** (also in the [README](../README.md#16--recommended-path-a-only-install-devin)):
`curl -fsSL https://cli.devin.ai/install.sh | bash` (or `brew install --cask devin-cli`), or
use **Devin Desktop** and run `Cmd+Shift+P → "Install Devin CLI"`.

**Start a session in the project:**

```bash
cd ~/vibedevview
devin                                  # interactive
#   …or preload a task:
devin -- "Produce DEMO-1 and load it onto the Palmier timeline."
```

The repo ships Devin two skills it auto-discovers from `.devin/skills/`:
[`hgdw-video-production`](../.devin/skills/hgdw-video-production/SKILL.md) (produce) and
[`hgdw-revision`](../.devin/skills/hgdw-revision/SKILL.md) (surgical fixes). So Devin already
knows the segment format, the 16 frames, and the reset behavior.

**What to initiate — example prompts:**

| Goal | Say to Devin |
| --- | --- |
| Draft a new script | *"Draft an HGDW script titled 'Prompting Basics', ~2 min, slides only, Ja'dan voice. Walk me through the segments before producing."* |
| Produce a preview | *"Produce DEMO-1 as a preview MP4 so I can check it."* |
| Load onto Palmier | *"Load DEMO-1 onto the Palmier timeline."* (Palmier must be open with a project.) |
| Fix one thing | *"Typo on the slide around 1:23 — fix just that segment."* (uses the revision skill) |
| Reset between takes | *"Clear the Palmier timeline and bin."* |

### How Devin generates a script

Devin drafts the script **in this session** in the exact `script.md` format, then shows it to
you for approval before producing anything (Hard Rule #5 — it never finalizes content without a
human yes). This is the **recommended default** for script generation because it keeps you in
plain English and Devin already knows the format.

There's also an **engine-native** drafter for fully unattended runs (`palmier script` with an
LLM key — Anthropic Claude by default). It reads `topic-brief.md` from the lesson folder and
writes `script.md` *only if one doesn't already exist*:

```bash
export PALMIER_LLM_API_KEY=sk-ant-...    # default provider = anthropic (Claude)
# optional: PALMIER_LLM_PROVIDER=openai|moonshot|deepseek, PALMIER_LLM_MODEL=...
echo "A 2-minute intro to prompting for beginners. Slides only." \
  > ~/hgdw-productions/DEMO-1/topic-brief.md
palmier script DEMO-1
```

Use Devin-in-session when a human is steering (most of the time); use the engine drafter when
you want a hands-off pipeline.

---

## CLI walkthrough (every subcommand)

All commands take a `<LESSON_ID>` (except `clear`/`doctor`). Add `-b palmier` or set
`PALMIER_TIMELINE=palmier` for live-timeline commands; default is the `ffmpeg` preview backend.

| Command | Purpose | Key options |
| --- | --- | --- |
| `palmier doctor` | Preflight every dependency before you produce. Exits non-zero if anything fails. | — |
| `palmier init <id>` | Create `~/hgdw-productions/<id>/` seeded with a starter `script.md`. Skips if one exists. | — |
| `palmier script <id>` | Validate `script.md` → `segments.json`. Drafts it via LLM if absent (see above). | — |
| `palmier slides <id>` | Render + verify slide PNGs only. | `--only 03,07` · `--renderer launch\|cdp` |
| `palmier voice <id>` | Generate voiceover + measure real per-segment timing only. | `--only 03,07` |
| `palmier assemble <id>` | Place already-produced assets on the timeline. | `--no-clean` · `--keep-bin` · `-b` |
| `palmier produce <id>` | The full pipeline: script → slides → voice → recording → assemble. | `--no-review` · `--no-placeholders` · `--no-clean` · `--keep-bin` · `-b` |
| `palmier correct <id>` | **Surgically** revise one segment (the revision loop). | `--kind narration\|slide\|recording\|retime` · `--seg <id>` · `--at <m:ss>` |
| `palmier clear` | Reset the Palmier timeline + media bin between takes/lessons. | `--keep-bin` (timeline only) · `-b` |
| `palmier status <id>` | Print every segment with id, timestamp span, and which assets exist. | — |
| `palmier course [id]` | Print the course tree from `course.yaml` (modules → lessons in order with LMS slugs + sort order). With a lesson id, prints just that lesson's placement. Reads only. | `--json` |
| `palmier export <id>` | Render one finished MP4 (ffmpeg flatten + ffprobe verify). Backend-independent. | `-o <path>` · `--tolerance <seconds>` |
| `palmier publish <id>` | Upload the MP4 to Mux → `playback_id`. **Dry run unless `--target mux`.** | `-t mux` · `-f <path>` |
| `palmier moments <id>` | Compile moments → `moments.json` + idempotent `moments.sql`. Never writes a DB. Uses `moments.yaml` if present; else auto-generates from the script (phases → sections, `DO:` → checkpoints) via `course.yaml`. | `--playback-id <id>` |
| `palmier attach <id>` | Land the lesson + moments in the LMS. **Needs `--target api\|supabase` AND `--apply` to write.** | `-t sql\|api\|supabase` · `--apply` · `--playback-id <id>` |
| `palmier attach-course` | Walk `course.yaml` and attach every lesson in sort order. Same gates as `attach`; one lesson failing doesn't stop the rest (exit 1 if any failed). | `-t sql\|api\|supabase` · `--apply` |

**Typical sequences:**

```bash
# First run on a new machine
palmier doctor && palmier init DEMO-1 && palmier produce DEMO-1   # preview MP4

# Iterate on slides only, then re-place on the live timeline
palmier slides DEMO-1 --only 04,05
PALMIER_TIMELINE=palmier palmier assemble DEMO-1

# Fix one narration line in place (no full rebuild)
PALMIER_TIMELINE=palmier palmier correct DEMO-1 --kind narration --seg 07

# Wipe everything between two lessons
PALMIER_TIMELINE=palmier palmier clear

# Deliver a finished lesson (each step is safe / inspectable on its own)
palmier export DEMO-1                                  # one MP4, ffprobe-verified
palmier publish DEMO-1 --target mux                    # → playback_id (real upload)
palmier moments DEMO-1                                 # → moments.json + moments.sql (no writes)
palmier attach DEMO-1 --target api --apply             # real LMS write (both gates + creds)
palmier attach-course --target supabase --apply       # attach the whole course.yaml, in order
```

---

# Part 3 — Resetting between takes (idempotent by default)

Running `assemble`/`produce` against the **palmier** backend is **idempotent**: it clears the
timeline **and** resets the media bin before importing, so the bin always holds exactly the
current lesson's assets. Re-run as many times as you like without stacking duplicates.

```
        ┌─ DEFAULT (assemble / produce) ────────────────────────────────────────────┐
        │  before:  timeline 48 clips / 4 tracks   bin 100 assets   (bloated)         │
        │  action:  clear timeline + reset bin  →  import this lesson                 │
        │  after:   timeline 24 clips / 2 tracks   bin  24 assets   (== this import)  │
        └────────────────────────────────────────────────────────────────────────────┘
```

| Command | Timeline | Media bin | When |
| --- | --- | --- | --- |
| `palmier assemble <id>` / `produce <id>` | cleared, then this lesson | **reset** to this lesson | normal full build (default) |
| `… --keep-bin` | cleared, then this lesson | kept (assets accumulate) | reuse already-imported assets |
| `… --no-clean` | **appended** (stacks) | accumulates | debugging / intentional layering |
| `palmier clear` | cleared | **cleared** | reset between lessons/takes |
| `palmier clear --keep-bin` | cleared | kept | wipe timeline, keep imports |
| `palmier correct <id>` | **surgical** swap of one clip | left as-is | single-asset fix — never wipes the bin |

The single-asset path (`correct`, the swap/replace flow) is intentionally **surgical**: it
removes just the one clip being replaced and re-imports just that asset. Wholesale bin-clearing
doesn't apply there — a stray duplicate from a single swap is harmless.

---

# Part 4 — Deliver: export → publish → attach + moments

Parts 1–3 get a lesson onto the Palmier timeline. Part 4 turns that into a **published lesson in
the LMS**: one flat MP4, hosted on Mux, attached to the right course lesson, with its interactive
**moments**. The four steps are a **strict sequence** (`[SEQ]`) — each one consumes the previous
one's output — but you can stop and inspect after any of them:

```
   export  ─▶  publish  ─▶  moments  ─▶  attach
   one MP4     mux:<id>     *.json/*.sql   LMS rows
   (ffprobe)   (Mux)        (no writes)    (gated)
```

> **Why these are separate commands.** Export and moments are pure/local and always safe.
> Publish and attach are the only steps that touch the outside world, so they are isolated and
> **gated** — you can rehearse the whole chain as dry runs, eyeball the emitted SQL, and only
> then flip the real switches.

## 4.1 The safety model (read before `--apply`)

| Step | Default behavior | What makes it "real" | Extra guard |
| --- | --- | --- | --- |
| `export` | always renders the MP4 locally | n/a (no external effect) | ffprobe drift check vs. the plan |
| `publish` | **dry run** — writes a receipt, uploads nothing | `--target mux` (or `PALMIER_PUBLISH_TARGET=mux`) | needs `MUX_TOKEN_ID` + `MUX_TOKEN_SECRET` |
| `moments` | emits `*.json` + `*.sql` only | n/a (never writes a DB) | SQL is idempotent (`BEGIN/COMMIT`, replace-by-slug) |
| `attach` | **dry run** — emits files, prints what it *would* write | `--target api\|supabase` **AND** `--apply` | refuses without a Mux playback id |

The **two-gate rule** for `attach` is the important one: a real write requires **both** a real
`--target` *and* `--apply`. Either alone (or neither) is a dry run. On top of that, a real write
**throws** if there's no Mux playback id resolved (from `lms/publish.json` or `--playback-id`), so
you can never publish a lesson row pointing at a null video. The reviewable JSON + SQL are written
on **every** run regardless of target, so `sql` (the default) is a complete, safe workflow on its
own: emit → review → run in the Supabase SQL editor yourself.

## 4.2 Authoring `moments.yaml`

Moments live in a **sidecar** `moments.yaml` in the lesson folder (next to `script.md`). You don't
hand-compute timestamps — you anchor each moment to a **segment** (`seg:`, optionally `offset:`
seconds) or an **absolute time** (`at: "m:ss"`), and the engine resolves it against the real
voiceover alignment (the same alignment that drives the timeline).

```yaml
lesson:
  course: ai-mastery            # course slug in the LMS (resolves course_id)
  slug: meet-claude             # lesson slug in the LMS (resolves lesson_id, with course)
  title: Meet Your New Coworker # optional — updates the lesson title
  content: Claude & Cowork 101  # optional — updates the lesson description
sections:                       # → lesson_video_chapters (the chapter rail)
  - { seg: "01", title: "Why Claude" }
  - { at: "1:30", title: "Setup" }
moments:                        # → lesson_moments (the interactive cuepoints)
  - { seg: "04", kind: snippet, title: "Install Claude Code",
      body: "curl -fsSL https://claude.ai/install.sh | sh", copyable: true }
  - { at: "2:10", kind: link, title: "Docs", url: "https://docs.anthropic.com" }
  - { seg: "07", kind: pause, title: "Try it yourself",
      instructions: "Run the command above, then continue.", cta: "I did it — continue" }
```

**Anchor fields** (`sections` and `moments` both accept these):

| Field | Meaning |
| --- | --- |
| `seg: "04"` | anchor to the start of segment `04` (matches the `##` id in `script.md`) |
| `offset: 2.5` | optional seconds added to the segment start |
| `at: "1:30"` | absolute timestamp instead of a segment anchor (`m:ss` or seconds) |

A negative resolved time, or one past the end of the video, is a hard error — so a typo'd anchor
fails loudly instead of producing a broken cuepoint.

**`kind` → LMS mapping** (this is exactly what the SQL/bundle emit):

| `kind` | `lesson_moments` result |
| --- | --- |
| `prompt` | `artifact_kind='prompt'`, `artifact_copyable=true` |
| `snippet` | `artifact_kind='snippet'` (a shell/code block), `artifact_copyable=true` |
| `note` | `artifact_kind='note'`, `artifact_copyable=true` |
| `link` | `artifact_kind='link'` + `artifact_url` |
| `file` | `artifact_kind='file'` + `artifact_url`, `artifact_copyable=false` by default |
| `pause` | `is_checkpoint=true` + `checkpoint_instructions` + `checkpoint_cta_label` (no artifact unless `body` set) |

`sections` entries become `lesson_video_chapters` rows (a coarse "chapter" rail). ABSORB-only
explainer segments deliberately carry **no** moments — moments are for the hands-on tracks.

When you run `palmier moments <id>`, the bundle also sets the lesson's playback fields so the LMS
renders it as an interactive video: `video_url='mux:<playback_id>'`, `lesson_type='video'`,
`player_type='interactive'`, `is_published=true`, `allow_preview=true`.

## 4.3 The `api` attach target (recommended) — endpoint contract

`--target api` POSTs the moments bundle to a small authenticated endpoint **owned by hgdw-lms**,
which wraps the LMS's own `lesson-moments` server actions. This keeps schema + validation in the
app (so the tool never tracks migrations) and means a **scoped token**, not a god-mode service
key, lives on each operator's Mac.

- **Request:** `POST {HGDW_LMS_API_BASE}/api/admin/lessons/moments`
  - Headers: `Authorization: Bearer {HGDW_LMS_API_TOKEN}`, `Content-Type: application/json`
  - Body: the moments **bundle** (`lms/<id>-moments.json`):

    ```jsonc
    {
      "lesson": {
        "course": "ai-mastery", "slug": "meet-claude",
        "title": "Meet Your New Coworker", "content": "…",
        "videoUrl": "mux:abc123", "lessonType": "video",
        "playerType": "interactive", "isPublished": true, "allowPreview": true
      },
      "sections": [ { "title": "Why Claude", "startSeconds": 0.0, "sortOrder": 1 } ],
      "moments":  [ { "startSeconds": 41.2, "title": "Install Claude Code",
                      "artifactKind": "snippet", "artifactBody": "curl … | sh",
                      "artifactCopyable": true, "isCheckpoint": false, "sortOrder": 1 } ]
    }
    ```
  - **Server responsibilities:** authenticate the token, confirm the Mux asset is `ready` before
    flipping `is_published`, resolve `course`+`slug` → `lesson_id`, then upsert the lesson row +
    **replace** its chapters and moments **inside one transaction** (idempotent — safe to re-send).
- **Response (200):**

    ```json
    { "lessonSlug": "meet-claude", "sectionCount": 2, "momentCount": 5 }
    ```
  - The CLI treats any non-2xx as a failure and surfaces the body. `lessonSlug` must be a
    non-empty string; `sectionCount` / `momentCount` default to `0` if omitted.

> The endpoint itself is a **separate, confirmed-next** PR on `hgdw-lms` (target `staging`, no
> production data) — this guide documents the contract the CLI already speaks so the two sides can
> be built independently. Until it exists, use `--target sql` (review + run the SQL) or, as a
> fallback, `--target supabase`.

## 4.4 The `supabase` attach target (fallback)

`--target supabase` writes directly to Supabase via PostgREST with the service key
(`HGDW_SUPABASE_URL` + `HGDW_SUPABASE_SERVICE_KEY`). It resolves `course → lesson`, PATCHes the
lesson row, deletes the lesson's existing chapters + moments, then inserts the new ones. It is the
fastest path but **bypasses app logic and RLS** and couples the tool to the live schema, so prefer
`api`. Same two-gate rule applies (`--target supabase --apply`).

## 4.5 Verify a delivery

- `export`: the JSON report shows `withinTolerance: true` and the expected `durationSeconds` /
  `1920x1080`; or run `ffprobe` on the MP4 yourself.
- `publish`: `lms/publish.json` has a non-null `playbackId` and `status: "ready"`.
- `moments` / `attach` (dry run): open `lms/<id>-moments.sql` — confirm the section + moment rows,
  the `mux:<id>` video_url, and that it's wrapped in `BEGIN; … COMMIT;`.
- `attach --apply`: the result JSON shows `applied: true` and the `sectionCount` / `momentCount`
  the server (or PostgREST) acknowledged.

---

## Gotchas / edge cases (learned in production)

| Symptom | Cause | What the tool does now |
| --- | --- | --- |
| Re-running `assemble` stacks duplicate tracks | each `add_clips` with no `trackIndex` creates a new track | default-clear the timeline first (idempotent) |
| Media bin grows every run (saw 100 entries) | `import_media` has **no dedupe** — same path re-imports | default-reset the bin so it == this import |
| CLI "hangs" after a successful assemble | MCP client kept the Node event loop alive | `assemble`/`produce`/`correct` now `close()` the client → exits in ~0.5s |
| Timing looked off vs. the script | project fps (often **30**) ≠ authored fps (24) | placement reads the **project** fps from `get_timeline` |
| Bin cleanup silently did nothing (early bug) | wrong response shape | `get_media` → `{entries:[…]}`; `delete_media` → `{assetIds:[…]}` |
| `git fetch` hangs on the remote Mac | clone's `origin` has no token → credential prompt | fetch with an authenticated URL + `GIT_TERMINAL_PROMPT=0` |
| Voice not found in the account | voice id/name absent | that segment falls back to a silent hold + is flagged; run continues |

## Verify before declaring done

- `palmier status <id>` — produced assets exist.
- Preview run: `ffprobe` reports the expected duration, `1920x1080`, H.264 + AAC.
- Slides: every entry in the render report is `verified: true` (investigate any `false`).
- Live timeline: read it back (`get_timeline`) and confirm the clip/track counts and the bin
  size match the lesson (e.g. C1 = 24 clips / 2 tracks / 24 bin assets).

---

## Appendix — Driving a remote Mac over SSH

> **Advanced / rarely needed.** For a team, the recommended setup is that each person runs the
> workflow **locally on their own Mac** (Part 2 + the Devin section). This appendix is only for
> a *shared* Mac (e.g. one studio workstation) that you drive from another machine. It was how
> the first C1 lesson was produced against a remote Mac mini.

Because Palmier's MCP is localhost-only, you must run the CLI on the Mac that has Palmier. To do
that from elsewhere, SSH in, put Homebrew on the PATH, pass your key, and run the CLI there:

```bash
SSHOPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=15 -o ServerAliveInterval=30"
ssh $SSHOPTS user@<mac-host> '
  export PATH="/opt/homebrew/bin:$PATH"            # Homebrew is not on the default SSH PATH
  export ELEVENLABS_API_KEY=sk_...                 # pass the key into the remote shell
  cd ~/vibedevview &&
  PALMIER_TIMELINE=palmier node dist/cli.js assemble <LESSON_ID>
'
```

Production assets live on the **remote** Mac under `~/hgdw-productions/<LESSON_ID>/`
(`import_media` needs a path on Palmier's own disk — remote paths won't work). Either run the
full `produce` on that Mac, or `scp` pre-rendered assets over first.

> **macOS Screen Recording (TCC) caveat:** `screencapture` invoked over SSH fails with
> *"could not create image from display"* unless the SSH daemon / Terminal has been granted
> **Screen Recording** permission in *System Settings → Privacy & Security → Screen Recording*.
> Verify timeline state programmatically (read it back via the MCP) rather than screenshotting,
> or film the monitor directly.

> **Tip — local Devin instead of SSH:** rather than SSHing into a shared Mac, you can run
> **Devin CLI on that Mac** and hand it tasks (even via `/handoff` from a cloud session). The
> local agent reaches Palmier directly, which is simpler than managing SSH + PATH + TCC.
