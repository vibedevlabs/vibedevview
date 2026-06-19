---
name: daily-email-digest
description: >
  Scan inbox and create a prioritized daily email digest. Use when asked
  for email summary, inbox check, daily digest, morning briefing, email
  triage, or "what's in my inbox."
compatibility: Created for Zo Computer
metadata:
  author: [your-name]
  category: Productivity
  display-name: Daily Email Digest
  version: "1.0"
allowed-tools: use_gmail search_files create_or_rewrite_file send_sms
---

# Daily Email Digest

## Read first
1. Read `/home/workspace/email-config.md` (VIP list, noise list, preferences)

## Step 1: Check Gmail
Use Gmail to search for unread emails from the last 12 hours.
Pull: sender, subject, date, first 2-3 sentences of body.

## Step 2: Filter — VIPs First
Separate emails into tiers:
- **TIER 1 (VIP):** Emails from the VIP list in email-config.md
- **TIER 2 (Action Required):** Emails that request something from the user
  (approvals, scheduling, questions, invoices)
- **TIER 3 (FYI):** Informational emails worth knowing about
- **SKIP:** Emails from the noise list — do not include in digest

## Step 3: Classify Each Email
For each non-skipped email, assign a tag:
- `ACTION` — requires a response or decision
- `TIME-SENSITIVE` — has a deadline within 48 hours
- `FYI` — informational, no action needed

## Step 4: Write the Digest
Format:

```
DAILY DIGEST — [date]
[count] emails worth your attention

ACTION REQUIRED:
- [sender]: [subject] — [one-sentence summary]

TIME-SENSITIVE:
- [sender]: [subject] — [deadline + what's needed]

FYI:
- [sender]: [subject] — [one-sentence summary]

---
[total emails checked] emails scanned. [count skipped] filtered out.
```

Rules:
- Max 5 items total (prioritize ACTION and TIME-SENSITIVE)
- Each item: one line, under 20 words
- If zero important emails: "Inbox clear. Nothing needs your attention."

## Step 5: Save to File
Save the digest to `/home/workspace/Digests/[YYYY-MM-DD].md`

## Step 6: Deliver
Send the digest via the user's preferred channel (configured in automation).
If SMS: keep total under 400 characters — abbreviate if needed.

## Definition of Done
- Digest saved to /home/workspace/Digests/
- Digest delivered via configured channel
- No emails were replied to, deleted, archived, or forwarded
