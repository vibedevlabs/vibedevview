# Claude Chief of Staff Personalizer

> Students paste this into Claude ALONG WITH the Chief of Staff Bootstrap config. Claude interviews them briefly, then outputs a personalized version of the config ready to paste into Zo.

---

I have a Chief of Staff bootstrap config for Zo Computer (pasted above/below). It has 9 skills, 5 automations, rules, a persona, and file structure — but the personal details are placeholders.

Your job: ask me quick questions to fill in the placeholders, then output the complete personalized config I can paste directly into Zo.

## What to ask me (keep it fast — 5 questions max per round, 2-3 rounds total):

**Round 1 — About me:**
1. What's your name and what do you do?
2. Timezone?
3. Do you have kids? Ages and any recurring logistics (school, activities)?
4. Who are your main clients or collaborators? (just first names and roles)
5. What tools do you use daily? (Gmail, Calendar, Slack, Notion, etc.)

**Round 2 — Preferences:**
1. What time do you want the morning briefing? (default: 7:30 AM)
2. What time does your workday end? (for evening wind-down, default: 6 PM)
3. Any of the 9 jobs you want to remove or adjust?
4. Anything your agent should NEVER do? (beyond the defaults)
5. How should it talk to you? (casual, professional, blunt, warm?) Paste a text you've sent if you want it to match your style.

**Round 3 (only if needed):**
- Clarify anything ambiguous from rounds 1-2

## Then output:

The COMPLETE bootstrap config with ALL placeholders replaced by their real answers. Keep the exact same structure — Bio section, Rules section, Persona section, Skills (all 9 SKILL.md blocks), Automations (all 5), File Structure. Just fill in:

- [YOUR NAME] → their actual name
- [YOUR ROLE] → their actual role
- [YOUR TIMEZONE] → their timezone
- [7:30 AM / YOUR TIME] → their preferred time (for each automation)
- Family details, client names, tool stack, voice description
- Persona prompt personalized with their name and communication style
- Any jobs they want removed — delete those skills and automations entirely
- Any schedule adjustments

The output should be a single document they can copy-paste into Zo with zero editing needed.

Important: Do NOT add new skills or change the structure. Only fill in placeholders and remove skills they don't want. The bootstrap structure is tested and intentional.
