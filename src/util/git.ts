import path from "node:path";
import { run } from "./exec.js";

/**
 * Minimal git interface used by the production gates. Injectable so the decision
 * logic (`evaluateGitGate`) can be tested without spawning git or touching a repo.
 * Returns the process exit code and trimmed stdout for one `git` invocation.
 */
export interface GitRunner {
  (args: string[], cwd: string): Promise<{ code: number; stdout: string }>;
}

const defaultRunner: GitRunner = async (args, cwd) => {
  const r = await run("git", args, { cwd, allowFail: true });
  return { code: r.code, stdout: r.stdout.trim() };
};

/** Where a tracked file sits relative to git: committed? pushed? */
export interface FileGitState {
  /** The file lives inside a git work tree. */
  inRepo: boolean;
  /** Git tracks this exact path (not just untracked-in-a-repo). */
  tracked: boolean;
  /** Working-tree/index changes to the file (modified, staged, or untracked). */
  dirty: boolean;
  /** Tracked with no pending changes. */
  committed: boolean;
  /** The current branch has an upstream configured. */
  upstream: boolean;
  /** Commits touching this file that exist on HEAD but not on the upstream. */
  aheadForFile: number;
  /** committed && upstream && aheadForFile === 0 (the file's latest change is pushed). */
  pushed: boolean;
}

/**
 * Inspect one file's git state. All git calls are best-effort (allowFail) so a
 * missing repo / detached HEAD / no-upstream degrades gracefully into flags
 * rather than throwing.
 */
export async function inspectFileGit(file: string, runner: GitRunner = defaultRunner): Promise<FileGitState> {
  const cwd = path.dirname(file);

  const inside = await runner(["rev-parse", "--is-inside-work-tree"], cwd);
  const inRepo = inside.code === 0 && inside.stdout === "true";
  if (!inRepo) {
    return { inRepo: false, tracked: false, dirty: false, committed: false, upstream: false, aheadForFile: 0, pushed: false };
  }

  const ls = await runner(["ls-files", "--error-unmatch", "--", file], cwd);
  const tracked = ls.code === 0;

  const status = await runner(["status", "--porcelain", "--", file], cwd);
  const dirty = status.stdout.length > 0;

  const committed = tracked && !dirty;

  const up = await runner(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"], cwd);
  const upstream = up.code === 0 && up.stdout.length > 0;

  let aheadForFile = 0;
  if (upstream) {
    const rl = await runner(["rev-list", "--count", "@{upstream}..HEAD", "--", file], cwd);
    const n = Number.parseInt(rl.stdout, 10);
    aheadForFile = Number.isFinite(n) ? n : 0;
  }

  const pushed = committed && upstream && aheadForFile === 0;
  return { inRepo, tracked, dirty, committed, upstream, aheadForFile, pushed };
}

/** How strict the gate is. "committed" = tracked & clean; "pushed" also requires the change be on the upstream. */
export type GitGateLevel = "committed" | "pushed";

export interface GitGateResult {
  ok: boolean;
  level: GitGateLevel;
  /** Stable reason code when not ok (for tests / machine output). */
  reason?: "not-in-repo" | "untracked" | "dirty" | "no-upstream" | "unpushed";
  /** One-line human summary. */
  detail: string;
}

/**
 * Decide whether a file passes the git gate at the requested strictness.
 *
 * Portability rule: a file that is NOT in a git repo passes the "committed"
 * gate (a solo operator producing locally needs no git), but FAILS the "pushed"
 * gate — fanning a lesson out to another machine requires it to be in git.
 */
export function evaluateGitGate(state: FileGitState, level: GitGateLevel, upstreamName = "the upstream"): GitGateResult {
  if (!state.inRepo) {
    return level === "pushed"
      ? { ok: false, level, reason: "not-in-repo", detail: "script is not in a git repo — it must be committed and pushed before fan-out to another machine" }
      : { ok: true, level, detail: "script is not in a git repo — git gate skipped (local produce)" };
  }
  if (!state.tracked) {
    return { ok: false, level, reason: "untracked", detail: "script.md is untracked — git add + commit it before producing" };
  }
  if (state.dirty) {
    return { ok: false, level, reason: "dirty", detail: "script.md has uncommitted changes — commit them before producing" };
  }
  if (level === "pushed") {
    if (!state.upstream) {
      return { ok: false, level, reason: "no-upstream", detail: "branch has no upstream — push it so child machines can fetch the script" };
    }
    if (state.aheadForFile > 0) {
      const n = state.aheadForFile;
      return { ok: false, level, reason: "unpushed", detail: `script.md has ${n} commit${n === 1 ? "" : "s"} not pushed to ${upstreamName} — push before fan-out` };
    }
  }
  return { ok: true, level, detail: level === "pushed" ? "script.md is committed and pushed" : "script.md is committed" };
}

/** Convenience: inspect + evaluate in one call (used by produce + preflight). */
export async function checkScriptGit(
  file: string,
  level: GitGateLevel,
  runner: GitRunner = defaultRunner,
): Promise<{ state: FileGitState; gate: GitGateResult }> {
  const state = await inspectFileGit(file, runner);
  const gate = evaluateGitGate(state, level);
  return { state, gate };
}
