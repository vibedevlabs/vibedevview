import { promises as fs } from "node:fs";
import { Workspace } from "./workspace.js";
import { doctor, type Check } from "./doctor.js";
import { checkScriptGit, type FileGitState, type GitGateLevel, type GitGateResult, type GitRunner } from "./util/git.js";

export interface PreflightResult {
  lessonId: string;
  scriptPath: string;
  scriptExists: boolean;
  doctor: { ok: boolean; checks: Check[] };
  git: { gate: GitGateResult; state: FileGitState };
  /** All three gates pass: the script exists, doctor is green, and the git gate is satisfied. */
  ok: boolean;
}

export interface PreflightOptions {
  /** "pushed" (default for fan-out) also requires the script be on the upstream; "committed" is local-only. */
  requirePushed?: boolean;
  // Injection points for tests (default to the real implementations).
  doctorFn?: () => Promise<{ ok: boolean; checks: Check[] }>;
  gitRunner?: GitRunner;
  existsFn?: (p: string) => Promise<boolean>;
}

async function defaultExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * One deterministic gate before a (fan-out) production run: the script exists,
 * `doctor` passes (Node/ffmpeg/Chromium/ElevenLabs/Palmier MCP), and the script
 * is committed (and, by default, pushed) so another machine can fetch it.
 *
 * `ok` is the AND of all three — a parent orchestrator should refuse to spawn a
 * child when this is false, instead of creating a session that immediately blocks.
 */
export async function preflight(lessonId: string, opts: PreflightOptions = {}): Promise<PreflightResult> {
  const ws = Workspace.for(lessonId);
  const exists = opts.existsFn ?? defaultExists;
  const runDoctor = opts.doctorFn ?? doctor;
  const level: GitGateLevel = opts.requirePushed === false ? "committed" : "pushed";

  const scriptExists = await exists(ws.scriptPath);
  const doc = await runDoctor();
  const { state, gate } = await checkScriptGit(ws.scriptPath, level, opts.gitRunner);

  const ok = scriptExists && doc.ok && gate.ok;
  return {
    lessonId,
    scriptPath: ws.scriptPath,
    scriptExists,
    doctor: doc,
    git: { gate, state },
    ok,
  };
}
