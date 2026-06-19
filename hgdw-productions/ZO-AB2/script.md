---
lesson: ZO-AB2
title: Agent as Employee — Mental Model & Task Loops
track: ZO / ABSORB 2
voice: Ja'dan
---

## 01 · Cold open
phase: ABSORB
duration: 8

SAY:
Imagine you just hired a brilliant employee. It's their first day. They're talented, fast, and eager. But they know nothing about your business. What do they need to succeed? That question is the entire mental model for building agents.

SLIDE:
```yaml
frame: N1-title
eyebrow: ZO AGENTS · ABSORB 2
title: Agent as Employee
subtitle: The mental model & task loops
```

## 02 · The onboarding
phase: ABSORB
duration: 10

SAY:
Every new hire needs six things: an about-the-boss card on their desk, that's Bio. An employee handbook, that's Rules. A dress code per occasion, that's Personas. SOPs on the cubicle wall, that's Skills. Daily and weekly routines, that's Automations. And a filing cabinet of client notes and templates, that's Files.

SLIDE:
```yaml
frame: C3-compare
title: New hire needs → Zo primitives
columns:
  - heading: What They Need
    items:
      - About-the-boss card
      - Employee handbook
      - Dress code per occasion
      - SOPs on the wall
      - Daily/weekly routines
      - Filing cabinet
  - heading: Zo Primitive
    items:
      - Bio
      - Rules
      - Personas
      - Skills
      - Automations
      - Files
```

## 03 · The three types of work
phase: ABSORB
duration: 10

SAY:
An agent isn't useful because it exists. It's useful because it has work to do. The work comes in three forms. On-demand: you ask, it does. Triggered: something happens, it responds. Scheduled: it acts without you asking. That last one — scheduled — is where the agent becomes a system. It works while you sleep.

SLIDE:
```yaml
frame: C4-steps
eyebrow: THREE TYPES OF WORK
title: Defining the workload
body:
  - "On-demand — you ask, it does (like a chatbot, but with real tools)"
  - "Triggered — something happens, it responds (event-driven rules)"
  - "Scheduled — it acts without you asking (automations, daily routines)"
```

## 04 · The task loop
phase: ABSORB
duration: 9

SAY:
Every task — on-demand, triggered, or scheduled — follows the same loop. Receive the instruction. Plan the steps. Execute with tools. Verify against the definition of done. If it's off, loop back. The definition of done is the most important part. Without it, the agent never knows when to stop.

SLIDE:
```yaml
frame: C4-steps
eyebrow: THE TASK LOOP
title: Receive → Plan → Execute → Verify
body:
  - "Receive — task instruction arrives (prompt + context)"
  - "Plan — agent breaks it into steps (using skills if available)"
  - "Execute — calls tools, reads files, takes actions"
  - "Verify — did I hit the definition of done?"
```

## 05 · What you must provide
phase: ABSORB
duration: 9

SAY:
For the task loop to work, you must provide three things. All the right information — file paths, client names, tool references, constraints. Don't make the agent guess. A clear definition of done — "send a three-bullet SMS summary by eight AM" not "keep me updated." And the right primitives configured — Bio, Rules, Skills, Files all set up.

SLIDE:
```yaml
frame: C1-bullets
title: Your three responsibilities
body:
  - "All the right information — don't make the agent guess"
  - "A clear definition of done — 'send 3-bullet SMS by 8am' not 'keep me updated'"
  - "The right primitives configured — Bio, Rules, Skills, Files"
```

## 06 · Classifying your work
phase: ABSORB
duration: 10

SAY:
Here's a decision tree for turning your daily work into agent primitives. Does it happen on a schedule? That's an automation. Is it the same way every time? That's a skill. Does it need your approval? That's a skill plus a rule. Is it just a boundary? That's a rule. Everything else — just ask Zo in conversation.

SLIDE:
```yaml
frame: C4-steps
title: Turn your work into primitives
body:
  - "Happens on a schedule? → Automation"
  - "Same way every time? → Skill"
  - "Needs your approval before acting? → Skill + Rule"
  - "Simple boundary (never do X)? → Rule"
  - "One-off or variable? → Just ask Zo"
```

## 07 · The if-then framework
phase: ABSORB
duration: 8

SAY:
Every repeating decision in your day is an if-then. "If a client emails, then I check their file and draft a reply." "If it's Monday, then I review follow-ups." "If an invoice is overdue, then I send a reminder." Each one maps to a primitive. Simple boundary? Rule. Multi-step response? Skill. Time-triggered? Automation.

SLIDE:
```yaml
frame: C1-bullets
eyebrow: THE IF/THEN FRAMEWORK
title: Map your decisions to primitives
body:
  - "If X, never do Y → Rule"
  - "If X, do A then B then C → Skill"
  - "Every Monday at 9am → Automation"
  - "Draft it, don't send it → Skill + Rule"
```

## 08 · All six working together
phase: ABSORB
duration: 12

SAY:
Seven-thirty AM, Monday. You're still in bed. Your automation fires. Zo wakes up, reads your Bio — knows you, your clients, your priorities. Follows your Rules — only text if something important. Activates the morning-briefing Skill. Reads your client Files. Writes the brief in your Persona's voice. Texts it to you. You reply "lgtm." Your shortcut rule kicks in: treat as approval, proceed. Zo drafts the follow-ups and saves them. That's all six pieces. Working together.

SLIDE:
```yaml
frame: C5-callout
eyebrow: ALL SIX PIECES
title: "7:30 AM Monday — you're still in bed"
body:
  - "Automation fires → Zo wakes up"
  - "Reads Bio → knows you, your clients, your priorities"
  - "Follows Rules → only text if important"
  - "Activates Skill → morning-briefing protocol"
  - "Reads Files → client notes, calendar"
  - "Writes in Persona voice → texts you the brief"
```

## 09 · The perception gap
phase: ABSORB
duration: 9

SAY:
One thing most people don't realize. AI tools know their environment well — which tools they have, their harness configuration, the tool-calling protocol. But they have poor understanding of their own limitations. They don't know when they're hallucinating. They can't tell when their context window is saturating. They fill gaps with confident guesses. This is the gap you fill. Understanding limitations is the single most valuable skill you can develop.

SLIDE:
```yaml
frame: C3-compare
eyebrow: THE PERCEPTION GAP
title: This is the gap you fill
columns:
  - heading: What AI knows well
    items:
      - Which tools it has access to
      - Its harness configuration
      - The tool-calling protocol
  - heading: What AI doesn't know
    items:
      - When it's hallucinating
      - When context is saturating
      - What it doesn't know
```

## 10 · Outro
phase: ABSORB
duration: 5

SAY:
You've got the mental model. Agent as employee, workload as task loops, decisions as if-thens. Next: a guided tour of every feature on the Zo platform.

SLIDE:
```yaml
frame: O1-outro
eyebrow: NEXT
title: Platform Tour
subtitle: Every Zo feature and where to find it
```
