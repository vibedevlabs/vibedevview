---
lesson: ZO-MI4
title: Build Your Chief of Staff — One Prompt
track: ZO / MIRROR 1
voice: Courtney
---

## 01 · Cold open — the shift
phase: MIRROR
duration: 10

SAY:
You know the building blocks. Bio, Rules, Persona, Skills, Automations, Files. But knowing them and using them are different things. So here's what we're going to do. I'm going to sit down with Claude — right now, in real time — and build my AI Chief of Staff. Not a chatbot. Not a to-do list. A system that runs my household logistics, keeps my personal life on track, and handles the operational grind of my business. Three areas. Nine jobs. All running on a schedule while I sleep. And the best part — I already have most of the context Claude needs. My AI Command Center from earlier in the course has it all.

SLIDE:
```yaml
frame: N1-title
footer: "ZO AGENTS"
eyebrow: ZO AGENTS · MIRROR 1
title: Build Your Chief of Staff
subtitle: Your AI Command Center + one prompt → Zo sets it all up
```

## 02 · What a Chief of Staff actually does
phase: MIRROR
duration: 12

SAY:
When I say Chief of Staff, I mean something specific. Not an assistant that waits for you to ask. An operations partner that handles the repeating work across three parts of your life. Household — who needs to be where, what's for dinner, what errands are piling up. Personal — starting your day with intention, processing the chaos in your head, reflecting on the week. Business — tracking follow-ups so nothing slips, drafting content in your voice, wrapping up the day so you can actually be done. Nine jobs total. Each one has a trigger, clear steps, and a definition of done. That's what makes it agentic — not the AI model, the structure around it.

SLIDE:
```yaml
frame: C3-compare
footer: "ZO AGENTS"
eyebrow: THREE AREAS · NINE JOBS
title: Your Chief of Staff handles all three
columns:
  - heading: Household
    items:
      - Morning Briefing — calendar + logistics
      - Meal & Household Planner
      - Family Calendar Sync
  - heading: Personal + Business
    items:
      - Morning Intention — one thing that matters
      - Brain Dump → Clarity
      - Weekly Reflection
      - Client Follow-up Tracker
      - Content in My Voice
      - Evening Wind-down
```

## 03 · You already have the context
phase: MIRROR
duration: 9

SAY:
Here's why this is fast. You already built your AI Command Center earlier in the course. It has your bio, your projects, your clients, your communication style, your daily tools. Claude doesn't need to interview you from scratch — it already has the raw material. What we're going to do is give Claude two things: your AI Command Center, and the Chief of Staff config with all nine jobs pre-defined. Claude reads your context, maps it to the config, and confirms what it found. You verify, adjust a few things, and it outputs a complete Zo setup prompt. One prompt. One pass.

SLIDE:
```yaml
frame: C4-steps
footer: "ZO AGENTS"
eyebrow: THE PROCESS
title: "Your context already exists — Claude just maps it"
body:
  - "You already have your AI Command Center"
  - "We provide the Chief of Staff config (9 jobs pre-defined)"
  - "Claude reads your context → maps it to the config"
  - "You confirm what's accurate, adjust what's not"
  - "Claude outputs the complete Zo setup prompt"
```

## 04 · Paste and let Claude read
phase: MIRROR
duration: 10

SAY:
I open Claude. I paste three things. First — my AI Command Center. Everything Claude needs to know about me is already there. Second — the Chief of Staff config. All nine jobs, all five automations, the persona template, the rules, the file structure. Third — a simple instruction: "Read my AI Command Center. Use what you find to personalize this Chief of Staff config. Show me what you mapped to each section so I can confirm it's right." Claude reads through everything and comes back with a summary. Here's what I found — your name, your timezone, your clients, your kids' schedules. Here's how I filled in each section. Let me know what to adjust.

DO:
- action: Open Claude and start a new conversation
  target: Browser — claude.ai
- action: Paste the AI Command Center
  target: Claude chat input
- action: Paste the Chief of Staff config
  target: Claude chat input
- action: Type the instruction — "Read my AI Command Center, personalize this config, show me what you mapped"
  target: Claude chat input
- action: Show Claude's response — summary of what it found and how it mapped each section
  target: Claude response

SLIDE:
```yaml
frame: C4-steps
footer: "ZO AGENTS"
eyebrow: STEP 1 — PASTE
title: Three things into Claude
body:
  - "Your AI Command Center (your context)"
  - "The Chief of Staff config (9 jobs pre-defined)"
  - "One instruction: read, personalize, show me the mapping"
  - "Claude reads everything and shows what it found"
  - "You confirm — no 5-round interview needed"
```

## 05 · Confirm and adjust
phase: MIRROR
duration: 10

SAY:
Claude shows me what it pulled from my Command Center. My name, my role, my timezone — mapped to the Bio. My communication preferences and boundaries — mapped to Rules. My writing style — mapped to the Persona. My clients, my projects, my family logistics — used to personalize the nine jobs. I scan it. Most of it's right. A few things need adjusting. I say: "Change the morning briefing to eight AM instead of seven-thirty. Remove the meal planner — I don't need that one. Make the evening wind-down five-thirty, not six." Claude updates instantly. I confirm, and it outputs the final config.

DO:
- action: Show Claude's mapping — Bio, Rules, Persona, Jobs all filled in from Command Center
  target: Claude response
- action: Type adjustments — change a time, remove a job, tweak voice
  target: Claude chat
- action: Show Claude's updated output — the final personalized config
  target: Claude response

SLIDE:
```yaml
frame: C3-compare
footer: "ZO AGENTS"
eyebrow: STEP 2 — CONFIRM
title: Claude maps your context → you verify
columns:
  - heading: What Claude found
    items:
      - Name, role, timezone → Bio
      - Boundaries, shortcuts → Rules
      - Writing style → Persona
      - Clients, projects → Job context
  - heading: What you adjust
    items:
      - Schedule times that don't fit
      - Jobs you don't need right now
      - Voice tweaks — more casual, more direct
      - Any details Claude got wrong
```

## 06 · The output — one complete config
phase: MIRROR
duration: 9

SAY:
Claude gives me the final output. One complete Zo setup prompt. My Bio — real context from my Command Center. Five Rules — boundaries and shortcuts. A Chief of Staff Persona in my voice. Nine Skills — each one a full job description with trigger, steps, and definition of done. Five Automations with schedules and delivery channels. And a file structure for my workspace. All personalized from context I already had. No forms. No lengthy interview. Just Claude reading what I've already written about myself and mapping it to a system.

DO:
- action: Scroll through Claude's complete output — the full Zo setup prompt
  target: Claude response
- action: Show Bio section, Rules, Persona
  target: Claude response
- action: Scroll to Skills — show SKILL.md format with steps and definitions of done
  target: Claude response
- action: Scroll to Automations — show the 5 scheduled jobs
  target: Claude response

SLIDE:
```yaml
frame: C1-bullets
footer: "ZO AGENTS"
title: Claude's output — one complete config
body:
  - "Bio — real context from your AI Command Center"
  - "Rules — 5 boundaries + shortcuts"
  - "Persona — Chief of Staff in your voice"
  - "Skills — 9 job descriptions with steps + definitions of done"
  - "Automations — 5 scheduled jobs with delivery channels"
  - "File structure — workspace layout ready to go"
```

## 07 · Paste into Zo — watch it build
phase: MIRROR
duration: 10

SAY:
I go to Zo. I paste the entire setup prompt. And I watch. Zo reads the Bio — now it knows who I am, my clients, my kids' school schedule. Creates each Rule — now it knows the boundaries. Sets up the Persona — now it knows how to sound. Creates each Skill as a SKILL dot MD file in the workspace — now it knows how to do nine specific jobs. Creates each Automation — now it has a daily rhythm. Scaffolds the file structure — now it has a workspace. That's onboarding. Remember the employee mental model? Bio is the about-the-boss card. Rules are the handbook. Persona is the dress code. Skills are the SOPs. Automations are the daily routine. Files are the filing cabinet. All six primitives, working as one system.

DO:
- action: Open Zo — paste the full setup prompt into chat
  target: Browser — zo.computer
- action: Watch Zo processing — creating Bio, Rules, Persona
  target: Zo chat response
- action: Watch Zo creating Skills and Automations
  target: Zo chat response
- action: Open Settings — verify Bio is populated
  target: Zo Settings > Bio
- action: Check Rules — show the rules list
  target: Zo Settings > Rules
- action: Check Automations tab — show scheduled jobs
  target: Zo Automations

SLIDE:
```yaml
frame: C5-callout
footer: "ZO AGENTS"
eyebrow: ALL SIX PRIMITIVES
title: "Paste → Build → Your Chief of Staff is live"
body:
  - "Bio loaded → knows who you are"
  - "Rules created → knows the boundaries"
  - "Persona set → knows how to sound"
  - "Skills installed → knows HOW to do 9 jobs"
  - "Automations running → knows WHEN to do them"
  - "Files scaffolded → has a workspace ready"
```

## 08 · Test it
phase: MIRROR
duration: 9

SAY:
Don't wait for the automations to fire. Test it right now. Tell Zo: "run morning-briefing." Watch it check your calendar, scan your email, compile the brief, and send you an SMS. Tell it: "brain dump — I need to figure out what's going on with the website project, Sarah hasn't replied about the partnership, and I forgot to send that invoice." Watch it classify everything, pull out the next actions, and organize the chaos. That's your Chief of Staff. Working in real time. And tomorrow morning at seven-thirty, it'll do the briefing on its own.

DO:
- action: Type "run morning-briefing" in Zo chat
  target: Zo chat
- action: Watch the agent check calendar, compile brief, send SMS
  target: Zo chat response
- action: Show the SMS notification arriving on phone (or screenshot)
  target: Phone / SMS
- action: Try "brain dump" — type messy thoughts and watch it organize
  target: Zo chat

SLIDE:
```yaml
frame: C5-callout
footer: "ZO AGENTS"
eyebrow: TEST IT
title: Run a job right now
body:
  - "'Run morning-briefing' — watch the SMS arrive"
  - "'Brain dump: [messy thoughts]' — watch it organize"
  - "'Draft a post about [topic]' — see it write in your voice"
  - "'Check my follow-ups' — see what you're forgetting"
  - "Tomorrow at 7:30am — it does this without you asking"
```

## 09 · Outro
phase: MIRROR
duration: 5

SAY:
You just watched me build a complete Chief of Staff in one pass. No lengthy interview. Just my AI Command Center, the config, and one prompt to Claude. Nine jobs across household, personal, and business. Five running on autopilot. Now it's your turn.

SLIDE:
```yaml
frame: O1-outro
footer: "ZO AGENTS"
eyebrow: NEXT
title: Build Your Chief of Staff
subtitle: Your AI Command Center. Same config. Your agent.
```
