# Module 00 — Orientation

> **Phase: SOURCE** | Time: ~15 min | No tools needed — just read

---

## What This Course Is

You're about to learn how to build an AI agent that works for you — not just talks to you.

By the end, you'll have a running system that checks your email, follows your rules, texts you a daily digest, and remembers who you are across every conversation. You'll understand exactly how it works and be able to export the whole thing to GitHub.

## The Problem This Solves

You've used ChatGPT. You've used Claude. You've had great conversations. Then you closed the tab, and the AI forgot everything. Next session: back to zero.

That's the gap. Today's AI chatbots are brilliant, stateless tools. They can think — but they can't *do*. They can draft — but they can't send. They can plan — but they can't execute while you sleep.

## What Makes an Agent Different from a Chatbot

| | Chatbot | Agent |
|---|---|---|
| **Memory** | Forgets after each conversation | Remembers you — Bio, files, preferences |
| **Tools** | Can only read/write text | Can send email, check calendar, browse web, run code |
| **Schedule** | Only responds when you ask | Runs tasks on its own schedule |
| **Persistence** | Lives in a browser tab | Has its own computer, always on |
| **Growth** | Static | Learns — files grow, skills improve, context deepens |

The difference is infrastructure. An agent is a chatbot *plus* a harness — the system around the model that gives it memory, tools, scheduling, and guardrails.

## The Core Claim

> **Your AI needs its own computer.** Not a chat window. Not an API endpoint. A persistent, always-on, stateful environment where it can store files, run code, maintain credentials, and act on your behalf — even when you're asleep.

This is the thesis behind [Zo Computer](https://zo.computer). Zo gives your AI that computer. The rest of this course shows you how to set it up.

## What You'll Build

By Module 06, you'll have:

1. **A complete agent config** — Bio, Rules, Persona, Skills, Automations, File structure
2. **A working email assistant** — scans your inbox daily, writes you a digest, texts it to you
3. **A portable `.zo` file** — exportable to GitHub, reusable across tools
4. **The skill to build more** — the thinking framework (Claude designs, Zo builds, you iterate) works for any agent

## The Learning Arc

This course follows the **HGDW pedagogical arc**:

```
SOURCE          ABSORB           MIRROR            COMMAND
  |               |                |                  |
  v               v                v                  v
Why agents    How they work    Build one yourself   Own it — export,
matter        (6 primitives)   (email assistant)    share, extend
```

- **Source** (this module): orient yourself. Understand the landscape.
- **Absorb** (Modules 01–03): learn the building blocks. No building yet — just understanding.
- **Mirror** (Modules 04–05): build a real agent. Hands-on. Claude + Zo working together.
- **Command** (Module 06): export, share, and own your work. Make it portable.

## One More Thing

Throughout this course, you'll see a recurring pattern:

```
YOUR MESS  -->  CLAUDE THINKS  -->  ZO BUILDS  -->  YOU IMPROVE  -->  REPEAT
```

Claude is the architect. Zo is the builder. You're the owner. The loop is the skill.

---

**Next: [Module 01 — The Core Equation](01-core-equation.md)**
