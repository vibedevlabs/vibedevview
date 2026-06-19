---
lesson: ZO-MI5
title: Build an Email Assistant — The Mirror Exercise
track: ZO / MIRROR 2
voice: Ja'dan
---

## 01 · Cold open
phase: MIRROR
duration: 8

SAY:
Time to build something real. By the end of this module, you'll have a working system that scans your inbox every morning, identifies what matters based on your priorities, writes a daily digest, and texts it to you. This isn't a demo. This is your actual email.

SLIDE:
```yaml
frame: N1-title
eyebrow: ZO AGENTS · MIRROR 2
title: Build an Email Assistant
subtitle: Claude interviews you → Zo sets up your daily digest
```

## 02 · The approach
phase: MIRROR
duration: 9

SAY:
Instead of guessing what matters in your inbox, we'll have Claude interview you — asking targeted questions about your email habits. Then Claude generates the final Zo prompt that sets everything up. This mirrors how a good executive assistant onboards. They'd shadow you for a week, ask smart questions, then build their own system for handling your inbox.

SLIDE:
```yaml
frame: C4-steps
eyebrow: THE APPROACH
title: Interview → Generate → Build
body:
  - "Claude interviews you about your inbox (17 questions)"
  - "Claude generates a complete Zo setup prompt"
  - "Zo creates the skill, automation, rules, and files"
  - "You test it with real email and iterate"
```

## 03 · The interview — Volume and Shape
phase: MIRROR
duration: 9

SAY:
The interview has five rounds. Round one: volume and shape. How many emails do you get per day? What percentage actually needs your attention? Do you use labels or filters? These questions size the problem. If you get 200 emails a day and 10 percent matter, the digest needs aggressive filtering. If you get 20 and half matter, it needs to be more inclusive.

SLIDE:
```yaml
frame: C1-bullets
eyebrow: "ROUND 1 — VOLUME & SHAPE"
title: Size the problem
body:
  - "How many emails per day? (10? 50? 200?)"
  - "What percentage needs your attention vs. noise?"
  - "Do you use labels, folders, or filters?"
```

## 04 · The interview — Who and What Matters
phase: MIRROR
duration: 10

SAY:
Round two: who matters. Name three to five people whose emails you always read immediately. Which senders are always noise? Any addresses that should trigger an alert? Round three: what matters. What types of emails require action from you? What looks urgent but actually isn't? Is there anything time-sensitive? Be specific — real names, real senders, real patterns.

SLIDE:
```yaml
frame: C3-compare
title: Who and what matters
columns:
  - heading: "Round 2 — Who"
    items:
      - 3-5 people you always read
      - Senders that are always noise
      - Addresses that trigger alerts
  - heading: "Round 3 — What"
    items:
      - Types that require your action
      - Emails that look urgent but aren't
      - Anything time-sensitive
```

## 05 · The interview — Rhythm and Rules
phase: MIRROR
duration: 10

SAY:
Round four: your rhythm. When do you check email? What time do you want the digest? How do you want to receive it — SMS, email, Slack? How long should it be? Round five: the rules. Should the system draft replies or just summarize? Are there emails to auto-archive? What should it do with unknown senders? And critically — what should it never do? These answers become your Zo rules.

SLIDE:
```yaml
frame: C3-compare
title: Rhythm and rules
columns:
  - heading: "Round 4 — Rhythm"
    items:
      - When do you check email?
      - What time for the digest?
      - How to receive it? (SMS, email, Slack)
      - How long? (3 bullets? 5?)
  - heading: "Round 5 — Rules"
    items:
      - Draft replies or just summarize?
      - Auto-archive anything?
      - Unknown sender handling?
      - What should it NEVER do?
```

## 06 · What Claude generates
phase: MIRROR
duration: 10

SAY:
After the interview, Claude generates four things. A SKILL called daily-email-digest with step-by-step instructions — check Gmail, filter by your VIP list, classify each email as action-required, time-sensitive, or FYI, write the digest, save it, send it. An AUTOMATION on your preferred schedule. RULES specific to email handling — never reply without approval, never delete. And a FILE template for the digest output.

SLIDE:
```yaml
frame: C1-bullets
title: Claude generates four things
body:
  - "SKILL — daily-email-digest with step-by-step instructions"
  - "AUTOMATION — your preferred schedule and delivery channel"
  - "RULES — never reply without approval, never delete"
  - "FILE — digest template saved to /home/workspace/Digests/"
```

## 07 · The skill anatomy
phase: MIRROR
duration: 10

SAY:
Here's what the skill looks like. Step one: check Gmail for unread emails, last 12 hours. Step two: filter — VIPs first, then action-required, then FYI, skip noise. Step three: classify each email — action, time-sensitive, or informational. Step four: write the digest — action items first, max five items, each under 20 words. Step five: save to the Digests folder. Step six: deliver via your preferred channel. Definition of done: digest saved, delivered, no emails modified.

SLIDE:
```yaml
frame: C6-code
eyebrow: SKILL ANATOMY
title: daily-email-digest steps
code: |
  1. Check Gmail — unread, last 12 hours
  2. Filter — VIP > Action > FYI > Skip
  3. Classify — ACTION / TIME-SENSITIVE / FYI
  4. Write digest — max 5 items, <20 words each
  5. Save to /home/workspace/Digests/
  6. Deliver via preferred channel

  Done: saved + delivered + no emails modified
```

## 08 · Bootstrap in Zo
phase: MIRROR
duration: 8

SAY:
Go to Zo. Make sure Gmail is connected in Settings, Integrations. Paste the complete Zo setup prompt Claude generated. Watch Zo create the skill, the automation, the rules, the file structure. Then verify — list skills, list automations, list rules, show the Digests folder. Everything should be there.

SLIDE:
```yaml
frame: C4-steps
eyebrow: BOOTSTRAP
title: Four steps in Zo
body:
  - "1. Connect Gmail (Settings > Integrations)"
  - "2. Paste Claude's generated Zo prompt"
  - "3. Watch Zo create everything"
  - "4. Verify: list skills, automations, rules, files"
```

## 09 · Test it
phase: MIRROR
duration: 8

SAY:
Don't wait for the automation to fire. Test the skill manually. Tell Zo: "run the daily-email-digest skill right now and show me the result." Review the output. Did it find real emails? Did it prioritize correctly? Is the format right? Did it respect the rules — no replies, no deletions? If something's off, iterate. "Add Sarah to the VIP list." "Make each item under 15 words." "Skip Jira notifications."

SLIDE:
```yaml
frame: C5-callout
eyebrow: TEST IT
title: Run it manually first
body:
  - "Tell Zo: 'Run the daily-email-digest skill now'"
  - "Check: did it find real emails?"
  - "Check: did it prioritize correctly?"
  - "Check: does the format match what you wanted?"
  - "Check: did it respect the rules? (no replies, no deletions)"
```

## 10 · The upgrade path
phase: MIRROR
duration: 9

SAY:
Once your basic digest is working, you can level up. Level two: smart triage — if more than three action-required emails, send an alert SMS immediately. Level three: draft replies — save drafts in your voice, don't send them. Level four: weekly rollup — Friday summary of all the week's digests. Level five: full Chief of Staff — combine email, calendar prep, follow-up tracking, and client file updates. That's where the agent becomes a system.

SLIDE:
```yaml
frame: C4-steps
eyebrow: UPGRADE PATH
title: From digest to Chief of Staff
body:
  - "Level 2: Smart triage — alert on 3+ action emails"
  - "Level 3: Draft replies — save in your voice, don't send"
  - "Level 4: Weekly rollup — Friday digest summary"
  - "Level 5: Full Chief of Staff — email + calendar + follow-ups"
```

## 11 · What you just built
phase: MIRROR
duration: 7

SAY:
Step back. You had Claude interview you about your actual inbox. Claude generated a complete Zo configuration from your answers. Zo created the entire system. You tested it with real email. You know how to iterate when something's off. This is the loop. Claude designs. Zo builds. You improve. The skill is moving between thinking and building.

SLIDE:
```yaml
frame: N3-quote
title: Claude designs. Zo builds. You improve. The loop is the skill.
```

## 12 · Outro
phase: MIRROR
duration: 5

SAY:
One more module. You've built it — now let's own it. Export your Zo primitives to GitHub and make them portable.

SLIDE:
```yaml
frame: O1-outro
eyebrow: NEXT
title: Export and Share
subtitle: Push your agent config to GitHub — own it forever
```
