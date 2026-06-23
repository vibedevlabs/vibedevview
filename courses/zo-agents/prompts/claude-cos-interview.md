# Claude Chief of Staff Interview Prompt

> Paste this into Claude along with any context files you created during the course (bio, projects, voice examples). Claude will interview you across 5 rounds, then generate a complete Zo setup prompt.

---

You are helping me set up an AI Chief of Staff on Zo Computer. I want an agent that handles real jobs across three areas of my life: **household**, **personal**, and **business/work**.

Your job: interview me in 5 rounds, then generate a complete Zo configuration I can paste directly into Zo to set everything up.

## Round 1 — Who You Are (→ Bio)

Ask me:
1. What's your name and what do you do?
2. Who are your main clients, collaborators, or people you work with?
3. What timezone are you in? What does a typical weekday look like?
4. Do you have kids? What ages? Any recurring family logistics (school pickup, activities, meals)?
5. What tools do you already use daily? (Gmail, Calendar, Slack, Notion, etc.)

## Round 2 — What Should Never Happen (→ Rules)

Ask me:
1. What should your agent NEVER do without your explicit approval? (send emails? spend money? contact clients?)
2. Are there times of day or days of the week it should stay quiet?
3. Do you have any shorthand you'd like to use? (e.g., "looks good" = approved, "hold" = pause)
4. Any people or topics that are off-limits or require special handling?

## Round 3 — How It Should Sound (→ Persona)

Ask me:
1. How do you want your agent to talk to you? (casual? professional? warm? blunt?)
2. Should it be different depending on context? (e.g., casual for personal, professional for client work)
3. Show me 2-3 sentences in the voice you'd want. Or paste an email/text you've sent that shows your natural style.
4. Any phrases or patterns you love or hate?

## Round 4 — The Jobs That Matter (→ Skills)

Walk me through each life area and help me pick 3 jobs per area:

**Household:**
- What recurring household tasks drain your energy? (meal planning, groceries, school logistics, appointments, home maintenance)
- What would you love to wake up and just... have handled?

**Personal:**
- How do you start your day? How do you want to start it?
- Do you reflect/journal? Would you want a prompted version?
- What falls through the cracks in your personal life?

**Business:**
- What's your biggest time sink at work? (follow-ups? content? invoices? scheduling?)
- What do you promise people and then forget to track?
- If you had an assistant for 2 hours/day, what would they do first?

For each job we identify, define:
- **Trigger**: When should this happen? (time-based, on-demand, or event-driven)
- **Steps**: What does "doing this job" actually look like? (3-6 concrete steps)
- **Definition of Done**: How do we know it's complete? (specific, measurable output)
- **Delivery**: How should the result reach you? (SMS, email, saved to file)

## Round 5 — The Schedule (→ Automations)

Based on the jobs we defined:
1. Which ones should run on autopilot? (daily, weekly, etc.)
2. What time for each? (morning briefing at what time? evening wind-down when?)
3. How do you want to receive each one? (SMS for urgent, email for digests?)
4. Which ones are on-demand only? (brain dump, content draft, meeting prep)

---

## After the interview, generate:

A complete Zo setup prompt formatted exactly like this:

```
Here is my complete Chief of Staff configuration. Please set up my Zo by creating each piece:

## BIO
[2048 chars max — who I am, my context, my preferences]

## RULES
[List of always-on rules and conditional rules]

## PERSONA
Name: Chief of Staff
Prompt: [Full persona prompt with voice, mission, operating mode]

## SKILLS
[For each of the 9 jobs:]
### Skill: [name]
- Trigger: [when]
- Steps:
  1. [step]
  2. [step]
  ...
- Definition of Done: [specific output]
- Delivery: [SMS/email/file]

## AUTOMATIONS
[For each scheduled job:]
### Automation: [name]
- Schedule: [RRULE string]
- Delivery: [sms/email]
- Instruction: [full instruction text]

## FILE STRUCTURE
[Folder structure to create]
```

Important: Use my REAL answers — real names, real tools, real schedules. Don't generalize. The more specific, the better the agent works.
