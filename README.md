# vibedevview — HGDW Video Production System

A multi-agent system that turns a markdown **script** into a finished educational video,
assembled on a [Palmier Pro](https://palmier.app) timeline (macOS) or rendered to a preview
MP4 anywhere via ffmpeg.

It implements the HGDW production spec: an **Orchestrator** coordinates four agents — **Script**,
**Slides**, **Voice**, and **Recording** — that never talk to each other directly. They
coordinate through files in a shared working directory, exactly like a real edit bay.

```
script.md ─▶ Script Agent ─▶ segments.json
                               ├─▶ Slides Agent  ─▶ slides/*.png   (branded, verified)
                               ├─▶ Voice Agent   ─▶ audio/*.mp3    (ElevenLabs TTS)
                               └─▶ Recording Agent ─▶ recordings/*.mov (or labeled placeholder)
                                               │
                              Orchestrator ─▶ timeline + alignment ─▶ ┌ Palmier Pro (iMac/Mac)
                                                                      └ ffmpeg preview MP4 (anywhere)
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full design and diagrams,
[`HGDW-DESIGN.md`](HGDW-DESIGN.md) for the brand system + 16 slide frame types, and
[`docs/ROADMAP.md`](docs/ROADMAP.md) for the phased build plan.

---

## Quickstart (macOS)

Works on a **personal Mac with no Palmier Pro** — it uses the ffmpeg preview backend and
produces a real MP4 you can watch. The same commands run on the **iMac workstation**; the only
difference is one env var to drive the live Palmier timeline (see below).

```bash
# 1. prerequisites
brew install node ffmpeg            # Node 20+ and ffmpeg/ffprobe

# 2. get the code + build
git clone https://github.com/vibedevlabs/vibedevview
cd vibedevview
npm install && npm run build
npx playwright install chromium     # headless browser used to render slides
npm link                            # puts the `palmier` command on your PATH

# 3. your ElevenLabs key (the Ja'dan voice lives in this account)
export ELEVENLABS_API_KEY=sk_...

# 4. preflight — verifies node / ffmpeg / chromium / your key+voice / Palmier MCP
palmier doctor

# 5. produce the sample lesson
palmier init B-AB1                  # seeds an editable script.md into ~/hgdw-productions/B-AB1
palmier produce B-AB1               # → ~/hgdw-productions/B-AB1/videos/B-AB1-preview.mp4
```

Open the resulting `B-AB1-preview.mp4`. That's the whole pipeline: parsed script → branded +
verified slides → Ja'dan voiceover → placeholder for the screen-recording segment → assembled video.

> **Voice:** the example script sets `voice: Ja'dan`, so no extra flags are needed. To override
> per run use `PALMIER_VOICE="<name or ElevenLabs id>"`. If a voice isn't found in your account,
> that segment falls back to a silent hold of the estimated duration and is flagged — the
> production never aborts.

---

## On the iMac workstation (live Palmier timeline)

With **Palmier Pro open** (it exposes an MCP server at `127.0.0.1:19789`), point the backend at it:

```bash
PALMIER_TIMELINE=palmier palmier produce B-AB1
```

Everything else is identical. The Orchestrator imports each slide / recording / voiceover clip
onto the **Slides**, **Recordings**, and **Voiceover** tracks at its computed timestamp, then
notifies you to review the draft on the timeline.

---

## Commands

| Command | What it does |
| --- | --- |
| `palmier doctor` | Preflight: Node, ffmpeg, ffprobe, Chromium, ElevenLabs key + voice, Palmier MCP. |
| `palmier init <lesson>` | Seed a working dir + starter `script.md` for a lesson. |
| `palmier produce <lesson>` | Full pipeline → preview MP4 (or live Palmier timeline). |
| `palmier script <lesson>` | (Re)parse `script.md` → `segments.json`. |
| `palmier slides <lesson>` | Render + verify slide PNGs only. |
| `palmier voice <lesson>` | Generate voiceover + per-segment durations only. |
| `palmier assemble <lesson>` | Build the timeline from existing assets. |
| `palmier correct <lesson>` | Apply a feedback note and re-run affected agents. |
| `palmier status <lesson>` | Show what's produced so far. |

Add `--no-review` to `produce` to skip the human-review pause (used for end-to-end runs).

---

## The script format

A lesson is one markdown file. Frontmatter sets the lesson metadata; each `##` heading is a
segment with optional `SAY:` (narration), `SLIDE:` (a YAML slide spec), and `DO:` (recording steps).

    ---
    lesson: B-AB1
    title: Build With AI
    voice: Ja'dan
    ---

    ## 01 · Cold open
    phase: SOURCE
    duration: 9

    SAY:
    By the end of this session you will do three things.

    SLIDE:
    ```yaml
    frame: N1-title
    title: Build With AI
    subtitle: Specs, Agents & the Build Loop
    ```

(Indented above for display; in a real `script.md` the `SLIDE:` block is a normal
triple-backtick ` ```yaml ` fence.) The 16 available `frame` types are documented in [`HGDW-DESIGN.md`](HGDW-DESIGN.md).

---

## Configuration (env vars)

| Var | Default | Purpose |
| --- | --- | --- |
| `ELEVENLABS_API_KEY` | — | ElevenLabs TTS. Without it, voiceover falls back to estimates. |
| `PALMIER_VOICE` | script's `voice` | Override the voice for a run (name or raw id). |
| `PALMIER_TIMELINE` | `ffmpeg` | `palmier` to drive the live Palmier Pro timeline. |
| `PALMIER_MCP_URL` | `http://127.0.0.1:19789/mcp` | Palmier Pro MCP endpoint. |
| `PALMIER_PRODUCTIONS_DIR` | `~/hgdw-productions` | Where productions are written. |

See [`.env.example`](.env.example).

---

## Development

```bash
npm run typecheck     # tsc --noEmit
npm run build         # compile to dist/
npm test              # vitest (parser, alignment, plan, voices)
npm run palmier -- doctor   # run the CLI from source without building
```
