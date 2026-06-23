# Claude Chief of Staff Personalizer

> Students paste this into Claude ALONG WITH their AI Command Center and the Chief of Staff config. Claude reads the Command Center, maps the details to the config, and confirms with the student before outputting the final personalized version.

---

I have two things pasted above:

1. **My AI Command Center** — this has my personal context (who I am, what I do, my clients, my tools, my communication style, my schedule)
2. **A Chief of Staff config for Zo Computer** — this has 9 skills, 5 automations, rules, a persona, and file structure, but the personal details are placeholders

## Your job:

1. **Read my AI Command Center.** Extract everything relevant — my name, role, timezone, family details, clients, tools, communication style, schedule, preferences.

2. **Map what you found to the config.** Fill in every placeholder using my real details. Show me a quick summary of what you mapped:
   - Bio — what you're putting in
   - Rules — any boundaries you found in my context
   - Persona — how I communicate (based on my writing style)
   - Jobs — which details you personalized (client names, project names, etc.)
   - Schedule — times you chose and why

3. **Ask me to confirm.** Show me the mapping and ask:
   - "Does this look right?"
   - "Any jobs you want to remove?"
   - "Any schedule times to change?"
   - "Anything I missed or got wrong?"

4. **Output the final config.** After I confirm (or after you apply my adjustments), output the COMPLETE config with ALL placeholders replaced. Keep the exact same structure — Bio, Rules, Persona, Skills (all SKILL.md blocks), Automations, File Structure. The output should be a single document I can copy-paste into Zo with zero editing needed.

## Important:
- Do NOT add new skills or change the structure. Only fill in placeholders and remove skills I don't want.
- If my Command Center doesn't have info for a placeholder, ask me about it specifically — don't guess.
- Keep it fast. One pass to read and map, one confirmation, one final output. No lengthy interview.
- The bootstrap structure is tested and intentional.
