import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  agentDraftArgv,
  buildAgentDraftPrompt,
  cleanScriptMarkdown,
  commandExists,
  resolveDraftBackend,
  runEngineCommand,
  runTextCommand,
  EngineAdapter,
} from "../src/main/engine-adapter";

const dir = path.dirname(fileURLToPath(import.meta.url));
const fakeAgent = path.resolve(dir, "fixtures/fake-agent.mjs");
const fakeInitCli = path.resolve(dir, "fixtures/fake-cli-init.mjs");

/**
 * Contract — resolveDraftBackend(explicit, available): pure backend selector.
 *  - An explicit "devin"|"claude"|"llm" (any case / surrounding whitespace) is
 *    honored verbatim, regardless of what's on PATH.
 *  - Otherwise (unset, "auto", or an unrecognized value) it auto-detects in a
 *    fixed preference order: devin → claude → llm.
 * Failure modes covered: case/whitespace in explicit, both CLIs present (order
 * must be deterministic), neither present (must fall back to llm), garbage value.
 */
describe("resolveDraftBackend", () => {
  const both = { devin: true, claude: true };
  const neither = { devin: false, claude: false };

  it("honors an explicit backend over PATH detection", () => {
    expect(resolveDraftBackend("devin", neither)).toBe("devin");
    expect(resolveDraftBackend("claude", neither)).toBe("claude");
    expect(resolveDraftBackend("llm", both)).toBe("llm");
  });

  it("normalizes case and whitespace on the explicit value", () => {
    expect(resolveDraftBackend("  DEVIN ", neither)).toBe("devin");
    expect(resolveDraftBackend("Claude", neither)).toBe("claude");
  });

  it("auto-detect prefers devin, then claude, then llm", () => {
    expect(resolveDraftBackend("auto", both)).toBe("devin");
    expect(resolveDraftBackend("auto", { devin: false, claude: true })).toBe("claude");
    expect(resolveDraftBackend("auto", neither)).toBe("llm");
  });

  it("treats unset/empty/garbage as auto", () => {
    expect(resolveDraftBackend(undefined, { devin: false, claude: true })).toBe("claude");
    expect(resolveDraftBackend("", both)).toBe("devin");
    expect(resolveDraftBackend("banana", neither)).toBe("llm");
  });
});

/**
 * Contract — agentDraftArgv(backend, prompt): the exact argv for headless mode.
 *  - devin: ["-p", "--", prompt] (the `--` stops the prompt being read as a subcommand).
 *  - claude: ["-p", prompt].
 *  - The prompt is always the LAST arg and carried through verbatim (no quoting/escaping
 *    by us — spawn passes argv directly).
 */
describe("agentDraftArgv", () => {
  it("builds devin headless argv with the -- separator", () => {
    expect(agentDraftArgv("devin", "hello world")).toEqual({ bin: "devin", args: ["-p", "--", "hello world"] });
  });

  it("builds claude headless argv without a separator", () => {
    expect(agentDraftArgv("claude", "hello world")).toEqual({ bin: "claude", args: ["-p", "hello world"] });
  });

  it("passes the prompt through verbatim as the last arg", () => {
    const tricky = 'line1\nline2 "quoted" --apply';
    expect(agentDraftArgv("devin", tricky).args.at(-1)).toBe(tricky);
    expect(agentDraftArgv("claude", tricky).args.at(-1)).toBe(tricky);
  });
});

/**
 * Contract — buildAgentDraftPrompt(lessonId, brief): the instruction text.
 *  - Embeds BOTH the lessonId and the brief verbatim (so the agent drafts the
 *    right lesson from the right topic).
 *  - Tells the agent to output ONLY script.md (no commentary) — this is what makes
 *    cleanScriptMarkdown's job tractable.
 *  - Points at the skill + frame-type docs so the output is on-format.
 */
describe("buildAgentDraftPrompt", () => {
  it("includes the lessonId and brief verbatim", () => {
    const p = buildAgentDraftPrompt("B-AB1", "a 90s intro to prompt-driven dev");
    expect(p).toContain('lesson id "B-AB1"');
    expect(p).toContain("a 90s intro to prompt-driven dev");
  });

  it("instructs output-only and references the skill + frame docs", () => {
    const p = buildAgentDraftPrompt("X", "y");
    expect(p).toContain("Output ONLY the script.md content");
    expect(p).toContain("hgdw-video-production");
    expect(p).toContain("HGDW-DESIGN");
  });
});

/**
 * Contract — cleanScriptMarkdown(raw): turn agent stdout into a clean script.md.
 *  - When the output contains a ```markdown (or ```) fence, return ONLY the first
 *    fenced block's contents (agents wrap output + add prose around it).
 *  - When there is no fence, return the whole text.
 *  - Strip any stray leading/trailing fence, trim surrounding whitespace, and
 *    guarantee exactly one trailing newline.
 * Failure modes: prose around a fence, bare ``` (no lang), no fence at all,
 * leading/trailing blank lines, multiple fences (first wins), empty input.
 */
describe("cleanScriptMarkdown", () => {
  it("extracts the fenced block and drops surrounding prose", () => {
    const raw = 'Sure!\n\n```markdown\n# Title\nSAY:\nhi\n```\n\nWant changes?';
    expect(cleanScriptMarkdown(raw)).toBe("# Title\nSAY:\nhi\n");
  });

  it("handles a bare ``` fence (no language tag)", () => {
    const raw = "```\n# A\nSAY:\nb\n```";
    expect(cleanScriptMarkdown(raw)).toBe("# A\nSAY:\nb\n");
  });

  it("returns the whole text when there is no fence, trimmed + single trailing NL", () => {
    expect(cleanScriptMarkdown("\n\n# Plain\nSAY:\nx\n\n\n")).toBe("# Plain\nSAY:\nx\n");
  });

  it("keeps only the FIRST fenced block when several are present", () => {
    const raw = "```markdown\nFIRST\n```\nmiddle\n```markdown\nSECOND\n```";
    expect(cleanScriptMarkdown(raw)).toBe("FIRST\n");
  });

  it("collapses empty input to a single newline", () => {
    expect(cleanScriptMarkdown("")).toBe("\n");
    expect(cleanScriptMarkdown("   \n  ")).toBe("\n");
  });
});

/**
 * Contract — commandExists(bin): true iff `bin` resolves on PATH.
 * Uses the platform `which`/`where`. We assert against a binary we know exists
 * (the current node) and one that cannot.
 */
describe("commandExists", () => {
  it("returns true for a binary on PATH and false for a missing one", async () => {
    const nodeName = path.basename(process.execPath).replace(/\.exe$/i, "");
    expect(await commandExists(nodeName)).toBe(true);
    expect(await commandExists("definitely-not-a-real-binary-xyz123")).toBe(false);
  });
});

/**
 * Contract — runTextCommand({bin,args,cwd,env,timeoutMs}): spawn a binary, resolve
 * with its full stdout on exit 0; reject with the stderr tail on non-zero exit;
 * reject with "<bin> not found on PATH" on ENOENT.
 */
describe("runTextCommand", () => {
  it("resolves with stdout on success", async () => {
    const out = await runTextCommand({ bin: process.execPath, args: [fakeAgent, "-p", "--", 'lesson id "B-AB1"'] });
    expect(out).toContain("```markdown");
    expect(out).toContain("# Title: B-AB1");
  });

  it("rejects with the stderr tail on non-zero exit", async () => {
    await expect(
      runTextCommand({ bin: process.execPath, args: [fakeAgent, "x"], env: { FAKE_AGENT_FAIL: "1" } }),
    ).rejects.toThrow(/simulated failure/);
  });

  it("rejects with a clear message when the binary is missing", async () => {
    await expect(runTextCommand({ bin: "no-such-bin-xyz123", args: [] })).rejects.toThrow(/not found on PATH/);
  });

  // Regression: agents like `claude -p` read stdin in print mode. If we don't
  // close the child's stdin it blocks forever waiting for input. With stdin
  // ignored (/dev/null) the agent gets immediate EOF and completes. A short
  // timeout makes the hang (the bug) observable: it would reject on timeout.
  it("does not hang when the agent reads stdin to completion (stdin is closed)", async () => {
    const out = await runTextCommand({
      bin: process.execPath,
      args: [fakeAgent, "-p", "--", "x"],
      env: { FAKE_AGENT_READ_STDIN: "1" },
      timeoutMs: 4000,
    });
    expect(out).toContain("STDIN-EOF");
  });
});

/**
 * Contract — runEngineCommand({nodeBin,cliPath,args}): run an engine command with
 * no machine-readable output (e.g. `init`). Resolves (void) on exit 0; rejects with
 * the LAST stderr line on non-zero exit.
 */
describe("runEngineCommand", () => {
  it("resolves when the command exits 0", async () => {
    await expect(
      runEngineCommand({ nodeBin: process.execPath, cliPath: fakeInitCli, args: ["init", "B-DEMO1"] }),
    ).resolves.toBeUndefined();
  });

  it("rejects with the last stderr line on non-zero exit", async () => {
    await expect(
      runEngineCommand({ nodeBin: process.execPath, cliPath: fakeInitCli, args: ["init"] }),
    ).rejects.toThrow(/init requires a lessonId/);
  });
});

/**
 * Integration — EngineAdapter.draft() through a real spawned agent CLI.
 * We put executable `devin` / `claude` shims (the fake agent) on PATH, force the
 * backend via PALMIER_DRAFT_BACKEND, and assert the FULL pipeline: prompt built →
 * CLI spawned with the right argv → stdout fence-extracted → {script, backend}.
 */
describe("EngineAdapter.draft — local agent CLI path (integration)", () => {
  let binDir: string;
  const saved: Record<string, string | undefined> = {};

  beforeAll(() => {
    binDir = fs.mkdtempSync(path.join(os.tmpdir(), "fake-agents-"));
    // Shim scripts named exactly `devin` / `claude` that exec the fake agent,
    // forwarding all argv so the adapter's real argv is exercised.
    const esc = fakeAgent.replace(/"/g, '\\"');
    for (const name of ["devin", "claude"]) {
      const p = path.join(binDir, name);
      fs.writeFileSync(p, `#!/bin/sh\nexec "${process.execPath}" "${esc}" "$@"\n`);
      fs.chmodSync(p, 0o755);
    }
    saved.PATH = process.env.PATH;
    saved.PALMIER_DRAFT_BACKEND = process.env.PALMIER_DRAFT_BACKEND;
    process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH ?? ""}`;
  });

  afterAll(() => {
    if (saved.PATH === undefined) delete process.env.PATH;
    else process.env.PATH = saved.PATH;
    if (saved.PALMIER_DRAFT_BACKEND === undefined) delete process.env.PALMIER_DRAFT_BACKEND;
    else process.env.PALMIER_DRAFT_BACKEND = saved.PALMIER_DRAFT_BACKEND;
    fs.rmSync(binDir, { recursive: true, force: true });
  });

  afterEach(() => {
    delete process.env.FAKE_AGENT_FAIL;
    delete process.env.FAKE_AGENT_EMPTY;
  });

  it("sanity: the shims are reachable on PATH", () => {
    expect(spawnSync("devin", ["-p", "--", "x"], { encoding: "utf8" }).status).toBe(0);
  });

  it("drafts via devin: fence-stripped script + backend tag, prompt carried the lessonId, argv had the -- separator", async () => {
    process.env.PALMIER_DRAFT_BACKEND = "devin";
    const adapter = new EngineAdapter(process.execPath);
    const res = await adapter.draft({ lessonId: "B-DEMO1", brief: "intro to AI" });
    expect(res.backend).toBe("devin");
    // fences stripped, single trailing newline
    expect(res.script).toBe("# Title: B-DEMO1\nsep:true\nphase: HOOK\n\nSAY:\nHello from the fake agent.\n");
    // sep:true proves agentDraftArgv passed the devin "--" separator through to the CLI
    expect(res.script).toContain("sep:true");
  });

  it("drafts via claude: backend tag + argv had NO -- separator (sep:false)", async () => {
    process.env.PALMIER_DRAFT_BACKEND = "claude";
    const adapter = new EngineAdapter(process.execPath);
    const res = await adapter.draft({ lessonId: "B-DEMO1", brief: "intro to AI" });
    expect(res.backend).toBe("claude");
    expect(res.script).toContain("sep:false");
  });

  it("throws when the agent returns no usable script content", async () => {
    process.env.PALMIER_DRAFT_BACKEND = "devin";
    process.env.FAKE_AGENT_EMPTY = "1";
    const adapter = new EngineAdapter(process.execPath);
    await expect(adapter.draft({ lessonId: "B-DEMO1", brief: "x" })).rejects.toThrow(/no script content/);
  });

  it("auto-detect (no explicit) resolves to devin when the shim is on PATH", async () => {
    delete process.env.PALMIER_DRAFT_BACKEND;
    const adapter = new EngineAdapter(process.execPath);
    const res = await adapter.draft({ lessonId: "B-DEMO1", brief: "x" });
    expect(res.backend).toBe("devin");
  });
});
