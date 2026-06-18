---
name: hgdw-revision
description: Revise a single segment of an already-produced HGDW lesson on the live Palmier timeline — fix a typo on a slide, re-record narration, swap a frame, or retime a clip. Use AFTER a lesson has been produced/loaded, when the human gives feedback on one part of the video. This is the surgical revision loop; it never re-produces the whole lesson and never wipes the media bin.
---

# HGDW Revision (subagent)

This is the **focused revision loop** for a lesson that is already produced and on the
timeline. It is deliberately narrow: take one piece of human feedback, change exactly the
segment(s) it refers to, swap that clip in place, and verify. Nothing else.

Run this **on the same Mac as Palmier Pro** (the live timeline is at `127.0.0.1:19789`,
localhost-only). It is a *local* subagent — a cloud Devin session on a separate VM cannot
reach the Mac's Palmier or its on-disk assets, so revision must happen where the lesson lives.

## When to use vs. not

| Use `hgdw-revision` when… | Do NOT use it when… |
| --- | --- |
| "Fix the typo on the slide at 1:23" | You want to rebuild the whole lesson → use `hgdw-video-production` `produce` |
| "Re-record segment 5's narration" | You're producing a brand-new lesson |
| "Swap segment 8 to a C5-callout" | You changed many segments → re-`produce` is cleaner |
| "Nudge the recording at 2:10 later" | The bin is the problem → use `palmier clear` |

## Contract (inputs → output)

- **Input:** human feedback + a locator (a timestamp like `1:23`, or a segment id like `08`),
  and the *kind* of change: `narration` | `slide` | `recording` | `retime`.
- **Output:** exactly one clip swapped on the Palmier timeline, the rest untouched; a one-line
  report of what changed (segment id, kind, new timestamp span).

## Steps

1. **Locate the segment.** `palmier status <LESSON_ID>` lists every segment with its id and
   timestamp span. Map the human's feedback to a single segment id. If it's ambiguous, ask —
   do not guess.
2. **Classify the change** into one `--kind`:
   - `narration` — re-generate the ElevenLabs voiceover for that segment (text change → see step 3).
   - `slide` — re-render that segment's slide (field/copy change → see step 3).
   - `recording` — re-capture / re-place the screen recording for a `DO:` segment.
   - `retime` — move/adjust an existing clip without regenerating the asset.
3. **If the change touches script content, get human approval first (Hard Rule).** Edit
   `~/hgdw-productions/<LESSON_ID>/script.md` for that one segment, show the diff, and wait for
   a yes before rendering. Never silently rewrite narration or slide copy.
4. **Apply the surgical correction:**
   ```bash
   PALMIER_TIMELINE=palmier palmier correct <LESSON_ID> \
     --kind <narration|slide|recording|retime> --seg <id>     # or --at <m:ss>
   ```
   `correct` is **surgical**: it removes just the one old clip (matched by start-frame ±1),
   re-imports just the new asset, and places it back. It does **not** clear the timeline and
   does **not** reset the media bin (a stray duplicate from a single swap is harmless).
5. **Verify the swap, not the whole timeline.** Read the timeline back (`get_timeline`) and
   confirm the one clip changed at the expected timestamp and the total clip/track counts are
   otherwise unchanged. Confirm the new slide is `verified: true` (if a slide) or the new
   voiceover length is sane (if narration).
6. **Report** one line: `seg <id> · <kind> · <old span> → <new span>`.

## Hard rules (inherited from hgdw-video-production)

1. Never fake a screen recording — emit a labeled `D1` placeholder and flag it.
2. Never use ffmpeg `-shortest`; always `-t <duration>`.
3. Never identify recording order from filenames — use content.
4. Never skip slide verification; verify the changed slide individually.
5. **Never edit `script.md` content without human approval** — this is the rule revision most
   often brushes against. Propose the edit, show it, wait for the go-ahead.

## Escalate back to the producer when…

- More than ~3 segments need changes (a full re-`produce` is cleaner and idempotent).
- The lesson structure changes (segments added/removed/reordered) — that's a script rewrite,
  not a revision; hand back to `hgdw-video-production`.
