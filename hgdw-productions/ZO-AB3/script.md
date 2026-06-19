---
lesson: ZO-AB3
title: Platform Tour — Every Feature, Every Primitive
track: ZO / ABSORB 3
voice: Ja'dan
---

## 01 · Cold open
phase: ABSORB
duration: 7

SAY:
Time to see the platform. When you log into Zo, you're looking at your personal cloud computer — a real Linux server with an AI brain, 100-plus tools, and hosting built in. Let me walk you through every layer.

SLIDE:
```yaml
frame: N1-title
eyebrow: ZO AGENTS · ABSORB 3
title: Platform Tour
subtitle: Every feature, every primitive — where to find it all
```

## 02 · The six layers
phase: ABSORB
duration: 8

SAY:
Zo is six layers. At the core: a real Linux computer with persistent storage. Around it: the AI brain — multi-model, bring your own key. Then: identity — your Bio, Rules, and Personas. Tools — over 100 built-in. Hosting — Space, Sites, Services. And surfaces — web, SMS, email, Telegram, Slack, desktop app, API.

SLIDE:
```yaml
frame: C4-steps
eyebrow: THE SIX LAYERS
title: From compute to surface
body:
  - "1. Compute — real Linux server, 100GB storage, always on"
  - "2. AI Brain — Claude, GPT, Gemini, open models, BYOK"
  - "3. Identity — Bio, Rules, Personas (the six primitives)"
  - "4. Tools — 100+ built-in (Gmail, Calendar, shell, Stripe, web)"
  - "5. Hosting — Space, Sites, Services, zo.pub"
  - "6. Surfaces — web, SMS, email, Telegram, Slack, desktop, API"
```

## 03 · Layer 1 and 2: Compute and AI
phase: ABSORB
duration: 9

SAY:
The compute layer is a real Linux server in a data center. Files persist forever — between conversations, restarts, updates. You get root SSH access and 100 gigs of storage. The AI brain sits on top — switch between Claude, GPT, Gemini, and open-source models with one click. Bring your own API keys in Settings. The AI uses tool-calling to invoke over 100 tools in a single turn.

SLIDE:
```yaml
frame: C3-compare
title: The foundation
columns:
  - heading: Compute
    items:
      - Real Linux server, always on
      - 100GB persistent storage
      - Root SSH access
      - Desktop app with file sync
  - heading: AI Brain
    items:
      - Multi-model — switch anytime
      - Claude, GPT, Gemini, open models
      - Bring your own API keys
      - 100+ tool-calling capabilities
```

## 04 · Layer 3: Identity — the primitives
phase: ABSORB
duration: 10

SAY:
The identity layer is where you configure your agent. Bio in Settings — your permanent profile, 2,048 characters. Rules in Settings — add always-on or conditional constraints. Personas in Settings — switchable AI profiles per channel. Skills in the sidebar — browse the Skills Hub, 80-plus community skills you install with one click. Automations in the sidebar — create scheduled tasks with any cadence and delivery channel. Files in the left sidebar — your growing knowledge base.

SLIDE:
```yaml
frame: C1-bullets
eyebrow: LAYER 3 — IDENTITY
title: Where to find each primitive
body:
  - "Bio → Settings > Bio (2,048 chars, loaded every conversation)"
  - "Rules → Settings > Rules (always-on + conditional)"
  - "Personas → Settings > Personas (per-channel switching)"
  - "Skills → Sidebar > Skills (80+ in the Hub)"
  - "Automations → Sidebar > Automations (any schedule)"
  - "Files → Left sidebar file browser (/home/workspace/)"
```

## 05 · Layer 4: Tools
phase: ABSORB
duration: 9

SAY:
Over 100 tools organized by category. Files — create, edit, read, search, transcribe, generate images and diagrams. Web — search, read pages, browse with AI, save articles. Computer — shell commands, create sites and services. Integrations — Gmail, Calendar, Drive, Sheets, Notion, Linear, Airtable, Slack, Discord, Telegram, SMS. Commerce — Stripe products, prices, payment links. The AI uses them automatically, or you can invoke them by name.

SLIDE:
```yaml
frame: C1-bullets
eyebrow: LAYER 4 — TOOLS
title: "100+ tools by category"
body:
  - "Files — create, edit, search, transcribe, generate (12)"
  - "Web — search, read pages, browse, save articles (11)"
  - "Computer — shell, sites, services, proxy (14)"
  - "Integrations — Gmail, Calendar, Notion, Slack, SMS (20+)"
  - "Commerce — Stripe products, prices, payment links (7)"
  - "Personalization — CRUD personas, rules, settings (12)"
```

## 06 · Layer 5 and 6: Hosting and Surfaces
phase: ABSORB
duration: 10

SAY:
Hosting gives you four ways to put things online. Space — your handle dot zo dot space for landing pages. Sites — full web app projects. Services — long-running programs like bots and APIs. And zo.pub — share any file with a link. Surfaces are how you talk to Zo from anywhere. Web app, SMS, email at your handle at zo dot computer, Telegram, Discord, Slack, desktop app, API, and MCP. That last one — MCP — means external tools like Claude Code and Cursor can use your Zo's capabilities.

SLIDE:
```yaml
frame: C3-compare
title: Hosting and surfaces
columns:
  - heading: Hosting (put things online)
    items:
      - "Space — yourhandle.zo.space"
      - "Sites — name.zocomputer.io"
      - "Services — long-running bots/APIs"
      - "zo.pub — share files with a link"
  - heading: Surfaces (talk to Zo)
    items:
      - "Web app, SMS, Email"
      - "Telegram, Discord, Slack"
      - "Desktop app, API"
      - "MCP — connect Claude Code, Cursor"
```

## 07 · The MCP connection
phase: ABSORB
duration: 8

SAY:
Zo also works as an MCP Server. That means external AI tools can use Zo's capabilities. Connect Claude Code to your Zo with one command — now Claude Code can read your Zo files, send emails through your Zo integrations, use your Zo tools, all from your terminal. Your Zo becomes a shared capability layer.

SLIDE:
```yaml
frame: C6-code
eyebrow: MCP CONNECTION
title: Connect Claude Code to your Zo
code: |
  claude mcp add --transport http zo \
    https://api.zo.computer/mcp \
    --header "Authorization: Bearer zo_sk_..."
```

## 08 · Orientation checklist
phase: ABSORB
duration: 5
silent: true

SLIDE:
```yaml
frame: N4-vocab
eyebrow: BEFORE YOU BUILD
title: Can you find these?
tags:
  - Chat interface
  - Model picker
  - Settings > Bio
  - Settings > Rules
  - Skills tab
  - Automations tab
  - File browser
  - Terminal
```

## 09 · Outro
phase: ABSORB
duration: 5

SAY:
You've seen every layer. Now it's time to build. Next module: we use Claude to design your agent, then watch Zo build it from a single config file.

SLIDE:
```yaml
frame: O1-outro
eyebrow: NEXT
title: Zo Builds Itself
subtitle: Claude designs it. Zo creates all six pieces.
```
