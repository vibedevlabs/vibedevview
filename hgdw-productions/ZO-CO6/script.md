---
lesson: ZO-CO6
title: Export, Bootstrap, Own It Forever
track: ZO / COMMAND
voice: Ja'dan
---

## 01 · Cold open — the power move
phase: COMMAND
duration: 8

SAY:
You have a working Chief of Staff. Nine jobs. Five automations. Running on your Zo. But right now, that config only lives inside Zo. If you wanted to set up another agent — or share your setup with someone — you'd have to do the whole thing again. This module fixes that. We're going to export your entire configuration, package it as a bootstrap prompt, and push it to GitHub. After this, you can rebuild your Chief of Staff from scratch with one paste. Portable. Shareable. Yours forever.

SLIDE:
```yaml
frame: N1-title
eyebrow: ZO AGENTS · COMMAND
title: Export, Bootstrap, Own It
subtitle: One prompt rebuilds everything. Push to GitHub. Done.
```

## 02 · What export means
phase: COMMAND
duration: 9

SAY:
Export means pulling every primitive out of Zo into a portable format. Your Bio — plain text. Your Rules — a list. Your Persona — the prompt. Your Skills — the SKILL dot MD files. Your Automations — the RRULE schedules and instructions. Your file structure — the folder layout. All of it becomes a single document. A snapshot of your agent's entire identity. Think of it as the DNA of your Chief of Staff. Anyone — including future you — can use that document to recreate the exact same setup on a fresh Zo.

SLIDE:
```yaml
frame: C1-bullets
eyebrow: EXPORT
title: Every primitive, portable
body:
  - "Bio → plain text block"
  - "Rules → condition + prompt pairs"
  - "Persona → name + full prompt"
  - "Skills → 9 SKILL.md files"
  - "Automations → RRULE + instruction + delivery"
  - "File structure → folder layout"
```

## 03 · Pull your config from Zo
phase: COMMAND
duration: 10

SAY:
Let's do it. Go to Zo and ask: "Export my full configuration. Include my Bio, all Rules, my active Persona prompt, all Skills with their full SKILL dot MD content, all Automations with their schedules and instructions, and my workspace file structure." Zo will compile everything into one output. Copy it. Paste it into a new file — call it something like "zo-chief-of-staff-config dot MD." That's your export. Every detail of your agent in one document.

SLIDE:
```yaml
frame: C4-steps
eyebrow: STEP 1
title: Export from Zo
body:
  - "Ask Zo: 'Export my full configuration'"
  - "Zo compiles: Bio + Rules + Persona + Skills + Automations + Files"
  - "Copy the output"
  - "Save as zo-chief-of-staff-config.md"
  - "That's your agent's DNA — one document"
```

## 04 · The bootstrap prompt
phase: COMMAND
duration: 12

SAY:
Now turn that export into a bootstrap. A bootstrap is a single prompt you can paste into a fresh Zo that recreates everything. The structure is simple. Start with a header: "Set up my Chief of Staff. Create each piece below." Then list each section — Bio, Rules, Persona, Skills, Automations, File Structure — with the exact content from your export. When you paste this into a new Zo, it reads the instructions and creates every primitive. Bio updated. Rules created. Persona set. Skills installed. Automations scheduled. Workspace scaffolded. One prompt. Full install. The same config you spent time customizing — recreated in thirty seconds.

SLIDE:
```yaml
frame: C5-callout
eyebrow: THE BOOTSTRAP
title: One prompt recreates everything
body:
  - "Header: 'Set up my Chief of Staff'"
  - "Section 1: Bio (your full context)"
  - "Section 2: Rules (all boundaries + shortcuts)"
  - "Section 3: Persona (your voice)"
  - "Section 4: Skills (9 SKILL.md files)"
  - "Section 5: Automations (5 schedules + instructions)"
  - "Section 6: File structure"
```

## 05 · Push to GitHub
phase: COMMAND
duration: 10

SAY:
Now make it permanent. Create a GitHub repository. Call it something like "my-zo-config" or "chief-of-staff." Add your bootstrap file. Add the individual SKILL dot MD files in a skills folder. Add a README that explains what it does. Push it. Now your agent configuration lives in version control. You can track changes. Roll back. Share it. Fork it. If you ever set up a new Zo — or help a friend set up theirs — clone the repo, paste the bootstrap, done. You can also use Zo itself to do this. Tell Zo: "Create a GitHub repo called my-zo-config and push my Chief of Staff bootstrap file to it."

SLIDE:
```yaml
frame: C4-steps
eyebrow: STEP 2
title: Push to GitHub
body:
  - "Create repo: my-zo-config"
  - "Add bootstrap.md — the one-prompt installer"
  - "Add skills/ — individual SKILL.md files"
  - "Add README.md — what it does + how to use it"
  - "Push. Your config is versioned and portable."
```

## 06 · Cross-tool compatibility
phase: COMMAND
duration: 10

SAY:
Here's something powerful. Your Chief of Staff config is written in plain markdown. That means it's not locked to Zo. The Bio is just text — it works as context in Claude, ChatGPT, or any model. The Rules are condition-prompt pairs — any system that supports custom instructions can use them. The Persona prompt works anywhere you can set a system message. The Skills are markdown checklists — any AI that can follow instructions can run them. The Automations are the one Zo-native piece — RRULE scheduling needs an always-on environment. But the knowledge and behavior? Portable. If you ever switch platforms, ninety percent of your config travels with you.

SLIDE:
```yaml
frame: C3-compare
title: What's portable, what's Zo-native
columns:
  - heading: Works anywhere
    items:
      - Bio — context for any AI
      - Rules — custom instructions
      - Persona — system prompt
      - Skills — markdown checklists
      - Files — plain text, any filesystem
  - heading: Needs Zo (or similar infra)
    items:
      - Automations — RRULE scheduling
      - Always-on compute
      - Multi-surface delivery (SMS, email)
      - Tool access (Gmail, Calendar, etc.)
```

## 07 · The loop — Claude designs, Zo builds, you improve
phase: COMMAND
duration: 9

SAY:
Step back and see the loop you now own. When you want a new capability, you don't learn a programming language. You talk to Claude. Describe what you need. Claude generates the Skill definition or Automation config. You paste it into Zo. Zo runs it. You notice what's off. You tell Claude to adjust it. Claude outputs the update. You paste it back. Each cycle makes your agent sharper. Claude designs. Zo builds. You improve. That loop is the real skill you learned in this course. Not how to use one platform — how to think in primitives and iterate with AI.

SLIDE:
```yaml
frame: C5-callout
eyebrow: THE LOOP
title: Claude designs → Zo builds → You improve
body:
  - "Need a new job? Describe it to Claude"
  - "Claude generates the SKILL.md or Automation"
  - "Paste into Zo → it's running"
  - "Notice what's off → tell Claude to adjust"
  - "Updated config → paste again"
  - "Each cycle = sharper agent"
```

## 08 · What you built in this course
phase: COMMAND
duration: 10

SAY:
Let's zoom out. In Absorb, you learned the core equation — a model plus a harness makes an agent. Six primitives. The employee mental model. Task loops that make it agentic. In Mirror, you built a real Chief of Staff. Claude interviewed you, personalized the config, and you installed nine jobs across your household, personal life, and business. Five running on autopilot. Right now, as we're talking, your agent is either about to send you a briefing or just finished wrapping up your day. And now in Command, you exported the whole thing, packaged it as a bootstrap, and pushed it to GitHub. You don't just have an agent. You have a system you understand, can rebuild, and can teach to someone else.

SLIDE:
```yaml
frame: C4-steps
eyebrow: THE FULL ARC
title: What you built
body:
  - "ABSORB — Learned the 6 primitives + employee model"
  - "MIRROR — Built a Chief of Staff with 9 JTBD"
  - "COMMAND — Exported, bootstrapped, pushed to GitHub"
  - "The loop: Claude designs → Zo builds → You improve"
  - "You own the system. You can rebuild it. You can teach it."
```

## 09 · Your 14-day path
phase: COMMAND
duration: 8

SAY:
Here's your path forward. Days one through three: just use it. Let the automations fire. Reply to the morning briefing. Do a brain dump. See what works. Days four through seven: customize. Adjust schedules. Add context files. Remove jobs you don't use. Add one new job you wish existed. Days eight through fourteen: level up. Have Claude design a more advanced skill — maybe meeting prep with real research, or client onboarding with a template workflow. Push updates to your GitHub repo. By day fourteen, you'll have a Chief of Staff that's uniquely yours — tuned by two weeks of real use, not a generic template.

SLIDE:
```yaml
frame: C4-steps
eyebrow: 14-DAY PATH
title: From installed to indispensable
body:
  - "Days 1-3: Use it as-is. Let the automations run."
  - "Days 4-7: Customize. Adjust schedules, add context."
  - "Days 8-14: Level up. New skills, advanced workflows."
  - "Push updates to GitHub as you iterate"
  - "By day 14: a Chief of Staff tuned by real use"
```

## 10 · Outro — you own this
phase: COMMAND
duration: 6

SAY:
You started this course asking what an agent is. Now you have one running. You know the six primitives. You know the employee mental model. You know the jobs-to-be-done framework. You know how Claude and Zo work together. And you have a bootstrap prompt on GitHub that rebuilds your entire system from scratch. That's not using AI. That's commanding it. Go make it yours.

SLIDE:
```yaml
frame: O1-outro
eyebrow: ZO AGENTS
title: Go make it yours.
subtitle: Claude designs. Zo builds. You improve. Repeat.
```
