import { describe, expect, it } from "vitest";
import { evaluateGitGate, inspectFileGit, type FileGitState, type GitRunner } from "../src/util/git.js";

/**
 * Contract:
 *  inspectFileGit(file, runner) issues git plumbing and maps it to FileGitState:
 *    - rev-parse --is-inside-work-tree → inRepo (short-circuits to all-false when not)
 *    - ls-files --error-unmatch → tracked (code 0)
 *    - status --porcelain → dirty (nonempty)
 *    - @{upstream} resolves → upstream; rev-list --count @{upstream}..HEAD -- file → aheadForFile
 *    - committed = tracked && !dirty;  pushed = committed && upstream && ahead===0
 *  evaluateGitGate(state, level) decides ok + a stable reason code, with the
 *    portability rule: not-in-repo passes "committed" but fails "pushed".
 * Failure modes: not-in-repo, untracked, dirty-but-tracked, no-upstream,
 *  unpushed (ahead>0), singular vs plural commit wording.
 */

/** Build a GitRunner from a map keyed by the first one/two args, recording calls. */
function fakeRunner(map: Record<string, { code: number; stdout: string }>): { run: GitRunner; calls: string[][] } {
  const calls: string[][] = [];
  const run: GitRunner = async (args) => {
    calls.push(args);
    const key = args.slice(0, 2).join(" ");
    const k1 = args[0]!;
    const hit = map[key] ?? map[k1];
    return hit ?? { code: 0, stdout: "" };
  };
  return { run, calls };
}

const CLEAN = (over: Partial<FileGitState> = {}): FileGitState => ({
  inRepo: true,
  tracked: true,
  dirty: false,
  committed: true,
  upstream: true,
  aheadForFile: 0,
  pushed: true,
  ...over,
});

describe("inspectFileGit", () => {
  it("maps a committed+pushed file (and short-circuits nothing)", async () => {
    const { run } = fakeRunner({
      "rev-parse --is-inside-work-tree": { code: 0, stdout: "true" },
      "ls-files --error-unmatch": { code: 0, stdout: "x/script.md" },
      "status --porcelain": { code: 0, stdout: "" },
      "rev-parse --abbrev-ref": { code: 0, stdout: "origin/main" },
      "rev-list --count": { code: 0, stdout: "0" },
    });
    const s = await inspectFileGit("/x/script.md", run);
    expect(s).toEqual<FileGitState>({
      inRepo: true,
      tracked: true,
      dirty: false,
      committed: true,
      upstream: true,
      aheadForFile: 0,
      pushed: true,
    });
  });

  it("short-circuits to all-false when not inside a work tree (no further git calls)", async () => {
    const { run, calls } = fakeRunner({
      "rev-parse --is-inside-work-tree": { code: 128, stdout: "false" },
    });
    const s = await inspectFileGit("/tmp/loose/script.md", run);
    expect(s).toEqual<FileGitState>({
      inRepo: false,
      tracked: false,
      dirty: false,
      committed: false,
      upstream: false,
      aheadForFile: 0,
      pushed: false,
    });
    // Only the work-tree probe ran — we never asked ls-files/status/upstream.
    expect(calls).toHaveLength(1);
    expect(calls[0]!.slice(0, 2)).toEqual(["rev-parse", "--is-inside-work-tree"]);
  });

  it("flags an untracked file as not-committed (ls-files fails, porcelain shows ??)", async () => {
    const { run } = fakeRunner({
      "rev-parse --is-inside-work-tree": { code: 0, stdout: "true" },
      "ls-files --error-unmatch": { code: 1, stdout: "" },
      "status --porcelain": { code: 0, stdout: "?? script.md" },
      "rev-parse --abbrev-ref": { code: 0, stdout: "origin/main" },
      "rev-list --count": { code: 0, stdout: "0" },
    });
    const s = await inspectFileGit("/x/script.md", run);
    expect(s.tracked).toBe(false);
    expect(s.dirty).toBe(true);
    expect(s.committed).toBe(false);
    expect(s.pushed).toBe(false);
  });

  it("flags a tracked-but-modified file as dirty", async () => {
    const { run } = fakeRunner({
      "rev-parse --is-inside-work-tree": { code: 0, stdout: "true" },
      "ls-files --error-unmatch": { code: 0, stdout: "x/script.md" },
      "status --porcelain": { code: 0, stdout: " M script.md" },
      "rev-parse --abbrev-ref": { code: 0, stdout: "origin/main" },
      "rev-list --count": { code: 0, stdout: "0" },
    });
    const s = await inspectFileGit("/x/script.md", run);
    expect(s.tracked).toBe(true);
    expect(s.dirty).toBe(true);
    expect(s.committed).toBe(false);
  });

  it("treats a missing upstream as not-pushed (and ahead=0), but still committed", async () => {
    const { run } = fakeRunner({
      "rev-parse --is-inside-work-tree": { code: 0, stdout: "true" },
      "ls-files --error-unmatch": { code: 0, stdout: "x/script.md" },
      "status --porcelain": { code: 0, stdout: "" },
      "rev-parse --abbrev-ref": { code: 128, stdout: "" },
      "rev-list --count": { code: 0, stdout: "9" }, // must be ignored when no upstream
    });
    const s = await inspectFileGit("/x/script.md", run);
    expect(s.committed).toBe(true);
    expect(s.upstream).toBe(false);
    expect(s.aheadForFile).toBe(0);
    expect(s.pushed).toBe(false);
  });

  it("counts commits not on the upstream as aheadForFile (committed but unpushed)", async () => {
    const { run } = fakeRunner({
      "rev-parse --is-inside-work-tree": { code: 0, stdout: "true" },
      "ls-files --error-unmatch": { code: 0, stdout: "x/script.md" },
      "status --porcelain": { code: 0, stdout: "" },
      "rev-parse --abbrev-ref": { code: 0, stdout: "origin/main" },
      "rev-list --count": { code: 0, stdout: "2" },
    });
    const s = await inspectFileGit("/x/script.md", run);
    expect(s.committed).toBe(true);
    expect(s.upstream).toBe(true);
    expect(s.aheadForFile).toBe(2);
    expect(s.pushed).toBe(false);
  });
});

describe("evaluateGitGate", () => {
  it("not-in-repo PASSES committed (local produce) but FAILS pushed (fan-out)", () => {
    const state = CLEAN({ inRepo: false, tracked: false, committed: false, upstream: false, pushed: false });
    const committed = evaluateGitGate(state, "committed");
    const pushed = evaluateGitGate(state, "pushed");
    expect(committed.ok).toBe(true);
    expect(committed.reason).toBeUndefined();
    expect(pushed.ok).toBe(false);
    expect(pushed.reason).toBe("not-in-repo");
  });

  it("fails untracked at both levels", () => {
    const state = CLEAN({ tracked: false, dirty: true, committed: false, pushed: false });
    expect(evaluateGitGate(state, "committed")).toMatchObject({ ok: false, reason: "untracked" });
    expect(evaluateGitGate(state, "pushed")).toMatchObject({ ok: false, reason: "untracked" });
  });

  it("fails a dirty tracked file even at the committed level", () => {
    const state = CLEAN({ dirty: true, committed: false, pushed: false });
    expect(evaluateGitGate(state, "committed")).toMatchObject({ ok: false, reason: "dirty" });
  });

  it("passes a committed-clean file at committed, but flags no-upstream at pushed", () => {
    const state = CLEAN({ upstream: false, pushed: false });
    expect(evaluateGitGate(state, "committed").ok).toBe(true);
    expect(evaluateGitGate(state, "pushed")).toMatchObject({ ok: false, reason: "no-upstream" });
  });

  it("flags unpushed commits at the pushed level with count + upstream name", () => {
    const state = CLEAN({ aheadForFile: 2, pushed: false });
    const r = evaluateGitGate(state, "pushed", "origin/main");
    expect(r).toMatchObject({ ok: false, reason: "unpushed" });
    expect(r.detail).toContain("2 commits");
    expect(r.detail).toContain("origin/main");
  });

  it("uses singular wording for a single unpushed commit", () => {
    const r = evaluateGitGate(CLEAN({ aheadForFile: 1, pushed: false }), "pushed", "origin/main");
    expect(r.detail).toContain("1 commit ");
    expect(r.detail).not.toContain("1 commits");
  });

  it("passes a fully committed+pushed file at the pushed level", () => {
    expect(evaluateGitGate(CLEAN(), "pushed")).toMatchObject({ ok: true, level: "pushed" });
  });
});
