# Module 03 — Platform Tour

> **Phase: ABSORB** | Time: ~30 min | Open [zo.computer](https://zo.computer) and follow along

---

## What You're Looking At

When you log into Zo, you're looking at your **personal cloud computer** — a real Linux server with an AI brain, 100+ tools, and hosting built in. This tour walks through every feature you'll use when building agents.

## The Six Layers

Zo is five concentric rings around a computer:

```
  ┌────────────────────────────────────────────────────┐
  │  6. SURFACES (web app, SMS, email, Telegram,        │
  │     Discord, Slack, desktop app, API)               │
  │  ┌──────────────────────────────────────────────┐   │
  │  │  5. HOSTING (Space, Sites, Services, zo.pub) │   │
  │  │  ┌──────────────────────────────────────┐    │   │
  │  │  │  4. TOOLS (100+ built-in)            │    │   │
  │  │  │  ┌──────────────────────────────┐    │    │   │
  │  │  │  │  3. IDENTITY (Bio, Rules,    │    │    │   │
  │  │  │  │     Personas)                │    │    │   │
  │  │  │  │  ┌────────────────────────┐  │    │    │   │
  │  │  │  │  │  2. AI BRAIN           │  │    │    │   │
  │  │  │  │  │  (multi-model, BYOK)   │  │    │    │   │
  │  │  │  │  │  ┌──────────────────┐  │  │    │    │   │
  │  │  │  │  │  │  1. COMPUTE      │  │  │    │    │   │
  │  │  │  │  │  │  (Linux server)  │  │  │    │    │   │
  │  │  │  │  │  └──────────────────┘  │  │    │    │   │
  │  │  │  │  └────────────────────────┘  │    │    │   │
  │  │  │  └──────────────────────────────┘    │    │   │
  │  │  └──────────────────────────────────────┘    │   │
  │  └──────────────────────────────────────────────┘   │
  └────────────────────────────────────────────────────┘
```

Let's tour each one.

---

## Layer 1: The Computer

**What it is:** A real Linux server in a data center. Always on. Persistent storage.

**Where to find it:** The file browser (left sidebar) and the Terminal (bottom panel).

**Key facts:**
- 100GB storage on free plan
- Files persist forever — between conversations, restarts, updates
- Root SSH access — connect from any terminal
- Desktop app with file sync (Syncthing-based)

**Try it:** In the chat, type: `list my files in /home/workspace`

---

## Layer 2: The AI Brain

**What it is:** The intelligence layer. Multi-model — switch between Claude, GPT, Gemini, and open-source models.

**Where to find it:** The model picker in the chat header.

**Key features:**
- **Built-in models** — Claude Sonnet, Opus, GPT-5, Gemini, plus free open models
- **BYOK (Bring Your Own Key)** — connect your own API keys (Settings > Advanced > Custom Models)
- **External providers** — use Claude Code, Codex, or Gemini CLI subscriptions
- **Tool-calling** — the AI can invoke 100+ tools in a single turn

**Try it:** Click the model picker, see what's available on your plan.

---

## Layer 3: Identity (The Six Primitives)

This is where you configure your agent. Let's tour each primitive.

### Bio

**Where:** Settings > Bio
**What:** Your permanent profile. 2,048 characters. Loaded every conversation.

Go look at yours now. If it's empty, that's the #1 thing to fix.

A good Bio includes:
- Who you are and what you do
- Your active clients/projects (by name)
- Communication preferences (SMS for alerts, email for reports, etc.)
- Current priorities this week
- Timezone

### Rules

**Where:** Settings > Rules
**What:** Behavioral constraints. Always-on or conditional.

Click "Add Rule." You'll see two fields:
- **Condition** (optional) — when this rule applies
- **Prompt** — what the AI must do

Start with these three:
1. "Never send external email without my explicit approval."
2. "Default to concise. Short sentences. One idea per sentence."
3. When reply is "lgtm" > "Treat as approval. Proceed. Log the decision."

### Personas

**Where:** Settings > Personas
**What:** Switchable AI profiles — voice, expertise, behavior.

Create a persona. Give it:
- A name (e.g., "Business Operations")
- A prompt (who it is, how it behaves, what it focuses on)
- Optionally: a model override and tool permissions

Each messaging channel (SMS, Slack, web) can have its own active persona.

### Skills

**Where:** The Skills tab (sidebar) and `/home/workspace/Skills/` on the filesystem.
**What:** Repeatable workflows as `SKILL.md` files.

Browse the **Skills Hub** — 80+ community skills you can install with one click:
- `morning-briefing` — daily digest of calendar + email + priorities
- `handoff` — cross-conversation continuity
- `journal` — AI reflective memory that grows
- `gog` — full Google Workspace CLI

Each skill is a markdown file with frontmatter (name, description) and step-by-step instructions.

### Automations

**Where:** Automations tab (sidebar)
**What:** Scheduled AI tasks.

Click "Create Automation." You'll set:
- **Schedule** — any cadence (daily at 7:30am, weekly on Friday, every 6 hours)
- **Instruction** — a detailed prompt with all context
- **Delivery** — SMS, email, Telegram, Slack, or silent
- **Model** — optional override

Remember: each automation runs as a fresh instance. No conversation history. All context must be in the instruction.

### Files

**Where:** File browser (left sidebar) and the `/home/workspace/` directory.
**What:** 100GB of persistent storage. Any file is potential context.

Ways files enter context:
- Open a file in the browser > automatically in context
- Mention with `@filename` > Zo reads it
- Drag to chat > attached to conversation
- URL in chat > auto-saved as article

---

## Layer 4: Tools (100+)

**Where:** The AI uses them automatically, or you can invoke them explicitly.

Organized by category:

| Category | Examples | Count |
|---|---|---|
| **Files** | Create, edit, read, search, transcribe, generate images/video/diagrams | 12 |
| **Web** | Search, read pages, browse with AI, save articles, search X/Maps | 11 |
| **Computer** | Shell commands, create/manage sites and services, proxy local services | 14 |
| **Integrations** | Gmail, Calendar, Drive, Sheets, Notion, Linear, Airtable, Slack, Discord, Telegram, SMS | 20+ |
| **Commerce** | Stripe products, prices, payment links, orders | 7 |
| **Automations** | Create, list, edit, delete automations | 5 |
| **Personalization** | CRUD personas, rules, settings | 12 |
| **Zo Space** | CRUD routes, assets, settings, version history | 16 |

**Try it:** Ask Zo: "What tools do you have for Gmail?"

---

## Layer 5: Hosting

**Where:** Sites tab, Space, and Services in the sidebar.

Four ways to put things online:

| Surface | URL Pattern | Best For |
|---|---|---|
| **Space** | `yourhandle.zo.space` | Landing pages, widgets, API endpoints |
| **Sites** | `name-handle.zocomputer.io` | Full web app projects |
| **Services** | `*.zocomputer.io` | Long-running programs (bots, APIs) |
| **zo.pub** | `zo.pub/handle/...` | Share files with a link |

Plus custom domains (point any domain to a Site or Service, SSL automatic).

**Try it:** Ask Zo: "Make my zo.space home page a simple landing page with my name and bio."

---

## Layer 6: Surfaces (Talk to Zo From Anywhere)

**Where:** Settings > Channels

| Channel | How to Set Up | Best For |
|---|---|---|
| **Web app** | Default — you're already here | Building, configuring, deep work |
| **SMS** | Automatic — your phone number | Quick tasks on the go |
| **Email** | `yourhandle@zo.computer` | Forwarding things, long requests |
| **Telegram** | Settings > Channels > pair | Quick comms, group coordination |
| **Discord** | Settings > Channels > connect | Community, team use |
| **Slack** | Add Zo app to workspace | Work communication |
| **Desktop app** | Download from zo.computer | File sync, device control |
| **API** | Settings > Advanced > access token | Programmatic access |
| **MCP** | `https://api.zo.computer/mcp` | Use Zo's tools from Claude Code, Cursor, Gemini CLI |

Universal commands across channels: `/new`, `/model`, `/persona`, `/help`

---

## The MCP Connection

Zo also works as an **MCP Server** — meaning external AI tools can use Zo's capabilities:

```bash
# Connect Claude Code to your Zo:
claude mcp add --transport http zo https://api.zo.computer/mcp \
  --header "Authorization: Bearer zo_sk_your_key_here"
```

Now Claude Code can read your Zo files, send emails through your Zo, use your Zo integrations — all from your terminal.

---

## Quick Orientation Checklist

Before moving to the build phases, make sure you can find:

- [ ] The chat interface
- [ ] The model picker
- [ ] Settings > Bio
- [ ] Settings > Rules
- [ ] Settings > Personas
- [ ] The Skills tab
- [ ] The Automations tab
- [ ] The file browser
- [ ] The terminal

If any of these are unfamiliar, spend a minute clicking through. You'll use all of them in Modules 04 and 05.

---

**Next: [Module 04 — Zo Builds Itself](04-zo-builds-itself.md)**
