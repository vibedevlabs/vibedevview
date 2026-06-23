---
lesson: ZO-AB1
title: The Core Equation — Agent = Model + Harness
track: ZO / ABSORB 1
voice: Courtney
---

## 01 · Cold open
phase: ABSORB
duration: 8

SAY:
Every agent you've ever used — Siri, Alexa, ChatGPT, Claude — runs on the same basic equation. A model that thinks, and a harness that gives it structure. The model is the intelligence. The harness is everything else — the rules, the tools, the memory, the schedule, the interface. Change the model, the agent thinks differently. Change the harness, the agent behaves differently. This lesson is about the harness. Because that's the part you control.

SLIDE:
```yaml
frame: N1-title
footer: "ZO AGENTS"
eyebrow: ZO AGENTS · ABSORB 1
title: Agent = Model + Harness
subtitle: The equation behind every AI agent
```

## 02 · The equation
phase: ABSORB
duration: 10

SAY:
Agent equals model plus harness. That's it. The model is the AI brain — Claude, GPT, Gemini, whatever you choose. It handles reasoning, language, decision-making. You don't build the model. You pick one. The harness is everything you wrap around that model to make it useful for your specific life. Your context. Your rules. Your tools. Your schedule. Your voice. Without a harness, a model is just a smart stranger. With a harness, it's your Chief of Staff.

SLIDE:
```yaml
frame: C5-callout
footer: "ZO AGENTS"
eyebrow: THE EQUATION
title: "Agent = Model + Harness"
body:
  - "Model = the AI brain (Claude, GPT, Gemini)"
  - "Harness = everything you wrap around it"
  - "Your context, rules, tools, schedule, voice"
  - "You don't build the model. You build the harness."
  - "The harness is what makes it YOURS"
```

## 03 · The model side
phase: ABSORB
duration: 8

SAY:
The model handles the thinking. Given a prompt, it reasons, generates, decides. You've already experienced this. You ask Claude a question, it gives you a thoughtful answer. You give GPT a task, it produces a draft. That's the model doing its job. On Zo, you can switch models anytime. Claude Sonnet for everyday work. Claude Opus for complex reasoning. GPT for a different perspective. Gemini for another. The model is interchangeable. The harness is what stays.

SLIDE:
```yaml
frame: C1-bullets
footer: "ZO AGENTS"
eyebrow: THE MODEL
title: The brain — interchangeable
body:
  - "Handles reasoning, language, decisions"
  - "Claude, GPT, Gemini — your choice"
  - "Switch anytime on Zo"
  - "The model is the intelligence"
  - "You don't build it. You pick it."
```

## 04 · The harness side — six primitives
phase: ABSORB
duration: 12

SAY:
The harness is where you spend your time. On Zo, the harness has exactly six building blocks — six primitives. Bio — who you are, your context, your preferences. Rules — what the agent should and shouldn't do. Personas — how it sounds, its voice and expertise. Skills — specific jobs it knows how to do, written as step-by-step instructions. Automations — scheduled tasks that run without you. Files — any document on the server that gives the agent context. These six primitives are the entire configuration surface. Every agent you build on Zo is some combination of these six things. That's it.

SLIDE:
```yaml
frame: C4-steps
footer: "ZO AGENTS"
eyebrow: THE HARNESS
title: Six primitives — that's the whole surface
body:
  - "Bio — who you are, your context"
  - "Rules — boundaries and shortcuts"
  - "Personas — voice, expertise, behavior"
  - "Skills — jobs with steps and definitions of done"
  - "Automations — scheduled tasks that run on their own"
  - "Files — any document as context"
```

## 05 · Bio — your context card
phase: ABSORB
duration: 8

SAY:
Bio is the simplest primitive. It's a block of text — up to two thousand characters — that tells the agent who you are. Your name. What you do. Your timezone. Your clients. Your kids' ages. Your communication preferences. It loads every single conversation. The agent always knows this context. Think of it as the "about the boss" card you'd give a new hire on day one. Short, dense, specific. Not a resume — a working context card.

SLIDE:
```yaml
frame: C1-bullets
footer: "ZO AGENTS"
eyebrow: "PRIMITIVE 1 · BIO"
title: "Your context card — always loaded"
body:
  - "2,048 characters max"
  - "Who you are, what you do, timezone"
  - "Clients, collaborators, family logistics"
  - "Communication preferences"
  - "Loaded every conversation — the agent always knows"
```

## 06 · Rules — the guardrails
phase: ABSORB
duration: 9

SAY:
Rules are behavioral constraints. They come in two types. Always-on rules fire every conversation — "never send email without my approval," "default to concise." Conditional rules fire when a condition matches — "when I say looks good, treat it as approval and proceed," "when it's Sunday, no proactive messages." Rules are the difference between an agent that does whatever it thinks is best and one that respects your boundaries. They're the employee handbook. Short, clear, non-negotiable.

SLIDE:
```yaml
frame: C3-compare
footer: "ZO AGENTS"
eyebrow: "PRIMITIVE 2 · RULES"
title: Guardrails — always-on and conditional
columns:
  - heading: Always-on
    items:
      - Never send email without approval
      - Default to concise
      - Always cite sources in research
  - heading: Conditional
    items:
      - "When 'looks good' → treat as approval"
      - "When Sunday → no proactive SMS"
      - "When 3+ urgent items → alert immediately"
```

## 07 · Personas — the voice
phase: ABSORB
duration: 8

SAY:
Personas control how the agent sounds and behaves. A persona has a name, a prompt, and optionally a model override. You might have a Chief of Staff persona that's direct, warm, and concise. A Technical Writer persona that's precise and detailed. A Creative Director persona that's bold and opinionated. You can set different personas per channel — one voice for SMS, another for Slack. The persona is the dress code. Same employee, different presentation for different contexts.

SLIDE:
```yaml
frame: C1-bullets
footer: "ZO AGENTS"
eyebrow: "PRIMITIVE 3 · PERSONAS"
title: "How your agent sounds — switchable"
body:
  - "Name + prompt + optional model override"
  - "Different personas for different contexts"
  - "Set per-channel — SMS voice vs Slack voice"
  - "Chief of Staff, Technical Writer, Creative Director"
  - "Same agent, different presentation"
```

## 08 · Skills — the job descriptions
phase: ABSORB
duration: 10

SAY:
Skills are the most important primitive. A skill is a repeatable job written as a SKILL dot MD file with step-by-step instructions. It has a trigger — when does this job run. Steps — what does doing this job look like. And a definition of done — how do we know it's complete. The agent reads the skill file and follows the instructions like a checklist. No code required. Just clear, plain-language steps. You'll build nine skills for your Chief of Staff — three for household, three for personal, three for business. Each one a real job with a real definition of done. That's what separates an agent from a chatbot. The chatbot answers questions. The agent finishes jobs.

SLIDE:
```yaml
frame: C5-callout
footer: "ZO AGENTS"
eyebrow: "PRIMITIVE 4 · SKILLS"
title: "Jobs with definitions of done"
body:
  - "SKILL.md — plain markdown, no code"
  - "Trigger — when does this job start?"
  - "Steps — 3 to 6 concrete actions"
  - "Definition of Done — specific, measurable output"
  - "The agent follows the checklist until the job is finished"
```

## 09 · Automations — the schedule
phase: ABSORB
duration: 9

SAY:
Automations are skills on a schedule. They use RRULE — the same standard your calendar uses for recurring events. A morning briefing at seven thirty every weekday. A follow-up tracker at five PM. A weekly reflection every Sunday at seven. Each automation has a schedule, an instruction, and a delivery channel — SMS, email, or just save to file. When the automation fires, it runs as another instance of your agent — same tools, same persona, same rules. It just runs without you asking. That's the "works while you sleep" part.

SLIDE:
```yaml
frame: C1-bullets
footer: "ZO AGENTS"
eyebrow: "PRIMITIVE 5 · AUTOMATIONS"
title: "Skills on a schedule — no prompting needed"
body:
  - "RRULE schedule — same as calendar recurrence"
  - "Instruction — what to do when triggered"
  - "Delivery — SMS, email, or file"
  - "Runs as your agent — same tools, persona, rules"
  - "Morning briefing, evening wind-down, weekly reset"
```

## 10 · Files — the context library
phase: ABSORB
duration: 7

SAY:
Files are the simplest primitive and the most flexible. Any file on your Zo server can be context for the AI. Open a file and it's in the conversation. Mention it with an at-sign and the agent reads it. Your voice examples. Your client list. Your project notes. Your household preferences. Files don't load automatically like Bio does — they load on demand. That's by design. Bio is always relevant. Files are relevant when you need them. Think of files as the filing cabinet. The agent knows where things are and pulls them when a job requires it.

SLIDE:
```yaml
frame: C1-bullets
footer: "ZO AGENTS"
eyebrow: "PRIMITIVE 6 · FILES"
title: "Any file is context — on demand"
body:
  - "Open a file → in the conversation"
  - "Mention with @ → agent reads it"
  - "Voice examples, client lists, project notes"
  - "Load on demand — not every conversation"
  - "The filing cabinet your agent pulls from"
```

## 11 · How they work together
phase: ABSORB
duration: 9

SAY:
Here's how the six primitives combine. Your Bio loads — the agent knows who you are. Your Rules activate — it knows the boundaries. Your Persona sets the voice. Now a morning briefing Automation fires at seven thirty AM. The agent reads the morning-briefing Skill — it knows the steps. It opens your Calendar and Gmail Files as context. It follows the checklist: check calendar, scan email, review yesterday's notes, compile brief, send SMS. Definition of done: SMS delivered, digest saved. One system. Six primitives working together. Each one simple on its own. Powerful in combination.

SLIDE:
```yaml
frame: C4-steps
footer: "ZO AGENTS"
eyebrow: ALL SIX TOGETHER
title: One system — six primitives in action
body:
  - "Bio loads → agent knows who you are"
  - "Rules activate → boundaries enforced"
  - "Persona sets → voice established"
  - "Automation fires → morning briefing triggered"
  - "Skill reads → follows the checklist step by step"
  - "Files provide context → calendar, email, notes"
```

## 12 · Outro
phase: ABSORB
duration: 5

SAY:
Agent equals model plus harness. The harness is six primitives. Bio, Rules, Personas, Skills, Automations, Files. Next — we'll learn the mental model that makes these primitives intuitive. Your agent is a new employee. And you're about to write their entire job description.

SLIDE:
```yaml
frame: O1-outro
footer: "ZO AGENTS"
eyebrow: NEXT
title: Your agent is a new employee
subtitle: The mental model that makes it all click
```
