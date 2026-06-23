# ZO AGENT CONFIGURATION TEMPLATE

> Fill in each section. Use this as the source of truth for your agent.
> Paste the completed version into Zo using the bootstrap prompt.

---

## BIO

```
[Your name] — [your role/title].

Trusted command channel: [SMS from +1-xxx-xxxx / Slack DM from @handle]

Surface preferences:
- SMS: [what SMS is for — alerts, decisions, quick updates]
- Email: [what email is for — reports, long context]
- Slack: [what Slack is for — day-to-day, drafts]

Active projects:
- [Project 1] ([key contact])
- [Project 2] ([key contact])
- [Project 3] ([key contact])

Current priorities:
- [Priority 1]
- [Priority 2]
- [Priority 3]

Defaults:
- Timezone: [your timezone]
- [Other defaults — invoicing cadence, meeting preferences, etc.]

Voice: [describe your tone — e.g., "Direct, warm, concise. Short sentences."]
```

---

## RULES

### Always-On Rules

```
1. Never send external email without my explicit approval.
2. Default to concise. Short sentences. One idea per sentence.
3. [Your rule — what should it never do?]
4. [Your rule — what should it always do?]
5. [Your rule — tone/voice constraint]
```

### Conditional Rules

```
1. When reply is "looks good" -> Treat as approval. Proceed. Log the decision.
2. When [day/time condition] -> [instruction]
3. When [context condition] -> [instruction]
```

---

## PERSONA

```
Name: [descriptive name — e.g., "Business Operations"]

Prompt:
You are [role description].

Mission:
- [What this agent does for the user — 3-4 bullets]

Operating rhythm:
- On demand: [what triggers on-demand work]
- Scheduled: [what runs automatically]

Voice:
[Specific tone instructions. Include examples if possible.]

What you are NOT:
- [Anti-patterns to avoid]
```

---

## SKILLS

### Skill: [name]

```
Description: [What it does. Include trigger phrases — the words
users would actually say to invoke this skill.]

Steps:
1. [First action — be specific about tools and file paths]
2. [Second action]
3. [Continue...]
N. [Definition of done — how the agent reports completion]

Tools needed: [list of Zo tools this skill uses]
```

(Copy this block for each skill. Aim for 3-5.)

---

## AUTOMATIONS

### Automation: [name]

```
Schedule: [RRULE — e.g., FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=7;BYMINUTE=30]
Delivery: [sms / email / telegram / slack / none]
Model: [default or specific model name]

Instruction:
[Complete instruction. Include everything the automation needs:
 - What to check first
 - Step-by-step protocol
 - File paths to reference
 - How to format output
 - Delivery format and length constraints]
```

(Copy this block for each automation. Aim for 2-4.)

---

## FILE STRUCTURE

```
/home/workspace/
  [Folder 1]/
    [file-1.md]       # [what this file is for]
    [file-2.md]       # [what this file is for]
  [Folder 2]/
    [file-1.md]
  Templates/
    [template-1.md]   # [what this template is for]
  Digests/            # daily/weekly digest archives
  Drafts/             # draft replies and documents
```
