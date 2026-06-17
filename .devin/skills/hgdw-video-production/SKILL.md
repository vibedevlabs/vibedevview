---
name: hgdw-video-production
description: Produce an HGDW educational video from a markdown script using the vibedevview multi-agent pipeline (Script → Slides → Voice → Recording → Orchestrator). Use when asked to create, produce, draft, or assemble an HGDW lesson video, render branded slides, generate voiceover, or put a draft on the Palmier Pro timeline.
---

# HGDW Video Production

This repo is the engine. A production turns one markdown `script.md` into a finished video,
either as an ffmpeg preview MP4 (any machine) or on a live Palmier Pro timeline (iMac/Mac with
Palmier Pro open). Agents coordinate **only** through files in the working directory — never call
one agent's output another's input directly; let the Orchestrator sequence them.

## Setup (once per machine)

```bash
npm install && npm run build
npx playwright install chromium     # required to render slides
export ELEVENLABS_API_KEY=...        # ElevenLabs key with the desired voices
node dist/cli.js doctor              # or: npm link && palmier doctor
```

`palmier doctor` must pass (Node ≥20, ffmpeg, ffprobe, Chromium, ElevenLabs key+voice). If a
check fails, fix it before producing — do not proceed past a failing preflight.

## Produce a lesson

```bash
palmier init <LESSON_ID>            # seeds working dir + starter script.md (skip if it exists)
# edit ~/hgdw-productions/<LESSON_ID>/script.md as needed
palmier produce <LESSON_ID>         # full pipeline → videos/<LESSON_ID>-preview.mp4
```

- Default voice is whatever the script frontmatter `voice:` says (the B-AB1 example uses `Ja'dan`).
  Override per run with `PALMIER_VOICE="<name or ElevenLabs id>"`.
- On the **iMac with Palmier Pro open**, drive the real timeline: `PALMIER_TIMELINE=palmier palmier produce <LESSON_ID>`.
- `produce` pauses for human review after the script is parsed. Pass `--no-review` for an
  unattended end-to-end run.

## Granular steps (for re-runs / corrections)

`palmier script|slides|voice|assemble|correct|status <LESSON_ID>` run individual stages. After
human feedback, `palmier correct <LESSON_ID>` re-runs only the affected agent.

## Hard rules (do not violate)

1. Never fake a screen recording. If you can't capture one, the Recording Agent emits a **labeled
   placeholder** (a `D1` dark frame naming the app) and flags it — never synthesize footage.
2. Never use ffmpeg `-shortest` (it cuts audio); always encode with an explicit `-t <duration>`.
3. Never identify recording order from filenames — use content.
4. Never skip slide verification, and verify **each slide individually**, not in a batch.
5. Never edit `script.md` to "fix" content without human approval — flag it.

## Verify before declaring done

- `palmier status <LESSON_ID>` shows produced assets.
- For a preview run, confirm `videos/<LESSON_ID>-preview.mp4` exists and `ffprobe` reports the
  expected duration, 1920x1080, H.264 + AAC.
- Slides: every entry in the render report should be `verified: true`. Investigate any `false`.
