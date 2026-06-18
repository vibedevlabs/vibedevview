# vibedevview — HGDW Video Production System

**Turn a markdown script into a finished, branded educational video — laid out for you on a
[Palmier Pro](https://palmier.app) editing timeline.** You write (or have an AI write) a simple
markdown file describing what each part of the video should say and show. This system does the
rest: it renders on-brand slides, generates a real voiceover, and drops every clip onto the
Palmier timeline in the right order, at the right time. You open Palmier and the video is
already assembled, ready for you to tweak and export.

> **New here? Start at [Part 0 — What this is](#part-0--what-this-is-read-first).** This README
> is written for someone who has never used Palmier, a command line, Devin, or ElevenLabs. You
> do not need to know what any of those are yet. Follow the parts in order and you'll have a
> video on the timeline in under an hour the first time, and in minutes after that.

---

## Table of contents

- [Part 0 — What this is (read first)](#part-0--what-this-is-read-first)
- [Part 1 — Set up your Mac (once)](#part-1--set-up-your-mac-once)
- [Part 2 — Write or generate a script](#part-2--write-or-generate-a-script)
- [Part 3 — Produce the video](#part-3--produce-the-video)
- [Part 4 — Load it onto Palmier (and reset between takes)](#part-4--load-it-onto-palmier-and-reset-between-takes)
- [Part 5 — Revise one piece](#part-5--revise-one-piece)
- [Part 6 — Deliver: export → publish → attach + moments](#part-6--deliver-export--publish--attach--moments)
- [Command reference](#command-reference)
- [Configuration (environment variables)](#configuration-environment-variables)
- [Troubleshooting](#troubleshooting)
- [Going deeper (other docs)](#going-deeper-other-docs)
- [Appendix A — Driving a remote Mac (advanced)](#appendix-a--driving-a-remote-mac-advanced)
- [Development](#development)

---

## Part 0 — What this is (read first)

### The whole workflow, in one picture

```
  ┌──────────────┐     ┌───────────────────────────────────┐     ┌──────────────────────┐
  │  1. SCRIPT   │     │  2. PRODUCE (this tool does it)     │     │  3. PALMIER TIMELINE │
  │              │     │                                     │     │                      │
  │  one .md     │ ──▶ │  • renders branded slides (PNG)     │ ──▶ │  Slides   ▓▓▓▓▓▓▓▓▓▓  │
  │  file you    │     │  • generates voiceover (ElevenLabs) │     │  Voiceover ░░░░░░░░░░ │
  │  write or AI │     │  • makes placeholders for any demos │     │  (clips placed for   │
  │  generates   │     │  • lays every clip on the timeline  │     │   you, in order)     │
  └──────────────┘     └───────────────────────────────────┘     └──────────────────────┘
        YOU                    THE ENGINE + DEVIN                       YOU EDIT & EXPORT
```

Once you're happy with the cut, **Part 6** carries it the rest of the way — export one finished
MP4, publish it to Mux, and attach it (plus its interactive **moments**) to the right lesson in
the LMS:

```
  3. PALMIER TIMELINE  ──▶  EXPORT (one MP4)  ──▶  PUBLISH (Mux)  ──▶  ATTACH + MOMENTS (LMS)
```

The deliver steps are **safe by default** — nothing is uploaded or written to the platform until
you explicitly opt in (see Part 6).

Two facts that explain *everything* else in this guide:

1. **The engine *creates* the media; Palmier only *arranges* it.** Voiceover, slides, and
   recordings are all generated first as files on your Mac. Palmier then imports those files
   and places them on the timeline. That's why you need a (free) ElevenLabs key for the voice
   even though Palmier itself is free and needs no key.
2. **Palmier's automation only works on the same Mac it's running on.** Palmier exposes a local
   control endpoint at `127.0.0.1:19789` ("localhost" = this machine only). So the tool that
   fills your timeline has to run **on your Mac**, right next to Palmier. Good news: that's
   exactly how this is designed, and it means **no servers, no Tailscale, no networking** — it
   all happens locally on your laptop.

### Three ways to run it — pick one

| | **A. Devin (recommended)** | **B. The `palmier` command line** | **C. vibedevview Studio (the app)** |
| --- | --- | --- | --- |
| **Who it's for** | Everyone. You describe what you want in plain English. | People comfortable typing commands. | People who want a GUI — no terminal, see every slide live. |
| **How you drive it** | Open the project in **Devin CLI** or **Devin Desktop**, then say e.g. *"Draft a script for a lesson on prompting, then load it onto Palmier."* | You run `palmier produce <LESSON_ID>` yourself. | Open the desktop app and use buttons: edit → preview → Produce → Revise → Deliver. |
| **Who writes the script** | Devin drafts it from your topic (you approve), or you paste your own. | You write the script, or the engine's built-in drafter does (needs an LLM key). | You edit in structured cards (or raw source), or click **Draft with AI**. |
| **Setup** | Part 1 **+** install Devin (one command). | Part 1 only. | Part 1, then run the app from source (see [`app/README.md`](app/README.md)). |

All three run **entirely on your own Mac** — no remote machine, no Tailscale. They're the same
engine underneath: Devin and Studio both just drive the `palmier` commands for you. We recommend
**A (Devin)** because you never have to remember commands; Devin already knows this workflow (the
repo ships it a skill file). **C (Studio)** is the no-terminal GUI — it wraps the exact same
commands behind an editor + live preview + Produce/Revise/Deliver panels. The rest of this guide
shows the CLI/Devin steps; **where a step differs, look for the 🅰️ Devin and 🅱️ CLI labels, and
the 🖥️ Studio note shows the equivalent in the app.**

### What to expect (so there are no surprises)

- **First-time setup:** ~20–40 min, mostly downloads (Node, Palmier, a browser engine). You do
  this once per Mac.
- **Each video after that:** a script takes minutes to draft; producing + loading a ~2–3 min
  lesson takes a couple of minutes.
- **Cost:** Palmier Pro is free. ElevenLabs has a free tier; long videos may use paid voice
  credits. Devin and the optional script-drafting LLM (Claude/OpenAI) are paid.
- **What you get on the timeline:** a **Slides** video track and a **Voiceover** audio track,
  every clip aligned to the narration. You then trim/polish and export from Palmier.

---

## Part 1 — Set up your Mac (once)

> You only do this once per computer. Copy-paste each block into the **Terminal** app
> (press `Cmd+Space`, type "Terminal", hit Enter). Lines starting with `#` are comments —
> they're ignored, they just explain the next line.

### 1.1 — Install Palmier Pro

1. **Check your macOS version.** Apple menu  → "About This Mac". Palmier Pro needs
   **macOS 26 (Tahoe) or newer**. If you're older, update first (or use Part 3's *preview*
   mode, which needs no Palmier).
2. Download and install Palmier Pro from [palmier.app](https://palmier.app), drag it to
   Applications, and open it once. **It's free** — no account needed for what we use.
3. **Open a project** (File → New). Palmier's automation endpoint is only live while a project
   is open. You'll keep Palmier open with a project whenever you load a video.

### 1.2 — Install the tools the engine needs

```bash
# Homebrew is the macOS package installer. Skip this line if you already have `brew`.
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node (the runtime this tool is built on) and ffmpeg (audio/video processing).
brew install node ffmpeg
```

**What you should see:** `node --version` prints `v20` or higher; `ffmpeg -version` prints a
version line. If `brew` isn't found after installing it, close and reopen Terminal.

### 1.3 — Get this project and build it

```bash
# Download the code.
git clone https://github.com/vibedevlabs/vibedevview
cd vibedevview

# Install its dependencies and compile it.
npm install && npm run build

# Install the headless browser used to render slides.
npx playwright install chromium

# Make the `palmier` command available everywhere (optional but convenient).
npm link
```

**What you should see:** no red error text; `palmier --version` prints a version number. (If
you skipped `npm link`, use `node dist/cli.js` anywhere this guide says `palmier`.)

### 1.4 — Add your ElevenLabs voice key

The voiceover uses [ElevenLabs](https://elevenlabs.io). Create a free account, then
**Profile → API Keys → copy your key.**

Your key looks like `sk_xxxxxxxx…`. In the commands below, **replace the whole word
`PASTE_KEY_HERE` with your key** — don't leave any placeholder text in front of it (a value
like `sk_your_key_heresk_abc…` is the #1 cause of a `doctor` 401):

```bash
# Replace PASTE_KEY_HERE with your actual key (no spaces, no quotes needed).
export ELEVENLABS_API_KEY=PASTE_KEY_HERE

# Make it permanent so you don't re-do this every terminal session:
echo "export ELEVENLABS_API_KEY=$ELEVENLABS_API_KEY" >> ~/.zshrc
```

> Verify it took — this should print your key, with no `sk_your_key_here`/`PASTE_KEY_HERE`
> prefix: `echo "$ELEVENLABS_API_KEY"`. If `palmier doctor` still says `auth failed (401)`,
> the value is wrong (usually a leftover placeholder) — re-run the `export` with only the key.

> **The default voice is "Ja'dan"** (set in each script's frontmatter). It must exist in the
> ElevenLabs account your key belongs to. To use a different voice for a run, set
> `PALMIER_VOICE="<voice name or id>"`. If a voice can't be found, that segment becomes a silent
> hold and is flagged — **the production never crashes over a voice.**

### 1.5 — Run the preflight check

```bash
palmier doctor
```

This checks Node, ffmpeg, the browser engine, your ElevenLabs key + voice, and whether Palmier
is reachable. **Every line should say `ok`.** If one says `FAIL`, it prints the exact fix
underneath — do that, then re-run `doctor`. Don't move on until it's clean. (The Palmier line is
allowed to be "not running" unless you're doing a live-timeline run.)

### 1.6 — (Recommended path A only) Install Devin

If you want to drive everything by just *describing* what you want, install Devin so it runs
locally on your Mac (it can then reach Palmier and run this tool for you):

```bash
# Devin CLI — runs in your terminal.
curl -fsSL https://cli.devin.ai/install.sh | bash
#   …or via Homebrew:
brew install --cask devin-cli
```

Prefer a full app? Install **Devin Desktop** (an AI IDE that bundles the same local agent) and
enable the CLI from inside it via `Cmd+Shift+P → "Install Devin CLI"`. Docs:
[Devin CLI](https://docs.devin.ai/cli) · [Devin Desktop](https://docs.devin.ai/desktop/getting-started).

That's the whole one-time setup. **From here on it's just: script → produce → load.**

---

## Part 2 — Write or generate a script

A lesson is **one markdown file** called `script.md`. It has a short header (the lesson's name
and voice) and then a list of **segments** — each segment is one beat of the video with what to
**SAY** (narration) and what to **SLIDE** (the on-screen frame). Here's the smallest real example:

```markdown
---
lesson: DEMO-1
title: My First Lesson
voice: Ja'dan
---

## 01 · Cold open
phase: SOURCE
duration: 9

SAY:
By the end of this lesson you'll know exactly how this works.

SLIDE:
```yaml
frame: N1-title
title: My First Lesson
subtitle: A 90-second tour
```
```

There are **16 slide frame types** (title cards, bullet lists, quotes, comparisons, code, big
stats, callouts, an outro, and more). The full field-by-field reference and worked examples are
in **[`docs/OPERATOR-GUIDE.md`](docs/OPERATOR-GUIDE.md)** (authoring) and
**[`HGDW-DESIGN.md`](HGDW-DESIGN.md)** (the brand + frames). You have three ways to produce a script:

### 🅰️ Option A — Have Devin draft it (recommended default)

Open the project in Devin and describe the lesson. Devin writes the script in this exact format,
shows it to you for approval, and (on your go-ahead) produces and loads it. Example of what you'd say:

> *"Draft a script for an HGDW lesson titled 'Prompting Basics' — about 2 minutes, slides only,
> Ja'dan voice. Walk me through the segments before producing."*

This is the recommended path because Devin already knows the segment format and the 16 frames
(from the repo's skill file), and it keeps you in plain English. You stay in control: **Devin
never finalizes script content without your approval.**

### Option B — Write it by hand

Create your own `script.md` following the format above. Start from a seeded example:

```bash
palmier init DEMO-1          # writes a starter script.md into ~/hgdw-productions/DEMO-1/
open ~/hgdw-productions/DEMO-1/script.md
```

Edit the `SAY:` narration and `SLIDE:` blocks, save, and go to Part 3.

### Option C — Let the engine's built-in drafter write it

The CLI can also draft a script from a one-paragraph **topic brief** using an LLM (Anthropic
Claude by default — this is the same "Claude" capability, just driven by the engine). Set a key
once, drop a `topic-brief.md` in the lesson folder, then run `palmier script`:

```bash
export PALMIER_LLM_API_KEY=sk-ant-...        # Anthropic key (default provider = Claude)
# optional: PALMIER_LLM_PROVIDER=openai|moonshot|deepseek  and  PALMIER_LLM_MODEL=...

mkdir -p ~/hgdw-productions/DEMO-1
echo "A 2-minute intro to prompting for beginners. Slides only." > ~/hgdw-productions/DEMO-1/topic-brief.md
palmier script DEMO-1                        # drafts + validates script.md
```

> **Important:** the drafter only writes `script.md` **if one doesn't already exist** — your
> hand-edited script is always the source of truth and is never overwritten.

> **🖥️ Studio:** open the app, pick the lesson, and edit in structured **segment cards** (one
> card per slide, with a SAY box) or flip to **`</>` Source** for raw markdown — every change
> re-renders the live slide preview instantly. **Draft with AI** is Option C from a topic brief.

---

## Part 3 — Produce the video

"Producing" runs the whole engine: it renders every slide, generates the voiceover, makes a
labeled placeholder for any screen-recording segments, and assembles the result.

### 🅱️ CLI

```bash
# Preview MP4 — works on ANY Mac, no Palmier needed. Great for a first run.
palmier produce DEMO-1
open ~/hgdw-productions/DEMO-1/videos/DEMO-1-preview.mp4
```

You'll watch the steps stream by: script parsed → slides rendered + **verified one by one** →
voiceover generated → assembled. The preview MP4 is proof the whole pipeline works on your Mac.

### 🅰️ Devin

Just ask: *"Produce DEMO-1 as a preview so I can check it,"* or skip straight to loading it onto
Palmier (Part 4).

> **What each agent does (so the logs make sense):** **Script** turns your markdown into
> segments; **Slides** renders each frame as a branded PNG and verifies it actually rendered;
> **Voice** calls ElevenLabs and measures the real clip length (that length, not your
> `duration:`, is what aligns the timeline); **Recording** makes a placeholder for any `DO:`
> segment instead of ever faking footage.

> **🖥️ Studio:** click **Produce** (the backend selector picks *ffmpeg (preview)* or *palmier
> (Mac)*). The status bar streams the same script → slides → voice → assemble events live.

---

## Part 4 — Load it onto Palmier (and reset between takes)

This is the payoff: the clips appear on your real Palmier timeline. **Open Palmier Pro with a
project**, then:

### 🅱️ CLI

```bash
PALMIER_TIMELINE=palmier palmier produce DEMO-1     # full build → load
# or, if you already produced the assets and just want to (re)place them:
PALMIER_TIMELINE=palmier palmier assemble DEMO-1
```

### 🅰️ Devin

*"Load DEMO-1 onto the Palmier timeline."* Devin runs the same thing locally and reads the
timeline back to confirm.

### What happens on the timeline — and why re-running is safe

By **default**, every load **clears the timeline and resets the media bin first**, then imports
only this lesson. So you can re-run as many times as you want — it never stacks duplicate tracks
and the bin only ever holds the current lesson's files.

```
   DEFAULT load (produce / assemble):
   before:  timeline 48 clips / 4 tracks   ·  bin 100 files   (messy from earlier takes)
   action:  clear timeline  +  reset bin   →  import THIS lesson
   after:   timeline 24 clips / 2 tracks   ·  bin  24 files   (== exactly this lesson)
```

If you ever need different behavior:

| You want… | Use |
| --- | --- |
| Normal clean load (default) | `palmier produce <id>` / `palmier assemble <id>` |
| Clear timeline but **keep** already-imported files in the bin | `… --keep-bin` |
| Add on top **without** clearing (intentional layering) | `… --no-clean` |
| Wipe the timeline **and** bin between lessons | `palmier clear` |
| Wipe only the timeline, keep the bin | `palmier clear --keep-bin` |

---

## Part 5 — Revise one piece

After a lesson is on the timeline, you usually only need to fix *one* thing — a typo on a slide,
re-record one line, swap a frame. That's a **surgical** operation: it changes just that one clip
and leaves everything else (and the bin) alone.

### 🅱️ CLI

```bash
PALMIER_TIMELINE=palmier palmier correct DEMO-1 --kind slide --seg 04
# kinds: narration | slide | recording | retime ;  locate by --seg <id> or --at <m:ss>
```

### 🅰️ Devin

*"There's a typo on the slide around 1:23 — fix just that one."* Devin uses the dedicated
**revision** skill: it finds the segment, gets your approval before changing any wording, swaps
the single clip, and verifies only that clip changed. It will **not** rebuild the whole lesson
for a one-line fix. (See [`.devin/skills/hgdw-revision`](.devin/skills/hgdw-revision/SKILL.md).)

> **🖥️ Studio:** select the segment, click **Revise**, and pick what changed (narration / slide
> / recording / retime). If your edit changes `script.md`, Studio shows the diff and requires
> explicit approval before it writes and re-renders just that one segment.

---

## Part 6 — Deliver: export → publish → attach + moments

Parts 1–5 get a lesson onto the Palmier timeline. **Part 6 turns it into a finished, published
lesson** in the LMS: one flat MP4, hosted on Mux, attached to the right course lesson, with its
interactive **moments** (sections, pause-points, copy-paste prompts, links). Each step is its own
command so you can stop and check after any of them.

```
   export            publish              moments / attach
 ┌─────────┐      ┌───────────┐        ┌──────────────────────┐
 │ one MP4 │ ───▶ │ Mux video │ ─────▶ │ LMS lesson + moments │
 └─────────┘      └───────────┘        └──────────────────────┘
  ffprobe-          playback_id          sections · pauses ·
  verified          (mux:<id>)           prompts · links
```

> **Safety first.** Publishing and attaching are the only steps that can touch the outside world,
> so they are **safe by default**: `publish` is a *dry run* unless you pick a real target, and
> `attach` only writes to the platform when you pass **both** `--target` **and** `--apply`. With no
> flags, both just tell you what they *would* do and write reviewable files — nothing is uploaded
> and no database is changed.

### 6.1 Export — render one finished MP4

```bash
palmier export DEMO-1
# → ~/hgdw-productions/DEMO-1/videos/DEMO-1.mp4   (also prints a JSON report)
```

Flattens the lesson's slides + voiceover into a single H.264/AAC MP4 and verifies it with
`ffprobe`. Works regardless of which backend you used to assemble — it always renders with ffmpeg,
so you don't need Palmier open for this step. The JSON report includes `durationSeconds`,
`driftSeconds`, and `withinTolerance` so you can confirm the file matches the plan.

### 6.2 Publish — upload to Mux

```bash
palmier publish DEMO-1                 # DRY RUN — uploads nothing, writes a receipt
palmier publish DEMO-1 --target mux    # real upload (needs MUX_TOKEN_ID + MUX_TOKEN_SECRET)
```

Uploads the exported MP4 to **Mux** via Direct Upload and waits for the asset to be `ready`,
returning a `playback_id`. The LMS stores this as `video_url = mux:<playback_id>`. The result is
saved to `lms/publish.json` so later steps can pick the playback id up automatically.

### 6.3 Moments — author the interactive layer

Moments are authored in a **`moments.yaml`** sidecar next to your script (in the lesson folder).
You anchor each one to a segment (`seg:`) or an absolute time (`at:`), and the engine resolves it
to a real timestamp using the voiceover alignment:

```yaml
lesson:
  course: ai-mastery          # course slug in the LMS
  slug: meet-claude           # lesson slug in the LMS
sections:                     # → lesson_video_chapters (the chapter rail)
  - { seg: "01", title: "Why Claude" }
  - { at: "1:30", title: "Setup" }
moments:                      # → lesson_moments (the interactive cuepoints)
  - { seg: "04", kind: snippet, title: "Install", body: "curl -fsSL … | sh", copyable: true }
  - { at: "2:10", kind: link, title: "Docs", url: "https://docs.anthropic.com" }
  - { seg: "07", kind: pause, title: "Try it yourself",
      instructions: "Run the command, then continue.", cta: "I did it — continue" }
```

| Authoring `kind` | Becomes in the LMS |
| --- | --- |
| `prompt` / `snippet` / `note` | a copy-paste artifact (`artifact_kind`, `artifact_body`) |
| `link` | a link artifact (`artifact_url`) |
| `file` | a downloadable file artifact (`artifact_url`, not copyable by default) |
| `pause` | a **checkpoint** (`is_checkpoint=true` + instructions + CTA label) |
| `sections:` entry | a **section** in `lesson_video_chapters` |

```bash
palmier moments DEMO-1
# → lms/DEMO-1-moments.json  +  lms/DEMO-1-moments.sql   (dry run, never touches a DB)
```

This always just **emits files**: a JSON bundle (what the Electron app / `api` target sends) and an
**idempotent** `moments.sql` (wrapped in `BEGIN/COMMIT`, resolves the lesson by slug, replaces its
sections + moments — safe to re-run). The safest way to ship is to review that SQL and run it in the
Supabase SQL editor yourself.

### 6.4 Attach — write it into the LMS

`attach` takes the same bundle and lands it on the platform. There are **three targets**, layered
from safest to most direct:

| `--target` | How it lands | Creds (local env) | When to use |
| --- | --- | --- | --- |
| `sql` *(default)* | emits `moments.sql` for you to run | none | always safe; the manual last step |
| `api` *(recommended)* | `POST`s the bundle to an authenticated hgdw-lms endpoint that wraps the LMS's own server actions | `HGDW_LMS_API_BASE` + `HGDW_LMS_API_TOKEN` | the real automated path — validation + schema stay in the LMS |
| `supabase` *(fallback)* | direct PostgREST write with the service key | `HGDW_SUPABASE_URL` + `HGDW_SUPABASE_SERVICE_KEY` | only when no endpoint exists yet; bypasses app logic + RLS |

```bash
palmier attach DEMO-1                      # sql/dry-run: emits files, no writes
palmier attach DEMO-1 --target api         # still a DRY RUN (no --apply) — prints what it WOULD send
palmier attach DEMO-1 --target api --apply # the real write (needs creds + a published Mux id)
```

**Both gates are required for a real write:** a real `--target` (`api`/`supabase`) **and** `--apply`.
A real write also refuses to run without a Mux playback id (so you never publish a lesson with a
null video — `publish` first). The reviewable JSON + SQL files are written every time, regardless of
target. See the [Operator Guide](docs/OPERATOR-GUIDE.md#part-4--deliver-export--publish--attach--moments)
for the full safety model and the `api` endpoint request/response contract.

> **🖥️ Studio:** the **Deliver** panel runs this chain in **dry-run only**: it exports the MP4
> (with the ffprobe verdict), previews the Mux publish, and shows the moments + LMS SQL it *would*
> write — uploading nothing and changing no database. A real publish (`--target mux`) or real
> attach (`--target api|supabase --apply`) stays a deliberate CLI / Devin step, so the GUI can
> never trip the two-gate write.

---

## Command reference

Run any command with `--help` for its options. Live-timeline commands need
`PALMIER_TIMELINE=palmier` and Palmier open with a project.

| Command | What it does |
| --- | --- |
| `palmier doctor` | Preflight: Node, ffmpeg, ffprobe, Chromium, ElevenLabs key + voice, Palmier reachable. |
| `palmier init <id>` | Create the lesson folder seeded with a starter `script.md`. |
| `palmier script <id>` | Validate `script.md` → `segments.json` (or draft it via LLM if none exists). |
| `palmier slides <id>` | Render + verify the slide PNGs only. `--only 03,07` for specific segments. |
| `palmier voice <id>` | Generate the voiceover + measure per-segment timing only. |
| `palmier produce <id>` | The full pipeline. `--no-review` to skip the review pause; `--no-placeholders` to skip recording placeholders; `--no-clean` / `--keep-bin` (see Part 4). |
| `palmier assemble <id>` | (Re)place already-produced assets on the timeline. `--no-clean` / `--keep-bin`. |
| `palmier correct <id>` | Surgically revise one segment. `--kind narration\|slide\|recording\|retime` + `--seg <id>` or `--at <m:ss>`. |
| `palmier clear` | Reset the Palmier timeline + media bin between takes/lessons. `--keep-bin` = timeline only. |
| `palmier status <id>` | List every segment with its id, timestamp span, and which assets exist. |
| `palmier export <id>` | Render one finished MP4 (ffmpeg flatten + ffprobe verify). `-o <path>`, `--tolerance <seconds>`. |
| `palmier publish <id>` | Upload the MP4 to Mux → `playback_id`. **Dry run by default**; `--target mux` to upload; `-f <path>`. |
| `palmier moments <id>` | Compile `moments.yaml` → `moments.json` + idempotent `moments.sql`. Never writes a DB. `--playback-id <id>`. |
| `palmier attach <id>` | Land the lesson + moments in the LMS. **Safe by default**; needs `--target api\|supabase` **and** `--apply` to write. `--playback-id <id>`. |

Pick the backend per run with `-b ffmpeg` (preview MP4) or `-b palmier` (live timeline), or set
`PALMIER_TIMELINE` once (see below).

Add `--json` to any command for machine-readable output: `produce`/`correct` stream NDJSON
progress events (`phase`, `slide.rendered`, `voice.done`, `assemble.placed`, then a final
`result`), and `doctor`/`status`/`script` print a single JSON object. This is the stream
**vibedevview Studio** (the [desktop app](app/README.md)) consumes — so if you'd rather not use
the terminal at all, run Studio instead and it drives these same commands for you.

---

## Configuration (environment variables)

| Variable | Default | Purpose |
| --- | --- | --- |
| `ELEVENLABS_API_KEY` | — | ElevenLabs TTS. Without it, voiceover falls back to silent timed holds. |
| `PALMIER_VOICE` | the script's `voice:` | Override the voice for a run (name or raw ElevenLabs id). |
| `PALMIER_TIMELINE` | `ffmpeg` | Set to `palmier` to drive the live Palmier timeline by default. |
| `PALMIER_MCP_URL` | `http://127.0.0.1:19789/mcp` | Palmier's local control endpoint. |
| `PALMIER_PRODUCTIONS_DIR` | `~/hgdw-productions` | Where lesson folders + assets are written. |
| `PALMIER_LLM_API_KEY` | — | Enables the engine's built-in script drafter (Option C). |
| `PALMIER_LLM_PROVIDER` | `anthropic` | `anthropic` (Claude) · `openai` · `moonshot` · `deepseek`. |
| `PALMIER_LLM_MODEL` | provider default | e.g. `claude-3-7-sonnet-latest`, `gpt-4o`. |
| `PALMIER_PUBLISH_TARGET` | `dryrun` | Set to `mux` to make `palmier publish` upload for real by default. |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` | — | Mux API credentials, required for a real `publish --target mux`. |
| `PALMIER_ATTACH_TARGET` | `sql` | Default `attach` target: `sql` (safe) · `api` · `supabase`. Still needs `--apply` for a real write. |
| `HGDW_LMS_API_BASE` / `HGDW_LMS_API_TOKEN` | — | Base URL + scoped bearer token for the `api` attach target (recommended). |
| `HGDW_SUPABASE_URL` / `HGDW_SUPABASE_SERVICE_KEY` | — | Project URL + service key for the `supabase` attach fallback (bypasses RLS). |

See [`.env.example`](.env.example) for a copy-paste starting point.

---

## Troubleshooting

| Symptom | Why | Fix |
| --- | --- | --- |
| `palmier doctor` says ElevenLabs `auth failed (401)` | the key value is wrong — usually a leftover placeholder, e.g. `sk_your_key_heresk_…` from pasting after the example | re-run `export ELEVENLABS_API_KEY=<only your key>`; verify with `echo "$ELEVENLABS_API_KEY"` (no placeholder prefix) |
| `palmier doctor` says ElevenLabs voice not found | the voice isn't in your key's account | use `PALMIER_VOICE="<a voice you own>"`, or add the voice in ElevenLabs |
| Voice line is silent in the output | no/invalid `ELEVENLABS_API_KEY`, or voice missing | set the key; the run still completes with timed silent holds (and flags it) |
| Studio: `npm run dev` fails with `Error: Electron uninstall` or `dyld: … Electron Framework.framework … no such file` | Electron's binary didn't install/extract cleanly (skipped postinstall, or a half-unpacked `.app`) | see [`app/README.md`](app/README.md) → Troubleshooting (`node_modules/electron/install.js`, or re-extract the official zip with `ditto` + write `path.txt`) |
| Palmier line in `doctor` says "not running" | Palmier isn't open with a project | open Palmier Pro → New project (only needed for live-timeline runs) |
| Clips don't appear on the timeline | wrong backend | add `PALMIER_TIMELINE=palmier` (or `-b palmier`) and confirm Palmier is open |
| Re-running stacked duplicate tracks | you used `--no-clean` | re-run without it — the default clears first |
| Timing looks slightly off vs. your `duration:` | the real voiceover length wins over `duration:` | expected — `SAY:` narration is the timing authority |
| `command not found: palmier` | you skipped `npm link` | use `node dist/cli.js …`, or run `npm link` in the repo |
| `palmier publish` uploaded nothing | it's a dry run by default | add `--target mux` (and set `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET`) |
| `palmier attach` didn't write to the LMS | safe by default — needs both gates | pass `--target api` (or `supabase`) **and** `--apply`, with creds set |
| attach refuses: "no Mux playback id" | attaching would publish a lesson with no video | run `palmier publish <id> --target mux` first, or pass `--playback-id` |

For more edge cases and the reasoning behind the defaults, see the
[Operator Guide](docs/OPERATOR-GUIDE.md#gotchas--edge-cases-learned-in-production).

---

## Going deeper (other docs)

| Doc | What's in it |
| --- | --- |
| [`docs/OPERATOR-GUIDE.md`](docs/OPERATOR-GUIDE.md) | Full authoring reference (all 16 frames + examples), the complete CLI walkthrough, **Devin's role / agent topology**, reset behavior, and production gotchas. |
| [`HGDW-DESIGN.md`](HGDW-DESIGN.md) | The brand system — wordmark, palette, typography, video spec, and the 16 frame types. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | How the Orchestrator + agents work (they coordinate only through files). |
| [`app/`](app) — **vibedevview Studio** | The desktop app that wraps the engine: structured script editor + live slide preview + produce/revise + deliver, no terminal needed. MVP (E0–E3, plus the Deliver panel) is built; see [`app/README.md`](app/README.md) to run it. |
| [`docs/ELECTRON-APP.md`](docs/ELECTRON-APP.md) | Design & build spec + as-built notes for the desktop app: UI wireframes, the engine integration contract (`--json` event stream + IPC), the Deliver chain, the Palmier AI ("Claude") integration, the Revise→`correct` contract, and a per-team [SEQ]/[PAR] plan with milestones. |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Phased build plan with per-team ownership. |
| [`.devin/skills/`](.devin/skills/) | The skills local Devin auto-loads: `hgdw-video-production` (produce) and `hgdw-revision` (surgical fixes). |

---

## Appendix A — Driving a remote Mac (advanced)

> **Most teams should ignore this.** The whole point is that each person runs the workflow on
> **their own Mac** (Parts 1–5) — no networking required. This appendix is only for the rare
> case of a *shared* Mac (e.g. one studio workstation) that you drive from elsewhere.

Because Palmier's endpoint is localhost-only, you must run the CLI **on the Mac that has
Palmier**. To do that from another machine, SSH in, put Homebrew on the path, pass your key, and
run the CLI there:

```bash
ssh user@<mac-host> '
  export PATH="/opt/homebrew/bin:$PATH"     # Homebrew is not on the default SSH PATH
  export ELEVENLABS_API_KEY=sk_...
  cd ~/vibedevview &&
  PALMIER_TIMELINE=palmier node dist/cli.js assemble <LESSON_ID>
'
```

Assets must live on **that** Mac's disk (Palmier imports by local path), so run the full
`produce` there or copy assets over first. Note: macOS blocks `screencapture` over SSH unless
the SSH daemon has **Screen Recording** permission (*System Settings → Privacy & Security*) — so
verify the timeline by reading it back, not by screenshotting. Full details in the
[Operator Guide](docs/OPERATOR-GUIDE.md#appendix--driving-a-remote-mac-over-ssh).

---

## Development

```bash
npm run typecheck     # tsc --noEmit (this repo's lint gate)
npm run build         # compile to dist/
npm test              # vitest — parser, alignment, plan, voices, backend
npm run palmier -- doctor   # run the CLI from source without building
```

### Desktop app (vibedevview Studio)

The Electron app lives in [`app/`](app) and is a thin client of this engine (it spawns
`dist/cli.js --json`). Build the engine first (`npm run build` above), then:

```bash
cd app
npm install
npm run dev          # launch the app (Electron)
npm run preview:web  # or: renderer-only in a browser, engine actions disabled
```

If `npm run dev` fails with `Error: Electron uninstall` or `dyld: … Electron Framework.framework`,
Electron's binary didn't install cleanly — see the Troubleshooting section in
[`app/README.md`](app/README.md) for the fix. Full setup, scripts, and layout live there too.
