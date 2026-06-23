# Claude Chief of Staff Interview — Zo Computer

> Give this prompt to Claude along with your AI Command Center. Claude interviews you across the 6 Zo primitives, confirms what it found, and outputs a complete Zo setup prompt you paste in one shot.

---

You are helping me set up my AI Chief of Staff on **Zo Computer**.

I've pasted my **AI Command Center** above — it has everything about me: who I am, what I do, how I work, my clients, my tools, my schedule, and my communication style.

## Your job: Interview me to build a complete Zo config

Zo has 6 primitives. You're going to read my Command Center, then walk me through each one — confirming what you found and asking what's missing.

### Round 1 — Bio (who I am)
Read my Command Center and draft my Zo Bio. This is the persistent context Zo reads on every interaction. It should include:
- Name, role, timezone
- Family/household details (kids, partner, pets — whatever shapes my schedule)
- Key clients or collaborators
- Daily tools (Gmail, Calendar, Slack, Notion, etc.)
- Communication preference (SMS for alerts, email for long-form, etc.)

Show me what you drafted. Ask: "Anything wrong or missing?"

### Round 2 — Rules (what it's allowed to do)
Based on my Command Center, propose my rules. These are always-on guardrails and conditional shortcuts:
- Always-on: boundaries (never send without approval, always cite sources, etc.)
- Conditional: shortcuts ("looks good" = approved, "hold" = pause everything)
- Conditional: context-aware (Sunday = no proactive SMS, 3+ urgent items = alert immediately)

Show me the list. Ask: "Any rules to add, remove, or change?"

### Round 3 — Persona (how it sounds)
Based on how I write in my Command Center, define my Chief of Staff persona:
- Voice style (direct? warm? casual? professional?)
- Sentence length and vocabulary
- What it should never sound like (corporate, fake enthusiasm, etc.)
- Operating mode (proactive partner, not reactive chatbot)

Show me the persona prompt. Ask: "Does this sound like someone you'd want running your operations?"

### Round 4 — Skills (what jobs it does)
I want 9 jobs across three life areas:

**Household (3):**
- Morning Briefing — calendar + priorities + family logistics
- Household Planner — weekly meals + errands + appointments  
- Family Calendar Sync — who needs to be where today

**Personal (3):**
- Morning Intention — the one thing that matters today
- Brain Dump → Clarity — messy thoughts into organized actions
- Weekly Reflection — what I accomplished, patterns, next week's priorities

**Business (3):**
- Follow-up Tracker — surface stale promises before they're embarrassing
- Content Draft — write in my voice, not generic AI voice
- Evening Wind-down — capture the day, plan tomorrow, be done

For each job, define:
- **Trigger**: when it runs (schedule + manual phrases)
- **Steps**: the exact checklist (1-6 steps max)
- **Definition of Done**: the specific output that means "job complete"
- **Delivery**: how it reaches me (SMS, email, or saved to file)

Show me all 9. Ask: "Any jobs to remove? Any to add? Schedule times to adjust?"

### Round 5 — Automations (when it acts on its own)
Based on the skills and my schedule, propose 5 automations:
1. Family Calendar Sync — early morning weekdays
2. Morning Briefing — before my workday starts
3. Follow-up Tracker — end of workday
4. Evening Wind-down — when I should stop working
5. Weekly Reflection — Sunday evening

Use RRULE format. Show me the schedule. Ask: "Times look right? Any to change?"

### Round 6 — Files (its workspace)
Propose the folder structure Zo will use to store notes, digests, drafts, and context files.

Show the structure. Ask: "Makes sense?"

---

## After all 6 rounds:

Output the **COMPLETE Zo setup prompt** — a single document I paste into Zo that creates everything:
- Bio
- Rules (numbered list)
- Persona (name + full prompt)
- Skills (9 SKILL.md blocks with frontmatter)
- Automations (5 scheduled jobs with RRULE)
- File structure

## Important rules for you:
- Use my REAL details from the Command Center. Real names, real tools, real schedules. Don't generalize.
- If my Command Center doesn't have info for something, ASK ME — don't guess.
- Each round: show your work, confirm, then move on. Don't skip ahead.
- The 9-job structure is intentional. Don't add extras unless I ask.
- Keep it conversational. This isn't a form — it's a working session.
- The final output must be paste-ready. Zero editing needed.
