# Module 02 — Agent as Employee

> **Phase: ABSORB** | Time: ~20 min | No tools needed yet

---

## The Mental Model

Imagine you just hired a brilliant employee. It's their first day. They're talented, fast, and eager. But they know **nothing** about your business.

What do they need to succeed?

| What They Need | AI Equivalent | Zo Primitive |
|---|---|---|
| "About the boss" card on their desk | System context about you | **Bio** |
| Employee handbook — what's allowed, what's not | Behavioral constraints | **Rules** |
| Dress code per occasion | Voice and behavior per context | **Personas** |
| SOPs on the cubicle wall | Step-by-step procedures | **Skills** |
| Daily/weekly routines | Scheduled tasks | **Automations** |
| Filing cabinet — client notes, templates, past work | Reference material and growing knowledge | **Files** |

This isn't a metaphor. It's a design pattern. Every time you configure a Zo primitive, you're doing exactly what a good manager does when onboarding a new hire.

## Defining the Workload: Task Loops

An agent isn't useful because it exists. It's useful because it has **work to do**. The work comes in three forms:

### 1. On-Demand Tasks (You Ask, It Does)

You message Zo: "Summarize my unread emails from this week." Zo reads your Gmail, writes a summary, sends it back.

This is the chatbot pattern — but with tools. The difference from ChatGPT is that Zo can actually *read* your email, not just ask you to paste it.

### 2. Triggered Tasks (Something Happens, It Responds)

You set a Rule: "When I say 'log a call with [name]', update their client file with the date, duration, and key takeaways."

This is event-driven work. The trigger is your message; the response is a multi-step procedure.

### 3. Scheduled Tasks (It Acts Without You Asking)

You set an Automation: "Every weekday at 7:30 AM, check my calendar and email, write a 3-bullet briefing, text it to me."

This is where the agent becomes a system. It works while you sleep. It doesn't wait for you to remember to ask.

## The Task Loop

Every task — on-demand, triggered, or scheduled — follows the same loop:

```
  RECEIVE              PLAN                EXECUTE             VERIFY
    |                   |                    |                    |
    v                   v                    v                    v
  Task arrives       Agent breaks it      Calls tools,        Checks: did I
  (prompt +          into steps           reads files,        hit the definition
   context)          (using skills        takes actions       of done?
                      if available)
```

For this loop to work, **you** must provide three things:

1. **All the right information** — file paths, client names, tool references, constraints. Don't make the agent guess.
2. **A clear definition of done** — "Send a 3-bullet SMS summary by 8am" not "keep me updated."
3. **The right primitives configured** — Bio (who you are), Rules (what's forbidden), Skills (how to do it), Files (what to reference).

## Classifying Your Work

Apply these filters to your tasks to decide what each one becomes:

```
  Does it happen on a schedule?
    YES --> AUTOMATION (set the schedule, write the instructions)
    NO  --> Is it the same way every time?
              YES --> SKILL (write the steps, Zo follows when triggered)
              NO  --> Does it need my approval before acting?
                        YES --> RULE + SKILL (build workflow + add checkpoint)
                        NO  --> Is it a simple boundary?
                                  YES --> RULE ("never do X" / "always do Y")
                                  NO  --> Just ask Zo in conversation
```

## The If/Then Framework

Every repeating decision in your day is an if/then:

- "If a client emails, then I check their file and draft a reply."
- "If it's Monday, then I review last week's follow-ups."
- "If an invoice is overdue, then I send a reminder."

Each one maps to a primitive:

| Pattern | Zo Primitive |
|---|---|
| Simple boundary ("if X, never do Y") | Rule |
| Multi-step response ("if X, do A then B then C") | Skill |
| Time-triggered ("every Monday at 9am") | Automation |
| Needs approval ("draft it, don't send it") | Skill + Rule |

### Exercise: Map Your If/Thens

Take 5 minutes. Write down 5 repeating decisions you handle manually:

```
1. If _________________, then I _________________
2. If _________________, then I _________________
3. If _________________, then I _________________
4. If _________________, then I _________________
5. If _________________, then I _________________
```

For each one, label it: **Rule**, **Skill**, or **Automation**.

You'll use this list in Module 05 when you build your email assistant — one of these if/thens will become your first real Zo skill.

## All Six Pieces Working Together

Here's the scenario that shows it all:

> **7:30 AM, Monday. You're still in bed.**
>
> Your **automation** fires. Zo wakes up, reads your **Bio** (knows you, your clients, your priorities). Follows your **Rules** (only text if something important). Activates the morning-briefing **Skill** (checks calendar, scans email, reads client **files**). Writes the brief in your **Persona's** voice (concise, direct). Texts it to you.
>
> You read it in 30 seconds. Reply "lgtm" — your **shortcut rule** kicks in: "treat as approval, proceed." Zo drafts the follow-up emails and saves them to your drafts folder.
>
> **That's all six pieces. Working together. Without you building anything technical.**

## The Perception Gap

One thing most people don't realize about today's AI agents:

| What AI Tools Know Well | What AI Tools Don't Know Well |
|---|---|
| Which tools they have access to | When they're hallucinating |
| Their harness configuration | When their context window is saturating |
| The tool-calling protocol | Their own limitations |
| How to read their system prompts | What they don't know — they fill gaps with guesses |

**This is the gap you fill.** Understanding the limitations of both the model *and* the harness is the single most valuable skill you can develop. The AI won't tell you it's failing — you need to know where it's likely to fail *before* it does.

| Limitation | How to Hedge |
|---|---|
| Context saturation | Break long tasks into focused subtasks. Use skills to keep instructions tight. |
| Execution drift | Write skills with explicit step sequences. Include definitions of done. |
| Hallucination | Ground the agent in files and tool results. Rules like "always cite your source" help. |
| No true persistence | This is exactly what Bio, Files, and Skills solve. But you must set them up. |

## Key Takeaways

1. **Treat your agent like a new hire.** Onboard it properly — Bio, Rules, Persona, Skills, Files.
2. **Define the workload.** On-demand, triggered, and scheduled tasks each need different primitives.
3. **Every repeating decision is an if/then.** Map each one to a Rule, Skill, or Automation.
4. **The task loop requires a definition of done.** Vague instructions produce vague results.
5. **You are the manager.** The AI won't tell you when it's failing. Know the limitations.

---

**Next: [Module 03 — Platform Tour](03-platform-tour.md)**
