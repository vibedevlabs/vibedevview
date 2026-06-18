---
lesson: W-AB1
title: Mastering Team File Management with Claude
track: WORK / ABSORB 1
voice: Ja'dan
---

## 01 · Cold open
phase: SOURCE
duration: 12

SAY:
Hey everyone, welcome. Today we're tearing down one of the biggest productivity drains in collaborative work: manual file management. We've all been there — digging through endless folders, downloading a document, uploading it to a chat, getting the wrong version back, and repeating the cycle. For our team, that era is officially over.

SLIDE:
```yaml
frame: N1-title
eyebrow: WORK · ABSORB 1
title: Mastering Team File Management
subtitle: with Claude
```

## 02 · The new paradigm
phase: SOURCE
duration: 14

SAY:
Modern file management revolves around Claude Cowork and Claude Code. Instead of you manually feeding documents to an AI, Claude integrates directly into our shared workspaces. Secure scanning, reading, writing, organizing, and summarizing files — right from our local machines or cloud storage like Dropbox, Google Drive, and OneDrive. Let's break down exactly how this changes the game.

SLIDE:
```yaml
frame: C2-statement
title: No more drag-and-drop.
subtitle: Claude reads, writes, and organizes inside your actual workspace.
```

## 03 · The roadmap
phase: SOURCE
duration: 8

SAY:
Here's where we're headed. Three moves: first, the key features that make this work. Second, the best practices that keep your team in sync. And third, a live demo so you see it in action.

SLIDE:
```yaml
frame: N5-agenda
eyebrow: ROADMAP
title: Three moves
body:
  - ABSORB — key features for team workspaces
  - MIRROR — best practices for seamless collaboration
  - COMMAND — live cleanup on a real directory
```

## 04 · The Shared Context Hub
phase: ABSORB
duration: 14

SAY:
Feature number one: the Shared Context Hub. Think of this as a single source of truth. Your team and Claude are reading from and editing the exact same folders. This completely eliminates version control issues and saves you from ever having to drag-and-drop a file into a chat thread again.

SLIDE:
```yaml
frame: C5-callout
title: The Shared Context Hub
body:
  - Your team and Claude share the exact same folders
  - No more version conflicts or stale copies
  - Claude reads and edits live — zero drag-and-drop
```

## 05 · Agentic Organization
phase: ABSORB
duration: 14

SAY:
Feature number two: Agentic Organization. If your project folder looks like a digital junk drawer, Claude can fix it. It scans thousands of files, deduplicates assets, and renames them automatically based on custom patterns — like year-month-day dash description. It builds a logical folder structure so you don't have to.

SLIDE:
```yaml
frame: C4-steps
eyebrow: AGENTIC ORGANIZATION
title: Claude cleans the mess
body:
  - Scans thousands of files in seconds
  - Deduplicates assets automatically
  - Renames with custom patterns (YYYY-MM-DD - Description)
  - Builds a logical folder structure for you
```

## 06 · Team Admin Controls
phase: ABSORB
duration: 12

SAY:
Feature number three: Team Admin Controls. For peace of mind, your workspace owners and admins retain total control. Admins can strictly define where Claude is allowed to navigate, selectively granting or revoking folder access across the team. Your private files stay private.

SLIDE:
```yaml
frame: C1-bullets
title: Admin controls
body:
  - Define exactly which folders Claude can access
  - Grant or revoke access per team member
  - Private files stay private — always
```

## 07 · Old way vs new way
phase: ABSORB
duration: 5
silent: true

SLIDE:
```yaml
frame: C3-compare
title: The shift
columns:
  - heading: Old way
    items:
      - Manual drag-and-drop
      - Endless folder digging
      - Version chaos
  - heading: With Claude
    items:
      - Shared live workspace
      - Agentic organization
      - Admin-controlled access
```

## 08 · Best practice — Set up a sandbox
phase: MIRROR
duration: 14

SAY:
Now, to get the most out of Claude without creating chaos, follow three simple best practices. Number one: set up a sandbox. Always point Claude to specific, designated workspaces — like an active project folder. Do not give it access to broad directories like your entire hard drive. Keep it focused.

SLIDE:
```yaml
frame: C5-callout
title: "Best practice #1 — Set up a sandbox"
body:
  - Point Claude to specific, designated project folders
  - Never grant access to your entire hard drive
  - Keep the scope focused and intentional
```

## 09 · Best practice — Standardize naming
phase: MIRROR
duration: 12

SAY:
Number two: standardize naming conventions. Give Claude explicit instructions on how you want things labeled. If you use project codes or specific date formats, state that clearly so Claude maintains total consistency across the whole team.

SLIDE:
```yaml
frame: C5-callout
title: "Best practice #2 — Standardize naming"
body:
  - Tell Claude your exact naming patterns
  - Project codes, date formats, tag prefixes
  - Consistency across the whole team, automatically
```

## 10 · Best practice — Draft context files
phase: MIRROR
duration: 14

SAY:
Number three, and this is a game-changer: draft context files. By creating a dot-claude-slash-rules directory or a CLAUDE dot md file directly in your project folders, Claude instantly inherits the project's goals, tech stacks, and team roles. You won't have to re-explain the context at the start of every new session.

SLIDE:
```yaml
frame: C6-code
title: Context files — instant project memory
lang: bash
code: |
  my-project/
    .claude/
      rules/        # project goals, constraints
    CLAUDE.md        # tech stack, team roles, conventions
    src/
    docs/
```

## 11 · Live demo
phase: COMMAND
duration: 18

SAY:
Alright, enough theory. Let's see how this actually works in the real world. Watch the screen as we run a live cleanup on an unorganized project directory.

DO:
```yaml
- action: Open Claude Code in a messy project directory
  target: Terminal
- action: Run an agentic organization pass
  target: "Claude: organize and rename all files using YYYY-MM-DD pattern"
  note: let the agent work through the directory in real time
- action: Show the cleaned result
  target: File explorer showing the organized structure
```

## 12 · Your move
phase: COMMAND
duration: 7

SAY:
Your turn. Set up a sandbox folder, drop in a CLAUDE dot md context file, and let Claude organize one real project directory. I'll see you in the next one.

SLIDE:
```yaml
frame: O1-outro
eyebrow: NEXT
title: Organize your first project folder
subtitle: Set up the sandbox, add context, and let Claude work
```
