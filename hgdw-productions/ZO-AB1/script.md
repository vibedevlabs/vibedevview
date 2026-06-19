---
lesson: ZO-AB1
title: The Core Equation — Agent = Model + Harness
track: ZO / ABSORB 1
voice: Ja'dan
---

## 01 · Cold open
phase: ABSORB
duration: 8

SAY:
One sentence changes how you think about AI agents. Agent equals model plus harness. The model is the brain. The harness is everything else.

SLIDE:
```yaml
frame: N1-title
eyebrow: ZO AGENTS · ABSORB 1
title: Agent = Model + Harness
subtitle: The core equation
```

## 02 · The 98 percent
phase: ABSORB
duration: 10

SAY:
When researchers analyzed Claude Code — Anthropic's production coding agent — they found that 1.6 percent of the codebase is AI decision logic. 98.4 percent is harness infrastructure. Permissions, context management, safety layers, recovery logic, tool routing. The agent loop itself is a simple while-loop. The real engineering lives in the systems around it.

SLIDE:
```yaml
frame: C7-stat
stat: 98.4%
statLabel: of a production agent is harness — not model reasoning
```

## 03 · What the harness actually does
phase: ABSORB
duration: 10

SAY:
Every serious agent harness has four elements. An agent loop — reason, act, observe, repeat. A tool interface — the AI can perceive and change the real world. Context management — the system decides what enters and leaves working memory. And control mechanisms — limits and guardrails that don't depend on the model obeying.

SLIDE:
```yaml
frame: C4-steps
eyebrow: THE FOUR ELEMENTS
title: Every harness has these
body:
  - Agent Loop — reason, act, observe, repeat
  - Tool Interface — read files, send emails, run code
  - Context Management — what enters and leaves working memory
  - Control Mechanisms — guardrails that don't depend on the model
```

## 04 · The six primitives
phase: ABSORB
duration: 6

SAY:
Zo Computer implements the harness through six native primitives — the building blocks you configure when setting up any agent. Bio, Rules, Personas, Skills, Automations, and Files.

SLIDE:
```yaml
frame: N2-section
eyebrow: ZO'S IMPLEMENTATION
title: The Six Primitives
subtitle: Bio · Rules · Personas · Skills · Automations · Files
```

## 05 · Bio — your permanent profile
phase: ABSORB
duration: 9

SAY:
Bio is your permanent profile. 2,048 characters. Loaded every conversation. Think of it as the "about the boss" card taped to the employee's desk. Include who you are, your clients, communication preferences, current priorities, and timezone. This one piece of context makes everything else work better.

SLIDE:
```yaml
frame: C1-bullets
eyebrow: PRIMITIVE 1
title: Bio — Who You Are
body:
  - Permanent context, loaded every conversation
  - 2,048 character limit — be precise
  - "Include: identity, clients, preferences, priorities, timezone"
  - The single highest-leverage edit you can make
```

## 06 · Rules — the employee handbook
phase: ABSORB
duration: 9

SAY:
Rules are behavioral constraints — things the agent must always or never do. Two types: always-on rules like "never send external email without my approval," and conditional rules like "when I reply lgtm, treat it as approval and proceed." Rules are guardrails, not suggestions. They fire before the model can decide otherwise.

SLIDE:
```yaml
frame: C3-compare
eyebrow: PRIMITIVE 2
title: Rules — What's Allowed
columns:
  - heading: Always-On
    items:
      - Never send email without approval
      - Default to concise — short sentences
      - Always cite your source
  - heading: Conditional
    items:
      - "When reply is 'lgtm' → treat as approval"
      - "When urgent → send SMS immediately"
      - "On Sundays → do not text unless critical"
```

## 07 · Personas — same agent, different hats
phase: ABSORB
duration: 7

SAY:
Personas are switchable AI profiles — voice, expertise, behavior. Think of it as a dress code per occasion. Suit for client emails, casual for text messages. Each messaging channel can have a different active persona. Same agent, different hats.

SLIDE:
```yaml
frame: C5-callout
eyebrow: PRIMITIVE 3
title: Personas — How to Behave
body:
  - Switchable voice, expertise, and behavior
  - Each channel gets its own active persona
  - "Example: 'Business Operations' for email, 'Quick & Casual' for SMS"
```

## 08 · Skills — the SOPs
phase: ABSORB
duration: 10

SAY:
Skills are repeatable AI workflows, packaged as SKILL dot MD files. Think of them as Standard Operating Procedures pinned to the cubicle wall. They load on demand — only activated when relevant, so they don't bloat every conversation. And the key feature: they're portable. The same SKILL dot MD works across Claude, ChatGPT, Copilot, and Zo.

SLIDE:
```yaml
frame: C1-bullets
eyebrow: PRIMITIVE 4
title: Skills — How to Do Things
body:
  - Repeatable workflows as SKILL.md files
  - Loaded on demand — only when relevant
  - "Portable: works across Claude, ChatGPT, Copilot, Zo"
  - "80+ community skills: morning-briefing, handoff, journal"
```

## 09 · Automations — daily routines
phase: ABSORB
duration: 9

SAY:
Automations are scheduled AI tasks — daily briefings, weekly reports, recurring checks. Each automation runs as a fresh agent instance — same tools, same rules, same persona, but no conversation history. That's important: write instructions as if briefing a colleague who's never seen your inbox. All context must be in the instruction.

SLIDE:
```yaml
frame: C1-bullets
eyebrow: PRIMITIVE 5
title: Automations — When to Act
body:
  - Scheduled tasks — any cadence, any channel
  - Each run is a fresh instance — no conversation history
  - All context must be in the instruction
  - "Example: 7:30 AM weekdays → check email → SMS digest"
```

## 10 · Files — the filing cabinet
phase: ABSORB
duration: 7

SAY:
Files are your agent's knowledge base — any file on the server is potential context. 100 gigs of storage. Client notes, templates, past reports. The agent can read and write files. The more it works, the more it knows. Think of it as a growing filing cabinet.

SLIDE:
```yaml
frame: C1-bullets
eyebrow: PRIMITIVE 6
title: Files — What to Know
body:
  - 100GB persistent storage
  - Any file is potential context
  - Agent reads AND writes — knowledge grows
  - "Client notes, templates, reports, history"
```

## 11 · The decision tree
phase: ABSORB
duration: 8

SAY:
When you're configuring your agent, use this decision tree. Is it a fact about you? Bio. A behavioral constraint? Rule. About how the AI should sound? Persona. A procedure? Skill. Should it run on a schedule? Automation. Reference material? Files. Every piece of context maps to exactly one primitive.

SLIDE:
```yaml
frame: C4-steps
title: Which primitive, when?
body:
  - "Fact about you or your context → Bio"
  - "Behavioral constraint (always/never) → Rule"
  - "How the AI should sound or behave → Persona"
  - "A procedure (do X, then Y, then Z) → Skill"
  - "Runs on a schedule without you asking → Automation"
  - "Reference material, templates, knowledge → Files"
```

## 12 · Outro
phase: ABSORB
duration: 5

SAY:
That's the equation. Six primitives, one harness. Next up: the mental model that ties it all together — treating your agent like a new employee.

SLIDE:
```yaml
frame: O1-outro
eyebrow: NEXT
title: Agent as Employee
subtitle: The mental model that makes everything click
```
