import { spawn } from "node:child_process";

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

/** Run a command, capturing stdout/stderr. Rejects on non-zero unless allowFail. */
export function run(
  cmd: string,
  args: string[],
  opts: { cwd?: string; allowFail?: boolean; input?: Buffer } = {},
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: opts.cwd, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      const result: RunResult = { code: code ?? -1, stdout, stderr };
      if (code !== 0 && !opts.allowFail) {
        reject(
          new Error(`\`${cmd} ${args.join(" ")}\` exited ${code}\n${stderr.trim() || stdout.trim()}`),
        );
      } else {
        resolve(result);
      }
    });
    if (opts.input) child.stdin.end(opts.input);
    else child.stdin.end();
  });
}

/** Run a command and capture stdout as raw bytes (for binary output like rawvideo). */
export function runBinary(
  cmd: string,
  args: string[],
  opts: { cwd?: string } = {},
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: opts.cwd, stdio: ["ignore", "pipe", "pipe"] });
    const chunks: Buffer[] = [];
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => chunks.push(d));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(`\`${cmd}\` exited ${code}\n${stderr.trim()}`));
      else resolve(Buffer.concat(chunks));
    });
  });
}

/** Probe media duration (seconds) with ffprobe. */
export async function probeDuration(file: string): Promise<number> {
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    file,
  ]);
  const seconds = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(seconds)) {
    throw new Error(`ffprobe could not read duration of ${file}`);
  }
  return seconds;
}
