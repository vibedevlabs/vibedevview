# Module 06 — Export and Share

> **Phase: COMMAND** | Time: ~20 min | You'll need: Zo + GitHub account

---

## Why Export?

Your Zo agent works. But right now it exists only inside Zo's surfaces — the Bio, Rules, Personas, Skills, and Automations are scattered across the platform's UI. If you want to:

- **Version-control** your agent config (track changes over time)
- **Share** your setup with others (or across your own devices)
- **Port** your skills to other tools (Claude, ChatGPT, Copilot, Cursor)
- **Rebuild** from scratch on a new Zo instance
- **Collaborate** on agent design with a team

...you need to export it to a portable format and push it to GitHub.

## What Gets Exported

Your Zo agent is made of six primitives. Here's how each one exports:

| Primitive | Export Format | Portable? |
|---|---|---|
| **Bio** | Plain text (markdown) | Yes — works as system context anywhere |
| **Rules** | Structured markdown (condition + prompt) | Yes — usable as instructions in any AI tool |
| **Persona** | Markdown prompt | Yes — this is just a system prompt |
| **Skills** | `SKILL.md` files (the open standard) | Yes — works in Claude, ChatGPT, Copilot, Zo |
| **Automations** | RRULE + instruction (markdown) | Zo-specific schedule, but the instruction is portable |
| **Files** | Whatever format they're in | Yes — just files |

The most portable piece is the **SKILL.md**. It's an open format that any AI tool can read.

## Step 1: Export Everything from Zo

Paste this into Zo chat:

### Prompt: Export Agent Config

```
Export my complete agent configuration to a Git-ready repository
structure at /home/workspace/zo-export/. Create these files:

1. README.md — overview of the agent system (name, purpose, what it does)

2. zo/install/bio.md — my current Bio, exactly as it is

3. zo/install/rules.md — all my Rules, formatted as:
   ## Always-On Rules
   ### rule: [slug]
   **prompt:** [the rule text]

   ## Conditional Rules
   ### rule: [slug]
   **condition:** [the condition]
   **prompt:** [the instruction]

4. zo/install/persona.md — my active Persona prompt

5. zo/install/automations.md — all my Automations, formatted as:
   ## automation: [name]
   **rrule:** [the RRULE string]
   **delivery:** [channel]
   **instruction:**
   ```
   [the full instruction text]
   ```

6. zo/Skills/ — copy all my SKILL.md files and their folders

7. zo/state/ — create an empty directory for runtime state

After creating everything, show me the file tree and confirm
each file was written.
```

## Step 2: Review the Export

Check what Zo created:

```
Show me the file tree at /home/workspace/zo-export/
```

You should see something like:

```
zo-export/
  README.md
  zo/
    install/
      bio.md
      rules.md
      persona.md
      automations.md
    Skills/
      daily-email-digest/
        SKILL.md
      [other skills]/
        SKILL.md
    state/
```

Read through each file. This is your **source of truth** — the complete, human-readable definition of your agent.

## Step 3: Push to GitHub

### Option A: Have Zo Do It

If you've configured GitHub on Zo (via the `gh` CLI or a PAT):

```
Initialize a git repo at /home/workspace/zo-export/, commit everything,
and push to a new GitHub repository called "my-zo-agent" under my account.
Make it private.
```

### Option B: Do It Yourself

Download the `zo-export` folder (via Zo's file browser or desktop sync), then:

```bash
cd zo-export
git init
git add .
git commit -m "Initial agent config export"
gh repo create my-zo-agent --private --source=. --push
```

## Step 4: The Bootstrap Skill (Optional but Powerful)

Create a skill that can **re-install your agent from the repo**. This makes your config truly portable — clone the repo on any Zo instance and run the bootstrap.

Create this file at `zo/Skills/bootstrap/SKILL.md`:

```markdown
---
name: bootstrap
description: >
  Install or update agent configuration from the zo-export repo.
  Use when setting up a new Zo instance or syncing changes.
  Idempotent — safe to re-run.
compatibility: Created for Zo Computer
metadata:
  author: [your name]
  category: Setup
  display-name: Bootstrap Agent
  version: "1.0"
---

# Bootstrap Agent

## Step 1: Pull the repo
Check if ~/repos/my-zo-agent exists.
- If yes: `cd ~/repos/my-zo-agent && git pull`
- If no: `git clone https://github.com/[you]/my-zo-agent ~/repos/my-zo-agent`

## Step 2: Install Bio
Read `zo/install/bio.md`. Update user Bio with its content.

## Step 3: Install Rules
Read `zo/install/rules.md`. Parse each rule block.
For each rule: check if a rule with the same slug exists.
- If yes: update it
- If no: create it

## Step 4: Install Persona
Read `zo/install/persona.md`. Check if a persona with this name exists.
- If yes: update it
- If no: create it
Set as active persona for the web channel.

## Step 5: Install Skills
Copy all folders from `zo/Skills/` to `/home/workspace/Skills/`.

## Step 6: Install Automations
Read `zo/install/automations.md`. Parse each automation block.
For each automation: check if one with the same name exists.
- If yes: update it
- If no: create it

## Step 7: Scaffold State
Create directories: `/home/workspace/Digests/`, `/home/workspace/Drafts/`

## Step 8: Verify
List all personas, rules, skills, and automations.
Report what was created vs. updated.
Check that required integrations (Gmail, Calendar) are connected.
```

Commit this to the repo too.

## How the Export/Import Loop Works

```
  ITERATE IN ZO                  EXPORT                    GITHUB
  ┌──────────┐               ┌──────────┐             ┌──────────┐
  │ Update   │               │ Run the  │             │ Version  │
  │ Bio,     │    --->        │ export   │    --->     │ control  │
  │ Rules,   │               │ prompt   │             │ your     │
  │ Skills   │               │          │             │ agent    │
  └──────────┘               └──────────┘             └──────────┘
       ^                                                    |
       |                                                    |
       └──────────  bootstrap skill  <──────────────────────┘
                    (re-import from repo)
```

This means:
- Your agent config is **never locked into Zo**
- You can rebuild from scratch on a new instance
- You can share configs with others (they run the bootstrap on their Zo)
- You can track how your agent evolves over time (git log)
- Your SKILL.md files work in Claude, ChatGPT, Copilot — not just Zo

## Cross-Tool Compatibility

The `.zo` export format is designed to be readable by any AI tool:

| File | Works In |
|---|---|
| `bio.md` | Claude system prompt, ChatGPT custom instructions, any LLM |
| `rules.md` | Claude system prompt, ChatGPT custom instructions |
| `persona.md` | Any system prompt field |
| `SKILL.md` | Claude Code, ChatGPT, GitHub Copilot, Cursor, Devin, Zo |
| `automations.md` | Zo-native (but the instruction text works anywhere) |

The key insight: **your agent config is just markdown**. It's human-readable, version-controllable, and portable. The platform is the runtime — the config is yours.

## What You've Accomplished

Across six modules, you've:

1. **Learned the equation:** Agent = Model + Harness (6 primitives)
2. **Adopted the mental model:** treat the agent like an employee with a workload
3. **Toured the platform:** every Zo feature and where to find it
4. **Built a self-bootstrapping workflow:** Claude designs, Zo builds, from a `.zo` config
5. **Built a real email assistant:** Claude interviewed you, generated the prompt, Zo set it up
6. **Exported to GitHub:** your agent config is portable, version-controlled, and shareable

## Your 14-Day Path Forward

### Week 1: Just Use It

| Day | What to Do |
|---|---|
| Day 1 | Give your agent one real task — not a test |
| Day 2 | Tell your agent about something that happened today. Build its context. |
| Day 3 | Check: did your automations run? Was the output useful? If not, iterate. |
| Day 4-5 | One real task per day. Notice what works and what doesn't. |
| Day 6 | Update your Bio with what changed this week. (5 minutes.) |
| Day 7 | Review: what have you asked for 3+ times the same way? That's your next skill. |

### Week 2: Expand

| Day | What to Do |
|---|---|
| Day 8-9 | Design a new skill with Claude, hand it to Zo. |
| Day 10 | Add a weekly automation (Friday report, weekly review). |
| Day 11-12 | Connect another tool. Try a new delivery channel (Telegram, email). |
| Day 13 | Ask Claude: "What could go wrong with my system? What's missing?" |
| Day 14 | Three sentences: What's working? What's not? What's next? |

## Four Things to Remember

1. **Use it first, optimize later.** Don't design the perfect system — just start using it for real work.
2. **Skills come from repetition.** If you've asked 3+ times the same way, make it a skill. Not before.
3. **Simple beats complex.** One agent that knows you well beats twenty that don't.
4. **Update your Bio every week.** 5 minutes. Current clients, current projects, current priorities. This one edit improves everything.

---

*Course complete. Your agent is running. Your config is on GitHub. The loop is yours.*
