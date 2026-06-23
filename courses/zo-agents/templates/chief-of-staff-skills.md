# Chief of Staff — 9 Jobs to Be Done

> These are Zo Skill templates. Each one becomes a SKILL.md in `/home/workspace/Skills/`. Students customize triggers, steps, and schedules based on their Claude interview answers.

---

## HOUSEHOLD

### 1. Morning Briefing

```yaml
---
name: morning-briefing
description: Start the day with clarity — calendar, priorities, family logistics
compatibility: Created for Zo Computer
metadata:
  author: zo-agents-course
  category: Household
  display-name: Morning Briefing
  emoji: "☀️"
  version: "1.0"
allowed-tools: use_google_calendar use_gmail send_sms read_file edit_file
---
```

**Trigger:** 7:30 AM weekdays (automation) or "morning briefing" / "what's today look like"

**Steps:**
1. Check Google Calendar for today's events — meetings, appointments, kid activities
2. Check Gmail for anything flagged or from VIP senders (last 12 hours)
3. Read `/home/workspace/Notes/` for yesterday's evening note — any carryovers?
4. Compile into a scannable brief: TOP 3 priorities, CALENDAR highlights, HEADS UP (anything needing attention)
5. Deliver via SMS

**Definition of Done:** SMS delivered with today's brief. No longer than 5 bullet points. Saved to `/home/workspace/Digests/YYYY-MM-DD-morning.md`.

---

### 2. Meal & Household Planner

```yaml
---
name: household-planner
description: Weekly meal plan + household task tracking so nothing falls through the cracks
compatibility: Created for Zo Computer
metadata:
  author: zo-agents-course
  category: Household
  display-name: Household Planner
  emoji: "🏠"
  version: "1.0"
allowed-tools: read_file edit_file create_file send_sms search_the_web
---
```

**Trigger:** Sunday 10 AM (automation) or "plan the week" / "what do we need from the store"

**Steps:**
1. Read `/home/workspace/Context/household.md` for dietary preferences, family size, recurring needs
2. Check calendar for the week — which nights are busy (need quick meals)?
3. Propose 5-7 dinners based on schedule + preferences
4. Generate a grocery list grouped by store section
5. Check `/home/workspace/Notes/` for any household tasks mentioned this week (repairs, appointments to schedule, errands)
6. Compile: MEAL PLAN + GROCERY LIST + HOUSEHOLD TASKS for the week
7. Deliver via SMS (summary) and save full plan to file

**Definition of Done:** Meal plan + grocery list + household tasks saved to `/home/workspace/Notes/YYYY-MM-DD-weekly-plan.md`. Summary SMS sent.

---

### 3. Family Calendar Sync

```yaml
---
name: family-calendar-sync
description: Daily digest of who needs to be where — school, activities, appointments
compatibility: Created for Zo Computer
metadata:
  author: zo-agents-course
  category: Household
  display-name: Family Calendar Sync
  emoji: "📅"
  version: "1.0"
allowed-tools: use_google_calendar send_sms read_file
---
```

**Trigger:** 6:30 AM weekdays (automation) or "what's the family schedule today"

**Steps:**
1. Pull all events from Google Calendar for today (family calendar + personal)
2. Identify logistics: school drop-off/pickup times, activities, appointments
3. Flag conflicts or tight transitions (e.g., meeting ends at 3:15 but pickup is at 3:20)
4. Format as a timeline: WHO needs to be WHERE by WHEN
5. Deliver via SMS

**Definition of Done:** Family schedule SMS delivered before 7 AM. Any conflicts flagged explicitly.

---

## PERSONAL

### 4. Morning Intention

```yaml
---
name: morning-intention
description: Ground your day with priorities and intention before the chaos starts
compatibility: Created for Zo Computer
metadata:
  author: zo-agents-course
  category: Personal
  display-name: Morning Intention
  emoji: "🎯"
  version: "1.0"
allowed-tools: read_file send_sms edit_file
---
```

**Trigger:** Part of morning briefing or standalone — "set my intention" / "what matters today"

**Steps:**
1. Read yesterday's evening note — what was planned for today?
2. Read current priorities from `/home/workspace/Context/projects.md`
3. Identify the ONE thing that would make today a win
4. Frame it: "Today's intention: [one thing]. If you do nothing else, do this."
5. Deliver via SMS

**Definition of Done:** Intention SMS sent. One sentence. Clear.

---

### 5. Brain Dump → Clarity

```yaml
---
name: brain-dump
description: Turn a stream of messy thoughts into organized, actionable items
compatibility: Created for Zo Computer
metadata:
  author: zo-agents-course
  category: Personal
  display-name: Brain Dump
  emoji: "🧠"
  version: "1.0"
allowed-tools: read_file edit_file create_file send_sms
---
```

**Trigger:** "brain dump:" prefix or "my head is full" / "I need to get this out"

**Steps:**
1. Receive the unstructured brain dump (text, voice transcript, messy list)
2. Read `/home/workspace/Context/projects.md` for current project context
3. Classify each item: URGENT (do today) / THIS WEEK / SOMEDAY / LET GO
4. For urgent items: identify the concrete next action (not the project — the action)
5. For "let go" items: name them explicitly ("This isn't yours to carry right now")
6. Save organized dump to `/home/workspace/Notes/YYYY-MM-DD-braindump.md`
7. Send summary via SMS — just the urgent items + next actions

**Definition of Done:** Brain dump organized and saved. Urgent items + next actions delivered via SMS. Nothing lost.

---

### 6. Weekly Reflection

```yaml
---
name: weekly-reflection
description: Sunday evening — see what you accomplished, not just what's left
compatibility: Created for Zo Computer
metadata:
  author: zo-agents-course
  category: Personal
  display-name: Weekly Reflection
  emoji: "📝"
  version: "1.0"
allowed-tools: read_file edit_file create_file send_email
---
```

**Trigger:** Sunday 7 PM (automation) or "weekly reflection" / "how'd this week go"

**Steps:**
1. Read all daily notes from this week (`/home/workspace/Notes/YYYY-MM-DD-*.md`)
2. Read all digests from this week
3. Compile: WINS (things completed, progress made), PATTERNS (what kept coming up), INCOMPLETE (what rolled over), ENERGY (what drained vs energized)
4. Propose 3 priorities for next week based on patterns
5. End with one genuine acknowledgment of effort
6. Save to `/home/workspace/Digests/YYYY-WXX-reflection.md`
7. Deliver via email (longer format)

**Definition of Done:** Weekly reflection saved + emailed. Includes wins, patterns, and next week's top 3.

---

## BUSINESS

### 7. Client Follow-up Tracker

```yaml
---
name: follow-up-tracker
description: Track every promise you made — surface anything going stale before it's embarrassing
compatibility: Created for Zo Computer
metadata:
  author: zo-agents-course
  category: Business
  display-name: Follow-up Tracker
  emoji: "📋"
  version: "1.0"
allowed-tools: use_gmail read_file edit_file send_sms
---
```

**Trigger:** 5 PM weekdays (automation) or "check my follow-ups" / "what am I forgetting"

**Steps:**
1. Read `/home/workspace/Context/clients.md` for active client list
2. Scan Gmail sent folder (last 7 days) for promises made ("I'll send you...", "Let me follow up on...", "I'll have this by...")
3. Cross-reference with completed items in daily notes
4. Flag anything promised but not delivered, especially if 48+ hours old
5. Format: OVERDUE (needs action NOW), COMING DUE (next 48 hours), ON TRACK
6. Deliver via SMS if anything is overdue; otherwise save silently

**Definition of Done:** Follow-up report saved to `/home/workspace/Notes/YYYY-MM-DD-followups.md`. SMS sent only if something is overdue.

---

### 8. Content in My Voice

```yaml
---
name: content-draft
description: Draft posts, emails, or captions that sound like you — not like AI
compatibility: Created for Zo Computer
metadata:
  author: zo-agents-course
  category: Business
  display-name: Content Draft
  emoji: "✍️"
  version: "1.0"
allowed-tools: read_file create_file edit_file
---
```

**Trigger:** "draft [type] about [topic]" / "write a post about..." / "help me write..."

**Steps:**
1. Read `/home/workspace/Context/voice-examples.md` for the user's writing style
2. Read `/home/workspace/Context/bio.md` for audience and positioning context
3. Clarify if needed: what type (LinkedIn post, email, caption, newsletter)? What's the key message? Who's the audience?
4. Write a first draft matching their voice — sentence length, vocabulary, energy
5. Present the draft with a note: "Here's your first pass. What should I adjust?"
6. Save to `/home/workspace/Drafts/YYYY-MM-DD-[topic-slug].md`

**Definition of Done:** Draft saved to Drafts/ and presented for review. Matches the user's voice (not generic AI voice).

---

### 9. Evening Wind-down

```yaml
---
name: evening-winddown
description: Capture the day, clear your head, plan tomorrow — then be done
compatibility: Created for Zo Computer
metadata:
  author: zo-agents-course
  category: Business
  display-name: Evening Wind-down
  emoji: "🌙"
  version: "1.0"
allowed-tools: use_google_calendar use_gmail read_file edit_file create_file send_sms
---
```

**Trigger:** 6 PM weekdays (automation) or "wrap up" / "end of day"

**Steps:**
1. Check what was on today's calendar — any meetings that need follow-up notes?
2. Read the morning briefing for today — what was planned?
3. Ask (or infer from daily notes): What got done? What didn't? Any wins?
4. Check tomorrow's calendar — anything to prep for?
5. Compile daily note: DONE, CARRIED OVER, WINS, TOMORROW'S TOP 3
6. Save to `/home/workspace/Notes/YYYY-MM-DD.md`
7. Deliver summary via SMS — keep it under 5 lines

**Definition of Done:** Daily note saved. Tomorrow's top 3 identified. SMS summary delivered. The user can close their laptop and be done.
