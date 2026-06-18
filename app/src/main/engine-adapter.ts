import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import type {
  CorrectRequest,
  DoctorResult,
  DraftRequest,
  EngineEvent,
  ProduceRequest,
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
}

/**
 * Spawn `node <cli.js> --json <args>` and parse its stdout as NDJSON EngineEvents.
 * Resolves once the process exits; collects the {type:"result"} payload if present.
 * Exported (not Electron-coupled) so it can be exercised directly in tests.
 */
export function spawnEngine(opts: SpawnOpts): Promise<RunResult> {
  const { cliPath } = resolveEngine();
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
  const { cliPath } = resolveEngine();
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

  async draft(req: DraftRequest): Promise<string> {
    const res = await runJsonCommand<{ script: string }>({
      nodeBin: this.nodeBin,
      env: this.baseEnv,
      args: ["script", req.lessonId, "--force", "--brief", req.brief],
    });
    return res.script;
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
