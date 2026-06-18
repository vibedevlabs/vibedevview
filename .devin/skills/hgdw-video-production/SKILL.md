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
- On a **Mac with Palmier Pro open and a project loaded**, drive the real timeline:
  `PALMIER_TIMELINE=palmier palmier produce <LESSON_ID>`. This must run on the **same Mac** as
  Palmier (the MCP is localhost-only at `127.0.0.1:19789`) — a cloud child session on another VM
  cannot reach it.
- `produce` pauses for human review after the script is parsed. Pass `--no-review` for an
  unattended end-to-end run.

## Timeline + media bin behavior (defaults)

- **`assemble`/`produce` clear the timeline AND reset the media bin by default**, then import
  only the current lesson. Re-running is therefore idempotent — it never stacks duplicate tracks
  and the bin holds only this lesson's assets. Opt out with `--no-clean` (place without clearing
  — old stacking behavior) or `--keep-bin` (clear timeline, leave the bin).
- **`palmier clear`** wipes the timeline + bin between takes/lessons (`--keep-bin` = timeline
  only). Use it instead of hand-writing reset scripts.
- **Single-asset paths stay surgical.** `palmier correct` removes just the one old clip and
  re-imports just the new asset — it does NOT clear the timeline or reset the bin. A stray
  duplicate from one swap is harmless.

## Granular steps (for re-runs / corrections)

`palmier script|slides|voice|assemble|correct|status <LESSON_ID>` run individual stages. After
human feedback, `palmier correct <LESSON_ID> --kind <narration|slide|recording|retime> --seg <id>`
re-runs only the affected agent and swaps that one clip.

## Revision → hand off to the revision subagent

For a *focused revision loop* (one piece of human feedback at a time on an already-loaded
lesson), use the dedicated **[`hgdw-revision`](../hgdw-revision/SKILL.md)** skill. It owns the
`feedback → palmier correct → verify one clip` loop, is scoped to surgical swaps only (can't
re-`produce`), never wipes the bin, and gates script-text edits on human approval. Keep the
Producer (this skill) for the clean full build; hand revisions to that subagent. If more than ~3
segments need changing, a full re-`produce` is cleaner than many corrections.

## Edge cases learned in production (don't relearn these)

- **Project fps may differ from the script.** Fresh Palmier projects are often `30` fps even if
  the script authored `24`. Placement reads the **project** fps from `get_timeline` and converts
  seconds→frames with it — never hard-code 24.
- **`import_media` does NOT dedupe.** Re-importing the same path creates a NEW bin entry, so the
  bin bloats across re-runs (saw 76→100 in one session). This is exactly why the default resets
  the bin.
- **Real MCP payload shapes:** `get_media` → `{ entries: [{ id, name, source:{ external:{ absolutePath }}}]}`;
  `delete_media({ assetIds: [...] })`; `remove_clips({ clipIds: [...] })`; `import_media` returns
  the new id inside **text** (`… id: <UUID> …`), parse it out. `add_clips` with `trackIndex`
  omitted auto-creates a new top track each call — that's why re-running without clearing stacks.
- **Close the MCP client after a live op.** The Streamable-HTTP client keeps Node's event loop
  alive; the CLI calls `backend.close?.()` after `assemble`/`produce`/`correct` so it exits in
  ~0.5s instead of hanging. If you script the backend directly, close it yourself.
- **macOS Screen Recording (TCC):** `screencapture` over SSH fails ("could not create image from
  display") unless the SSH daemon/Terminal has Screen Recording permission. Verify the timeline
  by reading it back via MCP, not by screenshotting.
- **Fetching the repo on a Mac with a no-token remote** (avoids a hanging credential prompt):
  `GIT_TERMINAL_PROMPT=0 git fetch -q 'https://<user>:<PAT>@github.com/vibedevlabs/vibedevview.git' <branch> && git reset -q --hard FETCH_HEAD`.
  (A `failed to store: -25308` line is a harmless macOS keychain warning.)
- **Voice never crashes a run.** A missing/unknown voice (or no `ELEVENLABS_API_KEY`) falls back
  to a silent timed hold for that segment and is flagged — the pipeline still completes.

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
