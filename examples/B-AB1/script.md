---
lesson: B-AB1
title: Build With AI — Specs, Agents & the Build Loop
track: BUILD / ABSORB 1
voice: Ja'dan
---

## 01 · Cold open
phase: SOURCE
duration: 9

SAY:
By the end of this session you'll do three things most people never do: write a spec an agent can actually execute, understand the build loop, and ship your first agent-driven build.

SLIDE:
```yaml
frame: N1-title
eyebrow: BUILD · ABSORB 1
title: Build With AI
subtitle: Specs, Agents & the Build Loop
```

## 02 · The roadmap
phase: SOURCE
duration: 8

SAY:
Here's where we're headed. Four moves: source the idea, absorb the loop, mirror a real build, then command your own.

SLIDE:
```yaml
frame: N5-agenda
eyebrow: ROADMAP
title: Four moves
body:
  - SOURCE — why specs beat prompts
  - ABSORB — the agent build loop
  - MIRROR — read a spec, run it
  - COMMAND — your first build
```

## 03 · The core idea
phase: SOURCE
duration: 7

SAY:
Burn this into your brain. A prompt is a wish. A spec is an instruction.

SLIDE:
```yaml
frame: C2-statement
title: A prompt is a wish. A spec is an instruction.
subtitle: The whole game is writing instructions a machine can follow.
```

## 04 · Prompting vs spec-driven
phase: ABSORB
duration: 12

SAY:
Prompting gets you a vibe. Spec-driven gets you a deliverable you can check, correct, and repeat. One is a slot machine. The other is a system.

SLIDE:
```yaml
frame: C3-compare
title: Two ways to work
columns:
  - heading: Prompting
    items:
      - One-shot wish
      - Hope it's right
      - Hard to repeat
  - heading: Spec-driven
    items:
      - Explicit instructions
      - Verifiable output
      - Repeatable system
```

## 05 · The build loop
phase: ABSORB
duration: 11

SAY:
Every agent build runs the same loop. Spec, plan, execute, verify, correct. The magic isn't the model — it's that you close the loop with verification.

SLIDE:
```yaml
frame: C4-steps
eyebrow: THE BUILD LOOP
title: Five steps, on repeat
body:
  - Write the spec
  - Agent plans the work
  - Agent executes in parallel
  - Verify every output
  - Correct by pointing, not redoing
```

## 06 · What a spec contains
phase: ABSORB
duration: 10

SAY:
A good spec has four parts: the goal, the constraints, the assets, and the definition of done. Miss the definition of done and the agent never knows when to stop.

SLIDE:
```yaml
frame: C1-bullets
title: Anatomy of a spec
body:
  - Goal — the outcome in one sentence
  - Constraints — the rules and brand
  - Assets — what it can use
  - Definition of done — how you'll verify
```

## 07 · Vocabulary
phase: ABSORB
duration: 5
silent: true

SLIDE:
```yaml
frame: N4-vocab
eyebrow: SAY IT RIGHT
title: Words for the build
tags:
  - spec
  - agent
  - orchestrator
  - verification
  - correction loop
```

## 08 · A real spec
phase: MIRROR
duration: 10

SAY:
Here's a slice of a real spec. Notice it reads like instructions, not a wish. Frame, title, the exact fields. An agent can execute this without guessing.

SLIDE:
```yaml
frame: C6-code
title: This is executable
lang: yaml
code: |
  segment: 03
  frame: C2-statement
  say: A prompt is a wish. A spec is an instruction.
  duration: 7
```

## 09 · Kick off the build
phase: MIRROR
duration: 18

SAY:
Now watch. One command hands the spec to the orchestrator, and the agents go to work in parallel — slides, voice, recording — then it assembles a draft.

DO:
```yaml
- action: Open the terminal
  target: iTerm
- action: Run the production
  target: palmier produce B-AB1
  note: let the agent logs scroll
- action: Show the assembled draft
  target: videos/B-AB1-preview.mp4
```

## 10 · The payoff
phase: MIRROR
duration: 6

SAY:
That draft came together in minutes, not days. And every piece is verifiable.

SLIDE:
```yaml
frame: C7-stat
stat: 10x
statLabel: faster from idea to first cut
```

## 11 · Correct, don't redo
phase: COMMAND
duration: 9

SAY:
When something's off, you don't start over. You point at the timestamp and name the fix. The agent swaps just that piece.

SLIDE:
```yaml
frame: C5-callout
title: The correction loop
body:
  - "Point: the slide at 0:48 has a typo."
  - "Name the fix: re-render that slide."
  - The agent swaps the clip. Nothing else moves.
```

## 12 · Your move
phase: COMMAND
duration: 7

SAY:
Your turn. Write a ten-line spec for something you actually want, and run the loop. I'll see you in the next one.

SLIDE:
```yaml
frame: O1-outro
eyebrow: NEXT
title: Write your first spec
subtitle: Then run the loop — COMMAND track, lesson 2
```
