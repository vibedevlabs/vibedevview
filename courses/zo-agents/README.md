# Zo Agents — Complete Course

> **Build your first AI agent system using Zo Computer.**
> From understanding the architecture to exporting a portable config to GitHub.

## Course Overview

This course follows the **HGDW Arc** (Source > Absorb > Mirror > Command) to take you from zero to a running Zo agent system you own, understand, and can reproduce.

| Phase | Module | What You'll Do | Time |
|-------|--------|---------------|------|
| **SOURCE** | [00 — Orientation](00-orientation.md) | Understand the landscape: what agents are, why they need their own computer | 15 min |
| **ABSORB** | [01 — The Core Equation](01-core-equation.md) | Learn the formula: Agent = Model + Harness (6 primitives) | 30 min |
| **ABSORB** | [02 — Agent as Employee](02-agent-as-employee.md) | Adopt the mental model: treat your agent like a new hire with a workload | 20 min |
| **ABSORB** | [03 — Platform Tour](03-platform-tour.md) | Guided walkthrough of every Zo feature and primitive | 30 min |
| **MIRROR** | [04 — Zo Builds Itself](04-zo-builds-itself.md) | Use Claude to generate a `.zo` config file, then watch Zo bootstrap from it | 30 min |
| **MIRROR** | [05 — Build an Email Assistant](05-email-assistant.md) | Hands-on exercise: Claude interviews you, generates a prompt, Zo sets up a daily digest | 45 min |
| **COMMAND** | [06 — Export and Share](06-export-and-share.md) | Export your Zo primitives as a system prompt config and push to GitHub | 20 min |

**Total estimated time: ~3 hours** (self-paced, can be split across sessions)

## Prerequisites

- A [Zo Computer](https://zo.computer) account (free tier works for most exercises)
- Access to [Claude](https://claude.ai) (for the design/interview phases)
- A GitHub account (for the export exercise)
- No coding experience required

## How to Use This Course

1. **Read the modules in order.** Each builds on the last.
2. **Do the exercises.** Reading about agents doesn't build agents. The Mirror phase is where the learning happens.
3. **Copy the prompts.** Every module includes copy-paste-ready prompts for Claude and Zo.
4. **Keep your `.zo` file.** By the end, you'll have a portable agent config that works across tools.

## Course Files

```
courses/zo-agents/
  README.md                    <- You are here
  00-orientation.md            <- SOURCE: What are agents, really?
  01-core-equation.md          <- ABSORB: Agent = Model + Harness
  02-agent-as-employee.md      <- ABSORB: The employee mental model
  03-platform-tour.md          <- ABSORB: Guided tour of Zo
  04-zo-builds-itself.md       <- MIRROR: Self-building workflow
  05-email-assistant.md        <- MIRROR: Hands-on email assistant
  06-export-and-share.md       <- COMMAND: Export to GitHub
  prompts/
    claude-blueprint.md        <- The Claude prompt that designs your agent
    claude-inbox-interview.md  <- The Claude prompt that interviews you about your inbox
    zo-bootstrap.md            <- The Zo prompt that installs everything
  templates/
    zo-config.md               <- Blank .zo config template
    email-assistant-skill.md   <- SKILL.md template for the email assistant
```

## The Core Loop (reference)

```
YOUR MESS  -->  CLAUDE THINKS  -->  ZO BUILDS  -->  YOU USE IT  -->  REPEAT
 (ideas,        (designs the       (creates all     (for real,
  notes,         blueprint)         6 pieces)        every day)
  examples)
```

---

*This course is part of the [vibedevview](https://github.com/vibedevlabs/vibedevview) project by HGDW.*
