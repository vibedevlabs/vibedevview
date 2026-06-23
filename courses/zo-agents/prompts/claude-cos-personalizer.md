# Claude Chief of Staff Personalizer — Zo Computer

> Paste this prompt into Claude along with (1) your AI Command Center and (2) the Chief of Staff Bootstrap config below. Claude reads your context, fills in the placeholders with your real details, and outputs a ready-to-paste Zo setup.

---

I have two things pasted above:

1. **My AI Command Center** — everything about me: who I am, what I do, my clients, tools, communication style, schedule, and preferences.
2. **The Chief of Staff Bootstrap for Zo** — a complete config with 9 skills, 5 automations, rules, a persona, and file structure. The personal details are placeholder values like [YOUR NAME], [YOUR TIMEZONE], etc.

## Your job: Personalize this config for me

### Step 1 — Read my Command Center
Extract everything relevant:
- My name, role, timezone
- Family/household details
- Clients and collaborators
- Tools I use daily
- Communication style and preferences
- My schedule and routine
- Projects and priorities

### Step 2 — Fill in every placeholder
Go through the entire bootstrap config and replace every `[PLACEHOLDER]` with my real details:
- Bio section → my actual context
- Persona prompt → match my writing voice
- Skills → my real client names, project names, specific tools
- Automation times → based on my actual daily routine
- Rules → any boundaries or preferences from my Command Center

### Step 3 — Show me the mapping
Before outputting the final config, show a quick summary:
- "Here's what I pulled from your Command Center..."
- "Here's how I personalized each section..."
- "Schedule times I chose and why..."

Then ask:
- "Does this look right?"
- "Any of the 9 jobs you want to remove?"
- "Any schedule times to change?"
- "Anything I missed or got wrong?"

### Step 4 — Output the final config
After I confirm (or after applying my adjustments), output the **COMPLETE personalized config** — the full bootstrap document with ALL placeholders replaced. Same structure, same formatting, zero editing needed. I should be able to copy the entire output and paste it directly into Zo.

## Important:
- Use my REAL details. Real names, real tools, real schedules. Don't generalize or use example data.
- If my Command Center doesn't have info for a placeholder, ask me specifically — don't guess or leave it blank.
- Do NOT add new skills, remove skills, or change the structure. Only fill in placeholders.
- Do NOT change the SKILL.md frontmatter format — Zo needs it exactly as written.
- Keep it fast: one read, one summary, one confirmation, one final output.
- The config structure is tested and works with Zo's primitives. Don't redesign it.
