---
lesson: ZO-CO6
title: Export and Share — Own Your Agent Forever
track: ZO / COMMAND
voice: Ja'dan
---

## 01 · Cold open
phase: COMMAND
duration: 7

SAY:
Your agent works. But right now it exists only inside Zo. If you want to version-control it, share it, port your skills to other tools, or rebuild from scratch on a new instance — you need to export it. Let me show you how.

SLIDE:
```yaml
frame: N1-title
eyebrow: ZO AGENTS · COMMAND
title: Export and Share
subtitle: Own your agent forever — portable, version-controlled, on GitHub
```

## 02 · Why export
phase: COMMAND
duration: 8

SAY:
Five reasons to export. Version control — track how your agent evolves. Sharing — let others run your config on their Zo. Portability — your SKILL dot MD files work in Claude, ChatGPT, Copilot, Cursor, not just Zo. Rebuilding — clone the repo on a new instance and bootstrap in one command. Collaboration — teams can design agent systems together on GitHub.

SLIDE:
```yaml
frame: C1-bullets
eyebrow: WHY EXPORT
title: Five reasons
body:
  - "Version control — track how your agent evolves over time"
  - "Sharing — others can bootstrap your config on their Zo"
  - "Portability — SKILL.md works across Claude, ChatGPT, Copilot"
  - "Rebuilding — clone and bootstrap on any new instance"
  - "Collaboration — teams design agent systems together"
```

## 03 · What gets exported
phase: COMMAND
duration: 9

SAY:
Every primitive has an export format. Bio exports as plain text markdown — works as system context anywhere. Rules export as structured markdown with conditions and prompts. Persona exports as a markdown prompt — it's just a system prompt. Skills are already SKILL dot MD files — the open standard that works everywhere. Automations export as RRULE plus instruction. Files are just files. The most portable piece is the SKILL dot MD.

SLIDE:
```yaml
frame: C3-compare
title: Export format by primitive
columns:
  - heading: Primitive
    items:
      - Bio
      - Rules
      - Persona
      - Skills
      - Automations
      - Files
  - heading: "Format → Portable?"
    items:
      - "Plain text markdown → Yes, any LLM"
      - "Structured markdown → Yes, any LLM"
      - "Markdown prompt → Yes, any system prompt"
      - "SKILL.md → Yes, cross-tool standard"
      - "RRULE + instruction → Zo-native"
      - "Any format → Yes, just files"
```

## 04 · The export prompt
phase: COMMAND
duration: 9

SAY:
Tell Zo to export everything to a Git-ready structure. The export prompt creates a README, your Bio, all Rules with slugs, your active Persona, all Automations with their instructions, copies all SKILL dot MD files, and scaffolds a state directory. After creating everything, Zo shows you the file tree. This becomes your repo.

SLIDE:
```yaml
frame: C6-code
eyebrow: THE EXPORT PROMPT
title: Tell Zo to export
code: |
  Export my complete agent config to
  /home/workspace/zo-export/:

  1. README.md — system overview
  2. zo/install/bio.md — my Bio
  3. zo/install/rules.md — all Rules
  4. zo/install/persona.md — my Persona
  5. zo/install/automations.md — all Autos
  6. zo/Skills/ — all SKILL.md files
  7. zo/state/ — empty runtime dir
```

## 05 · Push to GitHub
phase: COMMAND
duration: 7

SAY:
Initialize a Git repo, commit everything, push to a new private GitHub repo. Or have Zo do it if you've configured GitHub. Either way — your agent config is now version-controlled. Every future change gets committed. You can see how your agent evolved over time with git log.

SLIDE:
```yaml
frame: C6-code
eyebrow: PUSH TO GITHUB
title: Three commands
code: |
  cd zo-export
  git init
  git add . && git commit -m "Initial agent config"
  gh repo create my-zo-agent --private \
    --source=. --push
```

## 06 · The bootstrap skill
phase: COMMAND
duration: 10

SAY:
Here's the power move. Create a skill that re-installs your agent from the repo. Clone the repo, read each install file, create or update every primitive, scaffold the state directories. This makes your config truly portable — clone the repo on any Zo instance, run the bootstrap skill, and your entire agent comes online. Share the repo with your team — they run bootstrap on their Zo and get the same system.

SLIDE:
```yaml
frame: C4-steps
eyebrow: BOOTSTRAP SKILL
title: Re-install from the repo
body:
  - "Step 1: Pull the repo (clone or git pull)"
  - "Step 2: Install Bio from zo/install/bio.md"
  - "Step 3: Install Rules from zo/install/rules.md"
  - "Step 4: Install Persona from zo/install/persona.md"
  - "Step 5: Copy Skills to /home/workspace/Skills/"
  - "Step 6: Install Automations from zo/install/automations.md"
  - "Step 7: Verify — list all primitives, check integrations"
```

## 07 · Cross-tool compatibility
phase: COMMAND
duration: 8

SAY:
The key insight. Your agent config is just markdown. Human-readable, version-controllable, and portable. Your bio dot MD works as a Claude system prompt. Your rules work as ChatGPT custom instructions. Your SKILL dot MD files work in Claude Code, Copilot, Cursor, Devin, and Zo. The platform is the runtime — the config is yours. When the next model drops, your skills get better automatically because the instructions don't change, just the engine executing them.

SLIDE:
```yaml
frame: C1-bullets
eyebrow: CROSS-TOOL
title: Your config works everywhere
body:
  - "bio.md → Claude system prompt, ChatGPT custom instructions"
  - "rules.md → Any system prompt field"
  - "persona.md → Any system prompt field"
  - "SKILL.md → Claude Code, ChatGPT, Copilot, Cursor, Devin, Zo"
  - "The platform is the runtime. The config is yours."
```

## 08 · The full picture
phase: COMMAND
duration: 10

SAY:
Let's zoom out. Across six modules, you learned the equation — agent equals model plus harness. You adopted the mental model — treat the agent like an employee with a workload. You toured every Zo feature. You built a self-bootstrapping workflow — Claude designs, Zo builds. You built a real email assistant — Claude interviewed you, Zo set it up. And now you've exported to GitHub — portable, version-controlled, shareable. That's the whole course.

SLIDE:
```yaml
frame: C4-steps
eyebrow: THE FULL PICTURE
title: What you accomplished
body:
  - "Learned: Agent = Model + Harness (6 primitives)"
  - "Adopted: the employee mental model + task loops"
  - "Toured: every Zo feature and where to find it"
  - "Built: self-bootstrapping workflow (Claude → Zo)"
  - "Built: a real email assistant with daily digest"
  - "Exported: portable agent config on GitHub"
```

## 09 · Four things to remember
phase: COMMAND
duration: 9

SAY:
Four things. One: use it first, optimize later. Don't design the perfect system — just start using it for real work. Two: skills come from repetition. If you've asked three-plus times the same way, make it a skill. Not before. Three: simple beats complex. One agent that knows you well beats twenty that don't. Four: update your Bio every week. Five minutes. Current clients, current projects, current priorities. This one edit improves everything.

SLIDE:
```yaml
frame: C1-bullets
eyebrow: REMEMBER
title: Four principles
body:
  - "1. Use it first, optimize later"
  - "2. Skills come from repetition — 3+ times → make it a skill"
  - "3. Simple beats complex — one good agent > twenty mediocre"
  - "4. Update your Bio every week — 5 minutes, everything improves"
```

## 10 · Outro
phase: COMMAND
duration: 6

SAY:
Your agent is running. Your config is on GitHub. The loop is yours. Claude designs it. Zo builds it. You own it.

SLIDE:
```yaml
frame: O1-outro
eyebrow: COURSE COMPLETE
title: The loop is yours
subtitle: Claude designs it. Zo builds it. You own it.
```
