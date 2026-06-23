---
lesson: ZO-MI5
title: Your Chief of Staff — Personalize and Install
track: ZO / MIRROR 2
voice: Courtney
---

## 01 · Cold open — your turn
phase: MIRROR
duration: 9

SAY:
You watched me build mine. Now let's get yours running. Here's the good news — you already have everything you need. Your AI Command Center has your context. We're giving you the pre-built Chief of Staff config with all nine jobs. You paste both into Claude, confirm what it found, and paste the output into Zo. Same flow I just showed you. Your context. Your agent.

SLIDE:
```yaml
frame: N1-title
footer: "ZO AGENTS"
eyebrow: ZO AGENTS · MIRROR 2
title: Your Chief of Staff
subtitle: Your AI Command Center + config → paste into Zo → done
```

## 02 · What you're starting with
phase: MIRROR
duration: 10

SAY:
You have two things ready. First — your AI Command Center. You built this earlier in the course. It has who you are, what you do, your clients, your tools, your communication style. That's your context. Second — the Chief of Staff config we're providing. It has nine skills across household, personal, and business. Five automations with schedules. A persona template. Rules. File structure. Everything. All you need to do is let Claude read your Command Center, map your details to the config, and confirm it's accurate.

SLIDE:
```yaml
frame: C3-compare
footer: "ZO AGENTS"
eyebrow: TWO THINGS READY
title: Your context + the config
columns:
  - heading: Your AI Command Center
    items:
      - Who you are, what you do
      - Clients and collaborators
      - Communication style
      - Daily tools and schedule
  - heading: Chief of Staff Config
    items:
      - 9 skills (Household / Personal / Business)
      - 5 automations with schedules
      - Persona template
      - Rules and file structure
```

## 03 · Paste into Claude
phase: MIRROR
duration: 9

SAY:
Open Claude. Paste three things. Your AI Command Center — that's your context. The Chief of Staff config — that's the system. And one instruction: "Read my AI Command Center. Use what you find to personalize this Chief of Staff config. Show me what you mapped to each section so I can confirm it's right." That's it. Claude does the work. It reads through your context, fills in the placeholders, and shows you exactly what it found. Your name, your timezone, your clients, your kids' schedules — all mapped to the right sections.

DO:
- action: Open Claude (claude.ai or desktop app)
  target: Browser — claude.ai
- action: Paste your AI Command Center
  target: Claude chat input
- action: Paste the Chief of Staff config
  target: Claude chat input
- action: Type the instruction — "Read my Command Center, personalize this config, show me the mapping"
  target: Claude chat input
- action: Show Claude's response — what it found and how it mapped each section
  target: Claude response

SLIDE:
```yaml
frame: C4-steps
footer: "ZO AGENTS"
eyebrow: STEP 1
title: Paste into Claude
body:
  - "Your AI Command Center (your context)"
  - "The Chief of Staff config (the system)"
  - "One instruction: read, personalize, show the mapping"
  - "Claude reads everything and fills in the blanks"
  - "Shows you what it found — you confirm"
```

## 04 · Confirm what Claude found
phase: MIRROR
duration: 10

SAY:
Claude shows you a summary. Here's what I found in your Command Center — your name, your role, your timezone. Here's your family logistics. Here's your clients. Here's your communication style. And here's how I mapped it all. Bio — filled in with your real details. Rules — your boundaries. Persona — your voice. Jobs — personalized with your actual projects and clients. Schedule — your preferred times. Scan through it. Most of it should be right — Claude is reading context you already wrote. If something's off, just say so. "I don't need the meal planner." "Change the briefing to eight AM." "Make the voice more casual." Claude adjusts instantly.

DO:
- action: Show Claude's mapping — Bio, Rules, Persona, Jobs all filled from your Command Center
  target: Claude response
- action: Scan the details — verify names, times, preferences
  target: Claude response
- action: Type any adjustments — change a time, remove a job, tweak the voice
  target: Claude chat
- action: Show Claude's updated output
  target: Claude response

SLIDE:
```yaml
frame: C4-steps
footer: "ZO AGENTS"
eyebrow: STEP 2
title: Confirm and adjust
body:
  - "Claude shows what it found in your Command Center"
  - "Bio, Rules, Persona — all mapped from your context"
  - "9 jobs personalized with your real details"
  - "Adjust anything that's off — times, jobs, voice"
  - "Claude updates instantly"
```

## 05 · Paste into Zo — one shot
phase: MIRROR
duration: 10

SAY:
Copy the entire output from Claude. Go to Zo. Paste it. That's the install. Watch Zo read through it. Bio updated — now it knows who you are. Rules created — now it knows the boundaries. Persona set — now it knows your voice. Nine Skills created as SKILL dot MD files — now it knows how to do each job. Five Automations created — now it has a daily rhythm. File structure scaffolded — notes, drafts, digests, context folders all ready. Remember the employee mental model? You just onboarded your Chief of Staff. About-the-boss card, handbook, dress code, SOPs, daily routine, filing cabinet. One paste. All six primitives. Done.

DO:
- action: Select all and copy Claude's final output
  target: Claude response
- action: Open Zo in a new tab
  target: Browser — zo.computer
- action: Paste the full config into Zo chat
  target: Zo chat input
- action: Watch Zo creating each primitive — Bio, Rules, Persona, Skills, Automations
  target: Zo chat response

SLIDE:
```yaml
frame: C5-callout
footer: "ZO AGENTS"
eyebrow: ONE PASTE · ALL SIX PRIMITIVES
title: "Zo builds your entire Chief of Staff"
body:
  - "Bio → knows who you are"
  - "Rules → knows the boundaries"
  - "Persona → knows your voice"
  - "Skills → knows HOW to do 9 jobs"
  - "Automations → knows WHEN to do them"
  - "Files → has a workspace ready"
```

## 06 · Verify everything
phase: MIRROR
duration: 8

SAY:
Before you trust it, verify it. Ask Zo: "show me my Bio." Does it have your real details? "List my rules." Are your boundaries there? "List my personas." Is Chief of Staff active? "List my skills." All nine jobs? "List my automations." Five running with the right schedules? "Show me the file tree." Workspace structure in place? If anything's missing, just tell Zo. "Add a rule: no messages before seven AM." "Change the evening wind-down to five-thirty." Fixes are instant.

DO:
- action: Ask Zo "show me my Bio" — verify your details
  target: Zo chat
- action: Ask Zo "list my rules" — check boundaries
  target: Zo chat
- action: Ask Zo "list my skills" — verify all 9 jobs
  target: Zo chat
- action: Open Automations tab — show 5 scheduled jobs with times
  target: Zo Automations
- action: Open Files tab — show workspace folder structure
  target: Zo Files

SLIDE:
```yaml
frame: C4-steps
footer: "ZO AGENTS"
eyebrow: VERIFY
title: Check every piece
body:
  - "Show me my Bio — right details?"
  - "List my rules — right boundaries?"
  - "List my personas — Chief of Staff active?"
  - "List my skills — all 9 jobs installed?"
  - "List my automations — right schedules?"
  - "Show me the workspace file tree"
```

## 07 · Test a job
phase: MIRROR
duration: 9

SAY:
Pick a job. Any job. Tell Zo: "run morning-briefing right now." Watch it check your calendar, scan your email, compile the brief, and send you an SMS. Or try: "brain dump — I've got a million things going on. The website needs updating, I forgot to reply to Marcus about the proposal, kids have a field trip Thursday I haven't signed the form for, and I had an idea for a series on time management." Watch it sort the chaos. Urgent — sign the field trip form, reply to Marcus. This week — website update. Content idea — time management series, saved for later. That's not a chatbot organizing a list. That's a Chief of Staff who knows your projects, your clients, and your priorities, applying judgment.

DO:
- action: Type "run morning-briefing" in Zo
  target: Zo chat
- action: Watch the agent run the skill — calendar check, email scan, brief compilation
  target: Zo chat response
- action: Show the SMS arriving on phone
  target: Phone / SMS
- action: Try a brain dump — type messy thoughts and watch it organize
  target: Zo chat

SLIDE:
```yaml
frame: C5-callout
footer: "ZO AGENTS"
eyebrow: TEST IT
title: Run a job right now
body:
  - "'Run morning-briefing' — SMS arrives with your day"
  - "'Brain dump: [your messy thoughts]' — organized in seconds"
  - "'Draft a post about [topic]' — written in your voice"
  - "'Check my follow-ups' — surfaces what you're forgetting"
  - "Tomorrow morning — it does this on its own"
```

## 08 · Customize your jobs
phase: MIRROR
duration: 10

SAY:
You don't have to keep all nine. Some won't fit your life right now. Maybe you don't need the meal planner. Maybe you want to add a job we didn't include. That's fine — the config is yours. To remove a job: "delete the household-planner skill." To add one: describe what you want. "Create a new skill called client-onboarding. When I say 'new client,' gather their name, project, timeline, and create a folder in my workspace with a template." Zo creates the SKILL dot MD file. To adjust a schedule: "change morning-briefing to run at eight-fifteen instead of seven-thirty." The system bends to your life, not the other way around.

SLIDE:
```yaml
frame: C1-bullets
footer: "ZO AGENTS"
eyebrow: MAKE IT YOURS
title: Add, remove, adjust
body:
  - "Remove a job: 'delete the household-planner skill'"
  - "Add a job: describe it → Zo creates the SKILL.md"
  - "Adjust a schedule: 'change morning-briefing to 8:15am'"
  - "Change delivery: 'send weekly reflection via Slack instead'"
  - "The system bends to your life"
```

## 09 · What's running now
phase: MIRROR
duration: 8

SAY:
Take a breath. Look at what you have. A Chief of Staff that knows who you are, respects your boundaries, talks in your voice, knows how to do nine specific jobs, and runs five of them on autopilot. Tomorrow morning you'll get an SMS with your day laid out. Every evening, a wrap-up. Every Sunday, a reflection on your week. When you brain dump, it organizes. When you need content, it drafts in your voice. When a follow-up is overdue, it tells you. This isn't a chatbot you visit when you need something. This is a system that works while you live your life.

SLIDE:
```yaml
frame: C2-statement
footer: "ZO AGENTS"
title: Your Chief of Staff is live.
subtitle: 9 jobs. 5 on autopilot. Running while you sleep.
```

## 10 · The upgrade path
phase: MIRROR
duration: 7

SAY:
This is version one. Use it for a week. Notice what's working and what's not. Then iterate. Level two: smart triage — if more than three urgent items hit at once, send an alert. Level three: draft replies to emails in your voice, saved for your review. Level four: meeting prep that pulls context from your files and researches the person you're meeting. Level five: the full loop — your agent handles the operational layer of your life while you focus on the work that only you can do. Each level is just more skills, more automations, more context. The foundation is already built.

SLIDE:
```yaml
frame: C4-steps
footer: "ZO AGENTS"
eyebrow: UPGRADE PATH
title: Start here, grow from here
body:
  - "Week 1: Use the 9 jobs as-is, notice what's off"
  - "Week 2: Adjust schedules, add context, refine voice"
  - "Level up: Smart triage, draft replies, meeting prep"
  - "Advanced: Full delegation — agent handles the ops layer"
  - "Each level = more skills + more automations + more context"
```

## 11 · Outro
phase: MIRROR
duration: 5

SAY:
You built it. Now let's own it. Next module — export your entire Chief of Staff config to GitHub, learn the bootstrap prompt that recreates it from scratch, and make it portable. You'll never have to set this up manually again.

SLIDE:
```yaml
frame: O1-outro
footer: "ZO AGENTS"
eyebrow: NEXT
title: Export and Own It
subtitle: Bootstrap prompt → GitHub → portable forever
```
