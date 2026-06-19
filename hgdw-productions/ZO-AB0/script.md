---
lesson: ZO-AB0
title: Orientation — Why Your AI Needs Its Own Computer
track: ZO / SOURCE
voice: Ja'dan
---

## 01 · Cold open
phase: SOURCE
duration: 9

SAY:
By the end of this course you'll build a real AI agent that checks your email, follows your rules, and texts you a daily digest — without you lifting a finger. Let's start with why.

SLIDE:
```yaml
frame: N1-title
eyebrow: ZO AGENTS · SOURCE
title: Why Your AI Needs Its Own Computer
subtitle: From chatbot to agent — the infrastructure gap
```

## 02 · The roadmap
phase: SOURCE
duration: 8

SAY:
Here's the arc. Source: understand the landscape. Absorb: learn the building blocks. Mirror: build a real agent. Command: export and own it.

SLIDE:
```yaml
frame: N5-agenda
eyebrow: COURSE ARC
title: Four phases
body:
  - SOURCE — why agents matter
  - ABSORB — the six primitives
  - MIRROR — build an email assistant
  - COMMAND — export to GitHub
```

## 03 · The infrastructure gap
phase: SOURCE
duration: 12

SAY:
You've used Claude. You've used ChatGPT. They've gotten good — memory features, project workspaces, even tool use. But here's what they still can't do: run a task at three AM while you sleep. Hold your Gmail credentials and check your inbox on a schedule. Deploy a website. The gap isn't intelligence anymore — it's infrastructure.

SLIDE:
```yaml
frame: C3-compare
title: The real gap
columns:
  - heading: Chatbots (even with memory)
    items:
      - Conversation-level recall
      - Limited plugins, browser-sandboxed
      - Only responds when you ask
      - Session-based compute
  - heading: Agent on its own computer
    items:
      - Structured Bio, 100GB filesystem
      - "100+ tools: Gmail, Calendar, shell, Stripe"
      - Runs tasks autonomously on any cadence
      - Always-on server with persistent credentials
```

## 04 · The core claim
phase: SOURCE
duration: 8

SAY:
Here's the thesis. Your AI needs its own computer. Not a chat window. Not an API endpoint. A persistent, always-on, stateful environment where it can store files, run code, maintain credentials, and act on your behalf — even when you're asleep.

SLIDE:
```yaml
frame: C2-statement
title: Your AI needs its own computer.
subtitle: Persistent. Always-on. Stateful. Acting on your behalf while you sleep.
```

## 05 · What you'll build
phase: SOURCE
duration: 10

SAY:
By module six, you'll have a complete agent config — bio, rules, persona, skills, automations, file structure. A working email assistant that scans your inbox daily and texts you a digest. A portable dot-zo file exportable to GitHub. And the skill to build more — the thinking framework works for any agent.

SLIDE:
```yaml
frame: C1-bullets
title: What you'll build
body:
  - A complete agent config — all six primitives
  - A working email assistant with daily digest
  - A portable .zo file on GitHub
  - The skill to build more with the Claude-Zo loop
```

## 06 · The loop
phase: SOURCE
duration: 7

SAY:
Throughout this course, you'll see one pattern over and over. Your mess goes to Claude. Claude thinks and designs. Zo builds and executes. You use it, improve it, repeat. Claude is the architect. Zo is the builder. You're the owner.

SLIDE:
```yaml
frame: C4-steps
eyebrow: THE CORE LOOP
title: How every agent gets built
body:
  - Your mess — ideas, notes, examples
  - Claude thinks — designs the blueprint
  - Zo builds — creates all six pieces
  - You improve — use it, notice what's off
  - Repeat — Claude diagnoses, Zo fixes
```

## 07 · Let's go
phase: SOURCE
duration: 5

SAY:
That's the landscape. Now let's learn the building blocks.

SLIDE:
```yaml
frame: O1-outro
eyebrow: NEXT
title: The Core Equation
subtitle: Agent = Model + Harness — the six primitives
```
