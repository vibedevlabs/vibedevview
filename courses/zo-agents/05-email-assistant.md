# Module 05 — Build an Email Assistant (Mirror Exercise)

> **Phase: MIRROR** | Time: ~45 min | You'll need: Claude + Zo + Gmail connected

---

## What You're Building

A working email assistant that:
1. Scans your inbox every morning
2. Identifies what matters based on *your* priorities
3. Writes a concise daily digest
4. Texts it to you at your preferred time

This isn't a demo. By the end of this module, you'll have a real automation running on Zo that processes your actual email and delivers a real SMS digest.

## The Approach

Instead of guessing what matters in your inbox, we'll have Claude **interview you** — asking targeted questions about your email habits, then generating the final Zo prompt that sets everything up.

This mirrors how a good executive assistant would onboard: they'd shadow you for a week, ask smart questions, then build their own system for handling your inbox.

---

## Part 1: The Claude Inbox Interview

Open [claude.ai](https://claude.ai) and paste this prompt:

### Prompt: Inbox Interview

```
You are an expert executive assistant onboarding with a new principal. Your job
is to understand their inbox deeply enough to build a daily email digest system.

Interview me about my inbox. Ask me these questions one at a time (wait for my
answer before asking the next). Be conversational, not robotic.

ROUND 1 — VOLUME & SHAPE
1. How many emails do you get per day, roughly? (10? 50? 200?)
2. What percentage actually need your attention vs. noise?
3. Do you use labels, folders, or filters currently? What's your system?

ROUND 2 — WHO MATTERS
4. Name 3-5 people whose emails you always read immediately.
5. Are there domains or senders that are always noise? (newsletters you
   never read, automated notifications, etc.)
6. Are there any email addresses that should trigger an alert — like a
   client, your boss, or a specific vendor?

ROUND 3 — WHAT MATTERS
7. What types of emails require action from you? (approvals, scheduling,
   client requests, invoices, etc.)
8. What's an email that looks urgent but actually isn't? Give me an example.
9. Is there anything time-sensitive that comes by email? (e.g., meeting
   changes, payment confirmations, shipping notifications)

ROUND 4 — YOUR RHYTHM
10. When do you currently check email? How many times per day?
11. What time would you want your daily digest? (e.g., 7:30am before work)
12. How do you want to receive it? (SMS, email summary, Slack, etc.)
13. How long should the digest be? (3 bullets? 5? a full summary?)

ROUND 5 — THE RULES
14. Should the system ever draft replies for you, or just summarize?
15. Are there emails it should auto-archive or mark as read?
16. What should it do with emails from unknown senders?
17. Is there anything it should NEVER do? (e.g., never delete, never
    reply on your behalf, never forward)

After I've answered all questions, generate a COMPLETE Zo setup prompt
that I can paste directly into Zo to create:

1. A SKILL called "daily-email-digest" with step-by-step instructions
2. An AUTOMATION that runs the skill on my preferred schedule
3. RULES specific to email handling
4. A FILE template for the digest output (saved to /home/workspace/Digests/)

Write the Zo prompt so it creates everything in one shot. Include my
specific answers — real names, real senders, real rules. Don't generalize.
```

---

## Part 2: Do the Interview

Go through the interview with Claude. Answer honestly — the more specific you are, the better your digest will be.

**Tips for better answers:**
- Name real people: "Sarah from Acme Corp, James at Bloom Agency"
- Name real noise: "anything from no-reply@github.com, Jira notifications"
- Be specific about timing: "7:15am EST, before I check my phone"
- Be specific about format: "3 bullets max, each under 20 words"

## Part 3: Get the Zo Setup Prompt

After the interview, Claude will generate a complete Zo setup prompt. It should include:

### The Skill (daily-email-digest)

A `SKILL.md` file with steps like:

```
1. Check Gmail for unread emails from the last 12 hours
2. Filter: prioritize emails from [your VIP list]
3. Filter: skip emails from [your noise list]
4. For each important email:
   - Extract: sender, subject, first 2 sentences
   - Classify: action-required / FYI / time-sensitive
5. Write digest:
   - ACTION REQUIRED items first
   - TIME-SENSITIVE items second
   - FYI items last
   - Max 5 items total
   - Each item: one line, sender + what it's about
6. Save digest to /home/workspace/Digests/YYYY-MM-DD.md
7. Send via [your preferred channel]
```

### The Automation

```
Schedule: FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=7;BYMINUTE=15
Delivery: sms
Instruction: [the complete instruction Claude generated]
```

### The Rules

```
"Never reply to any email without explicit approval."
"Never delete or archive emails — only read and summarize."
"If an email from [VIP list] contains the word 'urgent', send
 an immediate SMS alert — don't wait for the digest."
```

## Part 4: Bootstrap in Zo

1. Go to [zo.computer](https://zo.computer)
2. Make sure **Gmail is connected** (Settings > Integrations > Gmail)
3. Paste the complete Zo setup prompt Claude generated
4. Watch Zo create everything

## Part 5: Verify

Run these checks:

```
List my skills — do you see "daily-email-digest"?
List my automations — is there one scheduled for [your time]?
List my rules — are the email rules there?
Show me the files in /home/workspace/Digests/
```

### Manual Test

Before waiting for the automation to fire, test the skill manually:

```
Run the daily-email-digest skill right now and show me the result.
```

Review the output:
- Did it find real emails?
- Did it prioritize correctly?
- Is the format what you wanted?
- Did it respect the rules (no replies, no deletions)?

### Iterate

If something's off:

| Problem | Fix |
|---|---|
| Too many items in the digest | "Update the skill to show max 3 items" |
| Missing emails from a VIP | "Add [name] to the VIP list in the skill" |
| Including noise | "Add [sender] to the skip list" |
| Wrong tone | "Make the digest more casual — bullet points, no formal language" |
| Digest too long for SMS | "Keep each item under 15 words, total under 400 characters" |

## Part 6: The Upgrade Path

Once your basic digest is working, consider these expansions:

### Level 2: Smart Triage
Add a rule: "If more than 3 action-required emails, send an alert SMS immediately — don't wait for the morning digest."

### Level 3: Draft Replies
Add a skill: "For each action-required email, draft a reply in my voice and save to /home/workspace/Drafts/. Don't send — just save."

### Level 4: Weekly Rollup
Add an automation: "Every Friday at 4pm, summarize the week's digests. How many emails processed, who wrote the most, what themes emerged. Email me the summary."

### Level 5: Full Chief of Staff
Combine the email digest with calendar prep, follow-up tracking, and client file updates. This is where the agent becomes a system — not just a single skill, but a coordinated task group.

---

## What You Just Built

Take a step back. You:

1. Had Claude **interview you** about your actual inbox
2. Claude generated a **complete Zo configuration** from your answers
3. Zo **created the entire system** — skill, automation, rules, file structure
4. You **tested it** with real email
5. You know how to **iterate** when something's off

This is the loop. Claude designs. Zo builds. You improve. The skill is moving between thinking and building.

---

**Next: [Module 06 — Export and Share](06-export-and-share.md)**
