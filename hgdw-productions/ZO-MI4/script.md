---
lesson: ZO-MI4
title: Build Your Chief of Staff — The Interview
track: ZO / MIRROR 1
voice: LVkRatteKcSRhfqnycJG
---

## 01 · Cold open — the shift
phase: MIRROR
duration: 10

SAY:
You know the building blocks. Bio, Rules, Persona, Skills, Automations, Files. But knowing them and using them are different things. So here's what we're going to do. I'm going to sit down with Claude — right now, in real time — and build my AI Chief of Staff from scratch. Not a chatbot. Not a to-do list. A system that runs my household logistics, keeps my personal life on track, and handles the operational grind of my business. Three areas. Nine jobs. All running on a schedule while I sleep.

SLIDE:
```yaml
frame: N1-title
  footer: "ZO AGENTS"
eyebrow: ZO AGENTS · MIRROR 1
title: Build Your Chief of Staff
subtitle: Claude interviews you → Zo sets it all up
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

## 03 · Why Claude interviews you first
phase: MIRROR
duration: 9

SAY:
Here's the thing. I could hand you a template and say fill in the blanks. But the best agent configs come from a conversation, not a form. Claude asks you questions about your actual life — your schedule, your kids' activities, your clients, your communication style. Then it generates a complete Zo configuration based on your real answers. Real names, real tools, real schedules. Not generic. Yours.

SLIDE:
```yaml
frame: C4-steps
  footer: "ZO AGENTS"
eyebrow: THE PROCESS
title: Interview → Configure → Build
body:
  - "Claude interviews you across 5 rounds"
  - "Your answers map directly to Zo primitives"
  - "Claude generates a complete setup prompt"
  - "Paste into Zo → all 6 primitives created"
  - "Test it, adjust it, make it yours"
```

## 04 · Round 1 — Who you are
phase: MIRROR
duration: 10

SAY:
I open Claude. I paste my context files from earlier in the course — my bio, my projects, my voice examples. Then I add the Chief of Staff Interview Prompt. Claude starts with Round 1. Who are you? What do you do? Who do you work with? What timezone? Do you have kids — ages, logistics? What tools do you use daily? Everything I answer here becomes my Bio — that permanent context card loaded every conversation. I'm specific. Real names. Real schedules. Real preferences.

SLIDE:
```yaml
frame: C1-bullets
  footer: "ZO AGENTS"
eyebrow: ROUND 1 — WHO YOU ARE
title: "Everything here becomes your Bio"
body:
  - "Name, role, what you do"
  - "Clients and collaborators — real names"
  - "Timezone and typical weekday shape"
  - "Family logistics — kids, school, activities"
  - "Daily tools — Gmail, Calendar, Slack, Notion"
```

## 05 · Round 2 and 3 — Rules and Persona
phase: MIRROR
duration: 12

SAY:
Round 2: what should your agent never do? Claude asks about boundaries. I say: never send email without my approval. Never contact clients directly. No messages on Sundays unless it's critical. And I set up my shortcuts — "lgtm" means approved, "hold" means pause. Each answer becomes a Rule — a guardrail that fires before the model can decide otherwise. Round 3: how should it sound? I describe the voice. Direct. Warm. Short sentences. No corporate speak. Claude asks me to show an example — I paste a text I actually sent. That voice becomes my Persona. Same agent, my tone.

SLIDE:
```yaml
frame: C3-compare
  footer: "ZO AGENTS"
title: Boundaries and voice
columns:
  - heading: "Round 2 → Rules"
    items:
      - Never send email without approval
      - No messages on Sundays
      - "'lgtm' = approved, proceed"
      - "'hold' = pause, don't act"
  - heading: "Round 3 → Persona"
    items:
      - Direct, warm, concise
      - Short sentences, no corporate fluff
      - Matches YOUR actual texting style
      - Different energy per context
```

## 06 · Round 4 — The nine jobs
phase: MIRROR
duration: 14

SAY:
Round 4 is where it gets real. Claude walks through each area of my life. Household: what recurring tasks drain your energy? I tell it — meal planning is chaos, I forget school pickup conflicts, errands pile up. Claude proposes three household jobs: Morning Briefing with calendar and logistics, Meal and Household Planner on Sundays, and Family Calendar Sync every morning. Personal: how do I start my day? What falls through the cracks? I say I want an intention before the chaos, I need a way to dump my thoughts when my head is full, and I never reflect on what actually went well. Three more jobs. Business: what's my biggest time sink? Follow-ups I forget to track. Content that takes forever because I stare at a blank page. And I never properly close out the day. Three more. Nine total. For each one, Claude defines the trigger, the steps, and the definition of done.

SLIDE:
```yaml
frame: C4-steps
  footer: "ZO AGENTS"
eyebrow: ROUND 4 — YOUR NINE JOBS
title: Each job has structure
body:
  - "Trigger — when does this happen?"
  - "Steps — what does doing this job look like? (3-6 steps)"
  - "Definition of Done — how do we know it's complete?"
  - "Delivery — SMS for urgent, email for long-form, file for reference"
  - "Every job = a Zo Skill with real instructions"
```

## 07 · Round 5 — The schedule
phase: MIRROR
duration: 9

SAY:
Round 5: when should each job run? Some are on-demand — brain dumps, content drafts, meeting prep. Those are Skills I invoke when I need them. But five of the nine run on autopilot. Family Calendar Sync at six-thirty AM. Morning Briefing at seven-thirty. Follow-up Tracker at five PM. Evening Wind-down at six. Weekly Reflection on Sunday at seven. Each one becomes a Zo Automation with an RRULE schedule and a delivery channel. The agent wakes up, does the job, delivers the result, and goes back to sleep. I don't prompt it. It just runs.

SLIDE:
```yaml
frame: C1-bullets
  footer: "ZO AGENTS"
eyebrow: ROUND 5 — THE SCHEDULE
title: Five automations running on autopilot
body:
  - "6:30 AM — Family Calendar Sync → SMS"
  - "7:30 AM — Morning Briefing → SMS"
  - "5:00 PM — Follow-up Tracker → SMS (only if overdue)"
  - "6:00 PM — Evening Wind-down → SMS"
  - "Sunday 7 PM — Weekly Reflection → Email"
```

## 08 · What Claude generated
phase: MIRROR
duration: 10

SAY:
After five rounds, Claude gives me the output. One complete Zo setup prompt. My Bio — 2,048 characters of real context. Five Rules — boundaries and shortcuts. A Chief of Staff Persona with my voice. Nine Skills — each one a full job description with trigger, steps, and definition of done. Five Automations with RRULE schedules and delivery channels. And a file structure for my workspace. Everything I need, in one prompt. All built from my actual answers, not a template.

SLIDE:
```yaml
frame: C1-bullets
  footer: "ZO AGENTS"
title: Claude's output — one complete config
body:
  - "Bio — 2,048 chars of real context"
  - "Rules — 5 boundaries + shortcuts"
  - "Persona — Chief of Staff in my voice"
  - "Skills — 9 job descriptions with steps + definitions of done"
  - "Automations — 5 scheduled jobs with RRULE + delivery"
  - "File structure — workspace layout for notes, drafts, digests"
```

## 09 · Paste into Zo — watch it build
phase: MIRROR
duration: 10

SAY:
I go to Zo. I paste the entire setup prompt. And I watch. Zo reads the Bio — now it knows who I am, my clients, my kids' school schedule. Creates each Rule — now it knows the boundaries. Sets up the Persona — now it knows how to sound. Creates each Skill as a SKILL dot MD file in the workspace — now it knows how to do nine specific jobs. Creates each Automation — now it has a daily rhythm. Scaffolds the file structure — now it has a workspace. That's onboarding. Remember the employee mental model? Bio is the about-the-boss card. Rules are the handbook. Persona is the dress code. Skills are the SOPs. Automations are the daily routine. Files are the filing cabinet. All six primitives, working as one system.

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

## 10 · Test it
phase: MIRROR
duration: 9

SAY:
Don't wait for the automations to fire. Test it right now. Tell Zo: "run morning-briefing." Watch it check your calendar, scan your email, compile the brief, and send you an SMS. Tell it: "brain dump — I need to figure out what's going on with the website project, Sarah hasn't replied about the partnership, and I forgot to send that invoice." Watch it classify everything, pull out the next actions, and organize the chaos. That's your Chief of Staff. Working in real time. And tomorrow morning at seven-thirty, it'll do the briefing on its own.

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

## 11 · Outro
phase: MIRROR
duration: 5

SAY:
You just watched me build a complete Chief of Staff through a conversation with Claude. Nine jobs across household, personal, and business. Five running on autopilot. All built from my real answers. Now it's your turn.

SLIDE:
```yaml
frame: O1-outro
  footer: "ZO AGENTS"
eyebrow: NEXT
title: Build Your Chief of Staff
subtitle: Same interview. Your answers. Your agent.
```
