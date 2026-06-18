import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import type {
  AttachResult,
  CorrectRequest,
  DeliverOutcome,
  DeliverPreview,
  DoctorResult,
  DraftBackend,
  DraftRequest,
  DraftResult,
  EngineEvent,
  ExportResult,
  ProduceRequest,
  PublishResult,
  RunResult,
  StatusResult,
} from "../shared/ipc";

const require = createRequire(import.meta.url);

/** Locate the engine on disk: its package root (which contains dist/cli.js). */
export function resolveEngine(): { cliPath: string; root: string } {
  const pkgJson = require.resolve("vibedevview/package.json");
  const root = path.dirname(pkgJson);
  return { cliPath: path.join(root, "dist", "cli.js"), root };
}

/** Where productions live, matching the engine's Workspace.productionsDir(). */
export function productionsDir(): string {
  return process.env.PALMIER_PRODUCTIONS_DIR ?? path.join(homedir(), "hgdw-productions");
}

function lessonDir(lessonId: string): string {
  return path.join(productionsDir(), lessonId);
}

export interface SpawnOpts {
  /** Binary to run the CLI with. In Electron this is process.execPath + ELECTRON_RUN_AS_NODE=1. */
  nodeBin: string;
  /** Extra env (e.g. ELECTRON_RUN_AS_NODE=1, PALMIER_TIMELINE). */
  env?: Record<string, string>;
  args: string[];
  onEvent?: (event: EngineEvent) => void;
  onStderr?: (line: string) => void;
  /** Override the CLI entry (tests point this at a fixture). Defaults to the resolved engine. */
  cliPath?: string;
}

/**
 * Spawn `node <cli.js> --json <args>` and parse its stdout as NDJSON EngineEvents.
 * Resolves once the process exits; collects the {type:"result"} payload if present.
 * Exported (not Electron-coupled) so it can be exercised directly in tests.
 */
export function spawnEngine(opts: SpawnOpts): Promise<RunResult> {
  const cliPath = opts.cliPath ?? resolveEngine().cliPath;
  return new Promise<RunResult>((resolve) => {
    const child = spawn(opts.nodeBin, [cliPath, "--json", ...opts.args], {
      env: { ...process.env, ...opts.env },
    });

    let result: RunResult["result"];
    let stdoutBuf = "";
    const stderrLines: string[] = [];

    const drain = (final: boolean) => {
      const parts = stdoutBuf.split("\n");
      stdoutBuf = final ? "" : parts.pop() ?? "";
      for (const line of parts) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        let event: EngineEvent;
        try {
          event = JSON.parse(trimmed) as EngineEvent;
        } catch {
          continue; // non-JSON noise on stdout is ignored
        }
        if (event.type === "result") result = event.result;
        opts.onEvent?.(event);
      }
    };

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdoutBuf += chunk;
      drain(false);
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      for (const line of chunk.split("\n")) {
        if (line.trim()) {
          stderrLines.push(line);
          opts.onStderr?.(line);
        }
      }
    });

    child.on("error", (err) => {
      resolve({ ok: false, error: err.message });
    });
    child.on("close", (code) => {
      drain(true);
      resolve({ ok: code === 0, result, error: code === 0 ? undefined : stderrLines.slice(-12).join("\n") });
    });
  });
}

/** Run a `--json` command that prints a single JSON object (doctor/status) and parse it. */
export function runJsonCommand<T>(opts: Omit<SpawnOpts, "onEvent">): Promise<T> {
  const cliPath = opts.cliPath ?? resolveEngine().cliPath;
  return new Promise<T>((resolve, reject) => {
    const child = spawn(opts.nodeBin, [cliPath, "--json", ...opts.args], {
      env: { ...process.env, ...opts.env },
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (c) => (out += c));
    child.stderr.on("data", (c) => (err += c));
    child.on("error", reject);
    child.on("close", () => {
      const line = out.trim().split("\n").filter(Boolean).pop();
      if (!line) return reject(new Error(err.slice(-400) || "no output"));
      try {
        resolve(JSON.parse(line) as T);
      } catch (e) {
        reject(new Error(`bad JSON from engine: ${(e as Error).message}; stderr: ${err.slice(-200)}`));
      }
    });
  });
}

/** Run an engine command with no machine-readable output (e.g. `init`); resolve on exit 0. */
export function runEngineCommand(opts: Omit<SpawnOpts, "onEvent">): Promise<void> {
  const cliPath = opts.cliPath ?? resolveEngine().cliPath;
  return new Promise<void>((resolve, reject) => {
    const child = spawn(opts.nodeBin, [cliPath, ...opts.args], { env: { ...process.env, ...opts.env } });
    let err = "";
    child.stderr.on("data", (c) => (err += c));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(err.trim().split("\n").slice(-1)[0] || `engine exited ${code}`)),
    );
  });
}

/**
 * Run a command that prints a single (possibly pretty-printed, multi-line) JSON
 * object and parse the WHOLE stdout. The deliver commands (export/publish/
 * moments/attach) print `JSON.stringify(res, null, 2)`, so — unlike doctor/
 * status — the last line alone isn't valid JSON. No `--json` flag is added;
 * these commands aren't part of the NDJSON progress stream.
 */
export function runJsonObjectCommand<T>(opts: Omit<SpawnOpts, "onEvent">): Promise<T> {
  const cliPath = opts.cliPath ?? resolveEngine().cliPath;
  return new Promise<T>((resolve, reject) => {
    const child = spawn(opts.nodeBin, [cliPath, ...opts.args], {
      env: { ...process.env, ...opts.env },
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (c) => (out += c));
    child.stderr.on("data", (c) => (err += c));
    child.on("error", reject);
    child.on("close", () => {
      const text = out.trim();
      if (!text) return reject(new Error(err.trim().split("\n").slice(-1)[0] || "no output"));
      try {
        resolve(JSON.parse(text) as T);
      } catch (e) {
        reject(new Error(`bad JSON from engine: ${(e as Error).message}; stderr: ${err.slice(-200)}`));
      }
    });
  });
}

// ── AI drafting: pluggable local-agent-CLI backends ─────────────────────────
//
// "Draft with AI" can be powered by a local agent CLI the operator is already
// logged into — Devin (`devin -p`) or Claude Code (`claude -p`) — so no API key
// is hardcoded into the app. Falls back to the engine's `PALMIER_LLM_API_KEY`
// drafter (Kimi/Anthropic/OpenAI) when no agent CLI is on PATH.

/**
 * Pick the drafting backend. Pure + total so the selection logic is unit-tested
 * without spawning anything. `explicit` is `PALMIER_DRAFT_BACKEND`; when it's
 * unset/`auto`/unrecognized we prefer a local agent CLI (devin → claude), else
 * the API-key path.
 */
export function resolveDraftBackend(
  explicit: string | undefined,
  available: { devin: boolean; claude: boolean },
): DraftBackend {
  const choice = (explicit ?? "").trim().toLowerCase();
  if (choice === "devin" || choice === "claude" || choice === "llm") return choice;
  if (available.devin) return "devin";
  if (available.claude) return "claude";
  return "llm";
}

/** argv for an agent CLI's headless single-turn mode. */
export function agentDraftArgv(backend: "devin" | "claude", prompt: string): { bin: string; args: string[] } {
  // `devin -p -- <prompt>`: the `--` keeps the prompt from being read as a subcommand.
  if (backend === "devin") return { bin: "devin", args: ["-p", "--", prompt] };
  // `claude -p <prompt>`: print mode, prints the response to stdout and exits.
  return { bin: "claude", args: ["-p", prompt] };
}

/**
 * The instruction handed to the agent CLI. Headless single-turn modes
 * (`devin -p`, `claude -p`) DON'T reliably read repo files, so the full HGDW
 * `script.md` contract + a worked example are embedded inline here (pure, so the
 * contract is unit-tested). Without this the agent invents a generic "class
 * script" with timestamps/instructor labels instead of the SLIDE/SAY format.
 */
export function buildAgentDraftPrompt(lessonId: string, brief: string): string {
  return `You are drafting a vibedevview "HGDW" lesson script for lesson id "${lessonId}".

Topic brief: ${brief}

Output ONLY a valid HGDW script.md and NOTHING else — no preamble, no explanation,
no closing remarks. Do NOT use timestamps (e.g. "[00:00]"), speaker/instructor
labels, headings like "Introduction", bold prose, or any free-form essay. Follow
this EXACT format.

FORMAT
- A YAML frontmatter block delimited by --- with: lesson, title, track, voice.
  Keep lesson="${lessonId}" and voice="Ja'dan".
- Then a sequence of segments. Each segment is:
    ## NN · Short label        (NN = zero-padded order: 01, 02, ...; "·" separator)
    phase: ONE OF [SOURCE, ABSORB, MIRROR, COMMAND]
    duration: <seconds, integer>
    SAY:
    <one or two sentences of spoken narration — plain prose, no labels>
    SLIDE:
    \`\`\`yaml
    frame: <one frame code from the catalog>
    <fields for that frame>
    \`\`\`
- SAY is the narration that is read aloud. SLIDE is the on-screen card. A segment
  may use DO: (with a \`\`\`yaml list of {action, target, note}) instead of/with a
  SLIDE for screen-recording/demo steps. A purely visual segment can set
  "silent: true" and omit SAY.
- Aim for 8–12 segments: a cold-open (N1-title), an agenda (N5-agenda), content
  segments, and an outro (O1-outro). Phases should progress SOURCE → ABSORB →
  MIRROR → COMMAND.

FRAME CODES (frame: value → its fields)
  N1-title    title, subtitle, eyebrow         (big title card)
  N2-section  title, eyebrow                    (section divider)
  N3-quote    title                             (large mantra/quote)
  N4-vocab    tags[]                            (vocab tags, often silent)
  N5-agenda   title, body[]                     (roadmap/agenda list)
  C1-bullets  title, body[]                     (title + bullet list)
  C2-statement title                            (single big statement)
  C3-compare  title, columns[]{heading,items[]} (two-column comparison)
  C4-steps    title, body[]                     (numbered steps)
  C5-callout  title, body[]                     (callout/warning box)
  C6-code     title, lang, code                 (code block; code is a literal block)
  C7-stat     stat, statLabel                   (big stat/number)
  C8-figure   image, caption                    (image/figure)
  D1-placeholder eyebrow, title                 (demo placeholder)
  D2-lowerthird  title, subtitle                (lower-third over a recording)
  O1-outro    title, subtitle, footer           (closing/CTA card)

WORKED EXAMPLE (format only — write NEW content for the brief above)
\`\`\`markdown
---
lesson: ${lessonId}
title: <a punchy lesson title from the brief>
track: BUILD / ABSORB 1
voice: Ja'dan
---

## 01 · Cold open
phase: SOURCE
duration: 9

SAY:
By the end of this session you'll do three concrete things most people never do.

SLIDE:
\`\`\`yaml
frame: N1-title
eyebrow: BUILD · ABSORB 1
title: <Lesson Title>
subtitle: <one-line subtitle>
\`\`\`

## 02 · The roadmap
phase: SOURCE
duration: 8

SAY:
Here's where we're headed — four moves.

SLIDE:
\`\`\`yaml
frame: N5-agenda
eyebrow: ROADMAP
title: Four moves
body:
  - First move
  - Second move
  - Third move
  - Fourth move
\`\`\`

## 03 · Outro
phase: COMMAND
duration: 7

SAY:
Your turn — go try it, and I'll see you in the next one.

SLIDE:
\`\`\`yaml
frame: O1-outro
eyebrow: NEXT
title: <call to action>
subtitle: <what's next>
\`\`\`
\`\`\`

Now write the complete script.md for "${lessonId}" based on the brief. Wrap the
entire script in a single \`\`\`markdown code fence and output nothing outside it.`;
}

/**
 * Extract the script.md from an agent's stdout. An HGDW script contains MANY
 * inner ```yaml fences (one per SLIDE/DO), so we must NOT grab the first fenced
 * block — that truncates everything after the cold open. Instead, if the agent
 * wrapped the whole script in a ```markdown wrapper (optionally with prose around
 * it), strip from that opening fence to the LAST closing fence, preserving every
 * inner yaml fence. A bare ``` wrapper is only stripped when it directly wraps
 * the `---` frontmatter. Otherwise return the text as-is. Always normalize to a
 * single trailing newline.
 */
export function cleanScriptMarkdown(raw: string): string {
  const lines = raw.split("\n");
  // Prefer an explicit markdown wrapper fence (agents often add prose around it).
  let openIdx = lines.findIndex((l) => /^```(?:markdown|md)\s*$/i.test(l.trim()));
  // Else a generic fence as the first non-empty line that wraps the frontmatter.
  if (openIdx === -1) {
    const firstNonEmpty = lines.findIndex((l) => l.trim() !== "");
    if (firstNonEmpty !== -1 && /^```[\w-]*$/.test(lines[firstNonEmpty]!.trim())) {
      const after = lines.slice(firstNonEmpty + 1).find((l) => l.trim() !== "");
      if (after !== undefined && after.trim().startsWith("---")) openIdx = firstNonEmpty;
    }
  }
  if (openIdx !== -1) {
    let closeIdx = -1;
    for (let i = lines.length - 1; i > openIdx; i--) {
      if (/^```\s*$/.test(lines[i]!.trim())) {
        closeIdx = i;
        break;
      }
    }
    const inner = closeIdx !== -1 ? lines.slice(openIdx + 1, closeIdx) : lines.slice(openIdx + 1);
    return inner.join("\n").trim() + "\n";
  }
  return raw.trim() + "\n";
}

export interface TextCommandOpts {
  bin: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

/** Spawn an arbitrary binary (an agent CLI) and capture stdout; reject on failure. */
export function runTextCommand(opts: TextCommandOpts): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    // stdin: "ignore" (= /dev/null) so headless agent CLIs that read stdin in
    // print mode (e.g. `claude -p`) don't block waiting for piped input.
    const child = spawn(opts.bin, opts.args, {
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    const timer = opts.timeoutMs
      ? setTimeout(() => {
          child.kill("SIGKILL");
          reject(new Error(`${opts.bin} timed out after ${opts.timeoutMs}ms`));
        }, opts.timeoutMs)
      : null;
    child.stdout.on("data", (c) => (out += c));
    child.stderr.on("data", (c) => (err += c));
    child.on("error", (e) => {
      if (timer) clearTimeout(timer);
      const enoent = (e as NodeJS.ErrnoException).code === "ENOENT";
      reject(new Error(enoent ? `${opts.bin} not found on PATH` : e.message));
    });
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new Error(`${opts.bin} exited ${code}: ${err.trim().split("\n").slice(-1)[0] || out.slice(-200)}`));
    });
  });
}

/** Whether a command resolves on PATH (drives `auto` backend selection). */
export function commandExists(bin: string): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = process.platform === "win32" ? "where" : "which";
    const child = spawn(probe, [bin], { stdio: "ignore" });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
}

/** The three deliver steps the GUI runs, all in safe-by-default (dry-run) mode. */
export type DeliverStep = "export" | "publish" | "attach";

/**
 * The exact CLI argv for a GUI deliver step. This is the single source of the
 * safety contract: `publish` is pinned to `--target dryrun` and `attach` to
 * `--target sql`, and **no step ever emits `--apply`** or a real target
 * (`mux`/`api`/`supabase`). So a GUI click can never trip the engine's
 * write-gate, regardless of `PALMIER_PUBLISH_TARGET`/`PALMIER_ATTACH_TARGET`.
 */
export function deliverArgs(step: DeliverStep, lessonId: string): string[] {
  switch (step) {
    case "export":
      return ["export", lessonId];
    case "publish":
      return ["publish", lessonId, "--target", "dryrun"];
    case "attach":
      return ["attach", lessonId, "--target", "sql"];
  }
}

/** High-level adapter bound to a node binary + env, used by the IPC handlers. */
export class EngineAdapter {
  constructor(
    private readonly nodeBin: string,
    private readonly baseEnv: Record<string, string> = {},
  ) {}

  async listLessons(): Promise<string[]> {
    const dir = productionsDir();
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    const lessons: string[] = [];
    for (const e of entries) {
      if (e.isDirectory() && (await exists(path.join(dir, e.name, "script.md")))) lessons.push(e.name);
    }
    return lessons.sort();
  }

  /** Scaffold a new lesson folder seeded with the example script (`palmier init`). */
  async newLesson(lessonId: string): Promise<string> {
    const id = lessonId.trim();
    if (!id) throw new Error("a lesson id is required");
    await runEngineCommand({ nodeBin: this.nodeBin, env: this.baseEnv, args: ["init", id] });
    return id;
  }

  async readScript(lessonId: string): Promise<string | null> {
    return fs.readFile(path.join(lessonDir(lessonId), "script.md"), "utf8").catch(() => null);
  }

  async writeScript(lessonId: string, text: string): Promise<void> {
    const dir = lessonDir(lessonId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "script.md"), text, "utf8");
  }

  status(lessonId: string): Promise<StatusResult> {
    return runJsonCommand<StatusResult>({ nodeBin: this.nodeBin, env: this.baseEnv, args: ["status", lessonId] });
  }

  doctor(): Promise<DoctorResult> {
    return runJsonCommand<DoctorResult>({ nodeBin: this.nodeBin, env: this.baseEnv, args: ["doctor"] });
  }

  /**
   * Draft a script.md from a brief. Prefers a local agent CLI (Devin/Claude) the
   * operator is already logged into — no API key needed — and falls back to the
   * engine's `PALMIER_LLM_API_KEY` drafter. The result feeds the diff-and-approve
   * flow (Hard Rule #5): the agent path returns markdown without writing to disk;
   * the user applies + saves explicitly.
   */
  async draft(req: DraftRequest): Promise<DraftResult> {
    const explicit = (process.env.PALMIER_DRAFT_BACKEND ?? "").trim().toLowerCase();
    const backend: DraftBackend =
      explicit === "devin" || explicit === "claude" || explicit === "llm"
        ? explicit
        : resolveDraftBackend(explicit, {
            devin: await commandExists("devin"),
            claude: await commandExists("claude"),
          });

    if (backend === "llm") {
      const res = await runJsonCommand<{ script: string }>({
        nodeBin: this.nodeBin,
        env: this.baseEnv,
        args: ["script", req.lessonId, "--force", "--brief", req.brief],
      });
      return { script: res.script, backend };
    }

    const { bin, args } = agentDraftArgv(backend, buildAgentDraftPrompt(req.lessonId, req.brief));
    const raw = await runTextCommand({ bin, args, cwd: resolveEngine().root, env: this.baseEnv, timeoutMs: 300_000 });
    const script = cleanScriptMarkdown(raw);
    if (!script.trim()) throw new Error(`${bin} returned no script content`);
    return { script, backend };
  }

  produce(req: ProduceRequest, onEvent: (e: EngineEvent) => void): Promise<RunResult> {
    return spawnEngine({
      nodeBin: this.nodeBin,
      env: { ...this.baseEnv, PALMIER_TIMELINE: req.backend },
      args: ["produce", req.lessonId, "--backend", req.backend, ...(req.review ? [] : ["--no-review"])],
      onEvent,
    });
  }

  correct(req: CorrectRequest, onEvent: (e: EngineEvent) => void): Promise<RunResult> {
    return spawnEngine({
      nodeBin: this.nodeBin,
      env: { ...this.baseEnv, PALMIER_TIMELINE: req.backend },
      args: ["correct", req.lessonId, "--kind", req.kind, "--seg", req.segId, "--backend", req.backend],
      onEvent,
    });
  }

  /** `palmier export <id>` — flatten produced assets into one ffprobe-verified MP4. */
  exportLesson(lessonId: string): Promise<ExportResult> {
    return runJsonObjectCommand<ExportResult>({ nodeBin: this.nodeBin, env: this.baseEnv, args: deliverArgs("export", lessonId) });
  }

  /**
   * `palmier publish <id> --target dryrun` — always dry-run from the GUI.
   * `--target dryrun` is passed explicitly so an inherited `PALMIER_PUBLISH_TARGET=mux`
   * can never turn a GUI click into a real upload.
   */
  publish(lessonId: string): Promise<PublishResult> {
    return runJsonObjectCommand<PublishResult>({
      nodeBin: this.nodeBin,
      env: this.baseEnv,
      args: deliverArgs("publish", lessonId),
    });
  }

  /**
   * `palmier attach <id> --target sql` — the dry-run LMS preview. `--target sql`
   * is forced and `--apply` is never passed, so the double-gate (target+apply+
   * playbackId) can't be tripped from the GUI; it only emits reviewable SQL/JSON.
   */
  attachPreview(lessonId: string): Promise<AttachResult> {
    return runJsonObjectCommand<AttachResult>({
      nodeBin: this.nodeBin,
      env: this.baseEnv,
      args: deliverArgs("attach", lessonId),
    });
  }

  /** Staged, dry-run deliver preview for the Deliver panel. Each step degrades to an error string. */
  async deliverPreview(lessonId: string): Promise<DeliverPreview> {
    const step = async <T>(run: () => Promise<T>): Promise<DeliverOutcome<T>> => {
      try {
        return { ok: true, value: await run() };
      } catch (e) {
        return { ok: false, error: (e as Error).message };
      }
    };
    const exp = await step(() => this.exportLesson(lessonId));
    const pub = await step(() => this.publish(lessonId));
    const att = await step(() => this.attachPreview(lessonId));
    return { export: exp, publish: pub, attach: att };
  }

  async slidePath(lessonId: string, frameId: string): Promise<string | null> {
    const p = path.join(lessonDir(lessonId), "slides", `${frameId}.png`);
    return (await exists(p)) ? p : null;
  }
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
