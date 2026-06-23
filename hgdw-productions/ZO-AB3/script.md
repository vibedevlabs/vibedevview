---
lesson: ZO-AB3
title: Platform Tour — Every Feature, Every Primitive
track: ZO / ABSORB 3
voice: LVkRatteKcSRhfqnycJG
---

## 01 · Cold open
phase: ABSORB
duration: 7

SAY:
You know the equation. You know the six primitives. You know the employee mental model. Now let's see where everything lives. This is a quick tour of Zo Computer — the interface, the settings, the tools. By the end, you'll know exactly where to find and edit every primitive before you start building your Chief of Staff.

SLIDE:
```yaml
frame: N1-title
footer: "ZO AGENTS"
eyebrow: ZO AGENTS · ABSORB 3
title: Platform Tour
subtitle: Where every primitive lives
```

## 02 · The five layers
phase: ABSORB
duration: 10

SAY:
Zo is built in five layers, from the bottom up. Layer one — compute. A real Linux server, always on, persistent storage. You can SSH in if you want. Layer two — the AI brain. Multi-model, tool-calling, streaming. Layer three — personalization. This is where the six primitives live — Bio, Rules, Personas, Skills, Automations, Files. Layer four — hosting. Sites, services, APIs, public file sharing. Layer five — surfaces. The web app, desktop app, SMS, email, Telegram, Discord, Slack, API. Same agent, every channel. You interact mostly with layers three and five. Personalization and surfaces. The rest is infrastructure that just works.

SLIDE:
```yaml
frame: C4-steps
footer: "ZO AGENTS"
eyebrow: ARCHITECTURE
title: Five layers — bottom to top
body:
  - "Compute — Linux server, always on, persistent storage"
  - "AI Brain — multi-model, 100+ tools, streaming"
  - "Personalization — Bio, Rules, Personas, Skills, Automations, Files"
  - "Hosting — sites, services, APIs, public sharing"
  - "Surfaces — web, desktop, SMS, email, Telegram, Slack, API"
```

## 03 · The web app
phase: ABSORB
duration: 9

SAY:
The web app at zo.computer is where you'll spend most of your time during setup. When you log in, you see the chat interface — talk to your Zo just like any AI chat. But the left sidebar is where the real power lives. Files — browse everything on your server. Terminal — run shell commands directly in the browser. Sites — manage hosted websites and services. And Settings — this is where the six primitives are configured. Let's go through Settings.

DO:
- action: Open zo.computer and log in
  target: Browser — zo.computer
- action: Show the chat interface — send a quick message
  target: Zo web app chat
- action: Click through left sidebar — Files, Terminal, Sites, Settings
  target: Zo web app sidebar

SLIDE:
```yaml
frame: C1-bullets
footer: "ZO AGENTS"
eyebrow: WEB APP
title: zo.computer — your command center
body:
  - "Chat — talk to your Zo"
  - "Files — browse your server's filesystem"
  - "Terminal — shell commands in the browser"
  - "Sites — manage hosted projects"
  - "Settings — where the 6 primitives live"
```

## 04 · Settings — where primitives live
phase: ABSORB
duration: 12

SAY:
In Settings, you'll find each primitive as its own section. Bio — a text field, two thousand character limit. Type your context and save. Rules — a list. Add always-on rules or conditional rules with triggers. Personas — create named personas with prompts, set one as active, assign per channel. Skills — these live as SKILL dot MD files in your filesystem at home workspace Skills. You can also browse community skills from the Skills tab and install them with one click. Automations — create scheduled tasks with RRULE, instruction, model, and delivery channel. Files — your entire filesystem. Anything in home workspace is accessible to the AI.

DO:
- action: Open Settings > Bio — show the text field
  target: Zo Settings
- action: Open Settings > Rules — show always-on and conditional rule list
  target: Zo Settings > Rules
- action: Open Settings > Personas — show persona list and active toggle
  target: Zo Settings > Personas
- action: Open Skills tab — show installed skills and community hub
  target: Zo Skills
- action: Open Automations tab — show scheduled task list
  target: Zo Automations
- action: Open Files tab — show filesystem browser
  target: Zo Files

SLIDE:
```yaml
frame: C4-steps
footer: "ZO AGENTS"
eyebrow: SETTINGS
title: Each primitive has a home
body:
  - "Bio → Settings > Bio (2,048 char text field)"
  - "Rules → Settings > Rules (always-on + conditional)"
  - "Personas → Settings > Personas (create, set active, per-channel)"
  - "Skills → /home/workspace/Skills/ (SKILL.md files)"
  - "Automations → Automations tab (RRULE + instruction + delivery)"
  - "Files → Files tab (entire filesystem)"
```

## 05 · Tools — what your agent can do
phase: ABSORB
duration: 10

SAY:
Your agent has access to over a hundred tools, organized into categories. Files — create, read, edit, search, transcribe audio and video, generate images and diagrams. Web — search, read pages, browse with an AI agent, save articles. Computer — run shell commands, create sites and services, proxy local ports publicly. Integrations — Gmail, Google Calendar, Drive, Sheets, Notion, Linear, Airtable, Slack, Discord, Telegram, Spotify, Twitter. Commerce — Stripe products, payment links, orders. You don't need to know all of them. Your agent discovers the right tool for the job based on your Skill instructions.

SLIDE:
```yaml
frame: C3-compare
footer: "ZO AGENTS"
eyebrow: 100+ TOOLS
title: What your agent can actually do
columns:
  - heading: Core tools
    items:
      - Files — CRUD, search, transcribe, generate
      - Web — search, read pages, browse
      - Computer — shell, sites, services
  - heading: Integrations
    items:
      - Gmail, Calendar, Drive, Sheets
      - Notion, Linear, Airtable
      - Slack, Discord, Telegram
      - Stripe commerce
```

## 06 · Surfaces — where you talk to your agent
phase: ABSORB
duration: 9

SAY:
Zo meets you where you already are. The web app for setup and long conversations. The desktop app for file sync and quick access. SMS — text your Zo from your phone. Email — send to your handle at zo.computer. Telegram — DM or group chat. Discord — DM or mention in a server. Slack — DM or at-mention. And the API for programmatic access. Same agent, same memory, same tools, every channel. Start a conversation on your phone via SMS, continue it on the web app from your laptop. The context follows you. For your Chief of Staff, SMS is the primary delivery channel — that's where your morning briefings, follow-up alerts, and evening summaries arrive.

SLIDE:
```yaml
frame: C1-bullets
footer: "ZO AGENTS"
eyebrow: SURFACES
title: Same agent, every channel
body:
  - "Web app — setup, long conversations"
  - "Desktop app — file sync, quick access"
  - "SMS — text from your phone"
  - "Email — send to yourhandle@zo.computer"
  - "Telegram, Discord, Slack — messaging platforms"
  - "API — programmatic access"
```

## 07 · MCP — your agent as infrastructure
phase: ABSORB
duration: 8

SAY:
One more thing worth knowing. Zo exposes itself as an MCP server. That means you can connect Zo's tools to Claude Code, Cursor, Gemini CLI, or any MCP-compatible tool. Your agent becomes infrastructure for other AI tools. You're not locked into one interface. Your Zo's tools — the files, the web search, the integrations — become available to whatever AI tool you prefer working with. This is how Zo becomes the backbone of your AI stack, not just another app in it.

SLIDE:
```yaml
frame: C5-callout
footer: "ZO AGENTS"
eyebrow: MCP SERVER
title: Your agent as infrastructure
body:
  - "Zo exposes its tools via MCP protocol"
  - "Connect to Claude Code, Cursor, Gemini CLI"
  - "Your files, search, integrations — available everywhere"
  - "Not locked to one interface"
  - "Zo becomes the backbone of your AI stack"
```

## 08 · Quick recap
phase: ABSORB
duration: 7

SAY:
That's the platform. Five layers — compute, AI brain, personalization, hosting, surfaces. Six primitives in Settings — Bio, Rules, Personas, Skills, Automations, Files. Over a hundred tools organized by category. Seven messaging channels, all sharing the same agent. And MCP so your Zo works with other AI tools too. You now know the theory and the interface. Next — we build.

SLIDE:
```yaml
frame: O1-outro
footer: "ZO AGENTS"
eyebrow: ABSORB COMPLETE
title: You know the building blocks.
subtitle: Next — build your Chief of Staff.
```
