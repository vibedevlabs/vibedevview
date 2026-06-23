import { describe, expect, it } from "vitest";
import { preflight } from "../src/preflight.js";
import type { Check } from "../src/doctor.js";
import type { GitRunner } from "../src/util/git.js";

/**
 * Contract: preflight(lessonId, opts) = AND of three gates —
 *   scriptExists && doctor.ok && git.gate.ok.
 * The git level is "pushed" by default and "committed" when requirePushed===false.
 * All side inputs are injected (doctorFn, gitRunner, existsFn) so the aggregation
 * logic is exercised without spawning git or hitting the network.
 * Failure modes: missing script, red doctor, failing git gate, level selection.
 */

const GREEN_DOCTOR = async (): Promise<{ ok: boolean; checks: Check[] }> => ({
  ok: true,
  checks: [{ name: "Node.js >= 20", ok: true, detail: "v20.0.0" }],
});

const RED_DOCTOR = async (): Promise<{ ok: boolean; checks: Check[] }> => ({
  ok: false,
  checks: [{ name: "ffmpeg", ok: false, detail: "not found", fix: "brew install ffmpeg" }],
});

/** A runner that reports a committed+pushed file. */
const PUSHED_RUNNER: GitRunner = async (args) => {
  const key = args.slice(0, 2).join(" ");
  const m: Record<string, { code: number; stdout: string }> = {
    "rev-parse --is-inside-work-tree": { code: 0, stdout: "true" },
    "ls-files --error-unmatch": { code: 0, stdout: "x/script.md" },
    "status --porcelain": { code: 0, stdout: "" },
    "rev-parse --abbrev-ref": { code: 0, stdout: "origin/main" },
    "rev-list --count": { code: 0, stdout: "0" },
  };
  return m[key] ?? { code: 0, stdout: "" };
};

/** Committed locally but NOT pushed (2 commits ahead, no... actually 2 ahead). */
const COMMITTED_NOT_PUSHED_RUNNER: GitRunner = async (args) => {
  const key = args.slice(0, 2).join(" ");
  const m: Record<string, { code: number; stdout: string }> = {
    "rev-parse --is-inside-work-tree": { code: 0, stdout: "true" },
    "ls-files --error-unmatch": { code: 0, stdout: "x/script.md" },
    "status --porcelain": { code: 0, stdout: "" },
    "rev-parse --abbrev-ref": { code: 0, stdout: "origin/main" },
    "rev-list --count": { code: 0, stdout: "2" },
  };
  return m[key] ?? { code: 0, stdout: "" };
};

describe("preflight", () => {
  it("is ok when script exists, doctor is green, and the script is pushed (default level)", async () => {
    const res = await preflight("B-AB1", { doctorFn: GREEN_DOCTOR, gitRunner: PUSHED_RUNNER, existsFn: async () => true });
    expect(res.ok).toBe(true);
    expect(res.scriptExists).toBe(true);
    expect(res.git.gate.level).toBe("pushed");
    expect(res.git.gate.ok).toBe(true);
    expect(res.scriptPath).toContain("B-AB1");
  });

  it("fails when script.md is missing (even with green doctor + clean git)", async () => {
    const res = await preflight("B-AB1", { doctorFn: GREEN_DOCTOR, gitRunner: PUSHED_RUNNER, existsFn: async () => false });
    expect(res.scriptExists).toBe(false);
    expect(res.ok).toBe(false);
  });

  it("fails when doctor is red (even with a pushed script)", async () => {
    const res = await preflight("B-AB1", { doctorFn: RED_DOCTOR, gitRunner: PUSHED_RUNNER, existsFn: async () => true });
    expect(res.doctor.ok).toBe(false);
    expect(res.ok).toBe(false);
  });

  it("fails the default (pushed) level when the script is committed but unpushed", async () => {
    const res = await preflight("B-AB1", {
      doctorFn: GREEN_DOCTOR,
      gitRunner: COMMITTED_NOT_PUSHED_RUNNER,
      existsFn: async () => true,
    });
    expect(res.git.gate.level).toBe("pushed");
    expect(res.git.gate).toMatchObject({ ok: false, reason: "unpushed" });
    expect(res.ok).toBe(false);
  });

  it("passes the same unpushed script when requirePushed=false (committed level)", async () => {
    const res = await preflight("B-AB1", {
      requirePushed: false,
      doctorFn: GREEN_DOCTOR,
      gitRunner: COMMITTED_NOT_PUSHED_RUNNER,
      existsFn: async () => true,
    });
    expect(res.git.gate.level).toBe("committed");
    expect(res.git.gate.ok).toBe(true);
    expect(res.ok).toBe(true);
  });
});
