---
lesson: ZO-MI4
title: Zo Builds Itself — The Self-Building Workflow
track: ZO / MIRROR 1
voice: Ja'dan
---

## 01 · Cold open
phase: MIRROR
duration: 8

SAY:
Here's the big idea. You don't code an agent. You describe it. Claude designs the blueprint. Zo builds the system. You iterate. Let me show you the whole workflow.

SLIDE:
```yaml
frame: N1-title
eyebrow: ZO AGENTS · MIRROR 1
title: Zo Builds Itself
subtitle: Claude designs → Zo creates → you iterate
```

## 02 · The three-step workflow
phase: MIRROR
duration: 8

SAY:
Three steps. First, gather your context — your routines, your projects, your tools, your communication style. The messier the better. Second, dump it into Claude with the Blueprint Prompt — Claude finds the structure and generates a complete dot-zo config file. Third, paste the config into Zo — Zo creates all six primitives from it.

SLIDE:
```yaml
frame: C4-steps
eyebrow: THE WORKFLOW
title: Three steps to a running agent
body:
  - "1. Gather your context — routines, projects, tools, style"
  - "2. Claude designs — generates a complete .zo config"
  - "3. Zo builds — creates all six primitives from the config"
```

## 03 · Step 1: Gather context
phase: MIRROR
duration: 9

SAY:
Before you talk to Claude, collect the raw material. Your daily routine. Your current projects and clients. Emails you've sent that show your voice. Templates you use. Tools you rely on. Things you wish someone would just handle. Don't organize it — just dump it. Claude is good at finding structure in chaos.

SLIDE:
```yaml
frame: C1-bullets
eyebrow: STEP 1
title: Gather your raw context
body:
  - Daily routine — what you do every morning, every week
  - Current projects and client names
  - Emails that show your voice and style
  - Templates you use regularly
  - Tools — Gmail, Slack, Notion, Linear, etc.
  - Things you wish someone else would handle
```

## 04 · Step 2: The Blueprint Prompt
phase: MIRROR
duration: 12

SAY:
Open Claude and paste your raw context. Then follow it with the Blueprint Prompt. This prompt tells Claude to generate a complete dot-zo configuration file with every section filled in — Bio, Rules, Persona, Skills, Automations, File structure. The key instruction: be specific. Use real names, real tools, real schedules from your context. Don't generalize. Claude will make its best inference from what you shared.

SLIDE:
```yaml
frame: C6-code
eyebrow: STEP 2 — THE BLUEPRINT PROMPT
title: Tell Claude what to generate
code: |
  Based on my context above, generate a
  complete .zo config file:

  ## BIO — who I am (2048 chars max)
  ## RULES — always-on + conditional
  ## PERSONA — name, prompt, channels
  ## SKILLS — procedures with steps
  ## AUTOMATIONS — schedule + instruction
  ## FILE STRUCTURE — workspace layout
```

## 05 · What Claude generates
phase: MIRROR
duration: 10

SAY:
Claude will generate a structured config. Your Bio with real project names. Five to seven rules including forbidden actions and decision shortcuts. A persona with voice and operating mode. Three to five skills with numbered steps and definitions of done. Two to four automations with RRULE schedules and delivery channels. And a filesystem layout for your workspace. Review it, then iterate — adjust the voice, add a rule, remove a skill you won't use yet.

SLIDE:
```yaml
frame: C1-bullets
title: What comes back
body:
  - "Bio — your real identity, projects, preferences"
  - "Rules — 5-7 constraints + 3-5 conditional rules"
  - "Persona — voice, mission, operating mode"
  - "Skills — 3-5 procedures with steps and definitions of done"
  - "Automations — 2-4 scheduled tasks with RRULE + delivery"
  - "File structure — workspace layout with seed documents"
```

## 06 · Step 3: The Bootstrap Prompt
phase: MIRROR
duration: 9

SAY:
Once your config is ready, go to Zo and paste the Bootstrap Prompt. This tells Zo to create each piece — update Bio, create every Rule, set up the Persona, write each Skill as a SKILL dot MD file, create each Automation, and scaffold the file structure. After creating everything, Zo reports back with a summary of what it built.

SLIDE:
```yaml
frame: C6-code
eyebrow: STEP 3 — THE BOOTSTRAP PROMPT
title: Tell Zo what to build
code: |
  I have a complete agent config below.
  Please set up my Zo by creating:

  1. Update my Bio
  2. Create each Rule
  3. Create the Persona
  4. Create each Skill as SKILL.md
  5. Create each Automation
  6. Create the file/folder structure

  [PASTE YOUR .ZO CONFIG HERE]
```

## 07 · Verify
phase: MIRROR
duration: 7

SAY:
After Zo finishes, verify each piece. Show me my Bio. List all my rules. List my personas. List my skills. List my automations. Show me the file tree. If anything's off, just tell Zo — "update rule three to say this" or "change the automation schedule to eight AM." Iteration is cheap.

SLIDE:
```yaml
frame: C4-steps
eyebrow: VERIFY
title: Check every piece
body:
  - "Show me my current Bio"
  - "List all my rules"
  - "List my personas — which is active?"
  - "List my skills"
  - "List my automations — next run time?"
  - "Show me /home/workspace/ file tree"
```

## 08 · The iteration loop
phase: MIRROR
duration: 9

SAY:
What you just learned is the pattern you'll use forever. Context dump to Claude. Claude generates the config. Zo builds from the config. You use it for real. Something's off — Claude diagnoses. Zo fixes. Repeat. The dot-zo config file is your source of truth. Update it as you iterate. In module six, you'll export it to GitHub.

SLIDE:
```yaml
frame: C4-steps
eyebrow: THE LOOP
title: Use this forever
body:
  - "1. Context dump → Claude designs"
  - "2. Claude generates .zo config"
  - "3. Zo builds all six primitives"
  - "4. You use it for real work"
  - "5. Something's off → Claude diagnoses → Zo fixes"
  - "6. Repeat from step 4"
```

## 09 · Follow-up prompts
phase: MIRROR
duration: 8

SAY:
When iterating with Claude, use these. "What patterns do you see in how I do this?" to find structure. "What would a system need to know about me to do this well?" when output is too generic. "What should it handle on its own versus ask me about?" to define the approval boundary. "What could go wrong with this system?" for a stress test.

SLIDE:
```yaml
frame: C1-bullets
eyebrow: FOLLOW-UP PROMPTS
title: Iterate with Claude
body:
  - "What patterns do you see in how I do this?"
  - "What would a system need to know about me?"
  - "What should it handle on its own vs. ask me about?"
  - "Write it as if briefing a new employee"
  - "What could go wrong? What's missing?"
```

## 10 · Outro
phase: MIRROR
duration: 5

SAY:
You know the workflow. Now let's use it to build something real — an email assistant that scans your inbox and texts you a daily digest.

SLIDE:
```yaml
frame: O1-outro
eyebrow: NEXT
title: Build an Email Assistant
subtitle: Claude interviews you. Zo sets it up. Your inbox gets handled.
```
