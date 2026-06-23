# Module 01 — The Core Equation

> **Phase: ABSORB** | Time: ~30 min | No tools needed yet

---

## The One Sentence

> **Agent = Model + Harness**

The model is the brain — Claude, GPT, Gemini, whatever you choose. It reasons, writes, plans.

The harness is everything *around* the brain that makes it useful, safe, and reliable. Memory, tools, scheduling, guardrails, context management.

When researchers analyzed the source code of Claude Code — Anthropic's production coding agent — they found something striking:

```
  ┌────────────────────────────────┐
  │  1.6%   AI Decision Logic      │  ← The model reasoning
  │  98.4%  Harness Infrastructure  │  ← Everything else
  └────────────────────────────────┘
```

98.4% of the codebase is harness. Permissions, context management, safety layers, recovery logic, tool routing. The agent loop itself is a simple while-loop. The real engineering lives in the systems around it.

*Source: MBZUAI 46-page analysis of Claude Code (Apr 2026)*

## Why This Matters

Three beliefs that the harness concept corrects:

| Common Belief | Reality |
|---|---|
| "I need a better AI model to get better results." | You often need a **better harness.** The same model with better infrastructure outperforms a bigger model with no infrastructure. |
| "A more complex prompt will fix the problem." | A more complex prompt can't compensate for **missing facts** or the absence of execution controls. |
| "AI is just a chatbot — I type, it responds." | That's one interface. A harness lets AI **loop, use tools, manage context, and operate under guardrails** — more like an employee than a search bar. |

## The Four Elements of Every Harness

Every serious AI agent system has these four components:

### 1. Agent Loop

A cycle of **reason > act > observe > repeat**. The AI doesn't just answer once — it keeps going until the job is done.

```
  reason  -->  act  -->  observe  -->  reason  -->  act  -->  ...  -->  done
```

### 2. Tool Interface

The AI can perceive and change the real world: read files, send emails, browse the web, run commands. Without tools, it's just talking.

### 3. Context Management

The *system* decides what enters and leaves the AI's working memory — not the AI. This includes compaction (summarizing old conversation), dynamic loading (reading files when needed), and progressive skill loading.

### 4. Control Mechanisms

Limits, verification, and deterministic guardrails that **don't depend on the model obeying**. Permission gates, deny-lists, approval checkpoints. If the model hallucinates a decision to send an email, the harness blocks it.

## The Six Primitives: Zo's Implementation of the Harness

Zo Computer implements the harness through **six native primitives** — the building blocks you configure when setting up any agent:

```
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │   Bio    │  │  Rules   │  │ Personas │
  │          │  │          │  │          │
  │ Who you  │  │ What's   │  │ How to   │
  │ are      │  │ allowed  │  │ behave   │
  └──────────┘  └──────────┘  └──────────┘

  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │  Skills  │  │  Autos   │  │  Files   │
  │          │  │          │  │          │
  │ How to   │  │ When to  │  │ What to  │
  │ do things│  │ act      │  │ know     │
  └──────────┘  └──────────┘  └──────────┘
```

Here's what each one does:

### Bio — Your Permanent Profile

- **What:** Persistent context about you. Loaded every conversation.
- **Limit:** 2,048 characters.
- **Think of it as:** The "about the boss" card taped to the employee's desk.

Include: who you are, your clients/projects, communication preferences, current priorities, timezone, tool stack.

### Rules — The Employee Handbook

- **What:** Behavioral constraints — always-on or conditional.
- **Think of it as:** The rules your employee must follow, no exceptions.

Two types:
- **Always-on:** "Never send external email without my approval."
- **Conditional:** When reply is "looks good" > "Treat as approval. Proceed. Log decision."

### Personas — Same Agent, Different Hats

- **What:** Switchable AI profiles that change voice, expertise, and behavior.
- **Think of it as:** Dress code per occasion. Suit for client emails, casual for text messages.
- **Key feature:** Each messaging channel can have a different active persona.

### Skills — The SOPs

- **What:** Repeatable AI workflows packaged as `SKILL.md` files.
- **Think of it as:** Standard Operating Procedures pinned to the cubicle wall.
- **Key feature:** Loaded on-demand — only activated when relevant, so they don't bloat every conversation.
- **Portable:** Same SKILL.md works across Claude, ChatGPT, Copilot, Zo.

### Automations — The Daily Routines

- **What:** Scheduled AI tasks — daily briefings, weekly reports, recurring checks.
- **Think of it as:** The employee's daily/weekly routines that run without you asking.
- **Key feature:** Each automation runs as a fresh agent instance — same tools, same rules, same persona, but no conversation history. Write instructions as if briefing a colleague.

### Files — The Filing Cabinet

- **What:** Any file on the server is potential context. 100GB storage.
- **Think of it as:** The growing filing cabinet. Client notes, templates, past reports.
- **Key feature:** The agent can read AND write files. The more it works, the more it knows.

## How the Primitives Map to the Harness

| Harness Element | Zo Primitive(s) |
|---|---|
| Agent Loop | Built into Zo's core — reason > tool call > observe > repeat |
| Tool Interface | 100+ built-in tools (Gmail, Calendar, web, shell, Stripe, etc.) |
| Context Management | Bio (always loaded) + Files (on demand) + Skills (progressive) |
| Control Mechanisms | Rules (always-on + conditional) + Personas (per-channel behavior) |

## The Decision Tree: Which Primitive When?

| Question | Use This |
|---|---|
| Is it a fact about you or your context? | **Bio** |
| Is it a behavioral constraint (always/never do X)? | **Rule** |
| Is it about how the AI should sound or behave? | **Persona** |
| Is it a procedure (do X, then Y, then Z)? | **Skill** |
| Should it run on a schedule without you asking? | **Automation** |
| Is it reference material, templates, or knowledge? | **Files** |

---

## Check Your Understanding

Before moving on, you should be able to answer:

1. What is the difference between a model and a harness?
2. Name the six Zo primitives and what each one controls.
3. Why does an automation need all context in its instruction (not conversation history)?
4. What's the difference between a Rule and a Skill?

---

**Next: [Module 02 — Agent as Employee](02-agent-as-employee.md)**
