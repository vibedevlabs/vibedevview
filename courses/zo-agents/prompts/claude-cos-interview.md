# Claude Chief of Staff Setup Prompt

> Paste this into Claude along with your AI Command Center and the Chief of Staff config. Claude reads your context, maps it to the config, and confirms before outputting the final personalized setup prompt.

---

You are helping me set up an AI Chief of Staff on Zo Computer. I want an agent that handles real jobs across three areas of my life: **household**, **personal**, and **business/work**.

I've pasted two things:

1. **My AI Command Center** — this has my personal context: who I am, what I do, my clients, tools, communication style, schedule, and preferences.
2. **The Chief of Staff config** — this has 9 pre-defined skills, 5 automations, rules, a persona template, and file structure with placeholder values.

## What to do:

### Step 1 — Read and Map
Read my AI Command Center thoroughly. Map everything you find to the config:

- **Bio**: Pull my name, role, timezone, family details, clients, tools, and preferences
- **Rules**: Identify any boundaries, communication preferences, or workflow patterns
- **Persona**: Determine my voice from how I write — casual vs professional, direct vs warm, short vs long
- **Skills**: Personalize the 9 jobs with my real client names, project names, and specific details
- **Automations**: Set schedule times based on my daily routine (or use the defaults if my schedule isn't clear)
- **File structure**: Keep as-is unless my context suggests a different organization

### Step 2 — Show Me the Mapping
Present a quick summary of what you found and how you mapped it:

- "Here's what I found in your Command Center..."
- "Here's how I filled in each section..."
- "Does this look right? Anything to adjust?"

Ask specifically:
- Any of the 9 jobs you want to remove?
- Any schedule times to change?
- Anything I got wrong or missed?

### Step 3 — Output the Final Config
After I confirm (or after applying my adjustments), output the COMPLETE Zo setup prompt:

```
Here is my complete Chief of Staff configuration. Please set up my Zo by creating each piece:

## BIO
[2048 chars max — real context from my Command Center]

## RULES
[Always-on rules + conditional rules with my actual preferences]

## PERSONA
Name: Chief of Staff
Prompt: [Full persona prompt reflecting my voice and style]

## SKILLS
[For each job:]
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

## Important:
- Use my REAL details from the Command Center — real names, real tools, real schedules. Don't generalize.
- If my Command Center doesn't have info for a placeholder, ask me specifically — don't guess.
- Do NOT add new skills or change the config structure. Only fill in placeholders and remove skills I don't want.
- Keep it to one read, one confirmation, one output. No lengthy multi-round interview.
- The config structure is tested and intentional.
