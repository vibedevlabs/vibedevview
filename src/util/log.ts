/* Tiny structured logger. Colorized when stderr is a TTY. */

const useColor = process.stderr.isTTY && process.env.NO_COLOR === undefined;
const c = (code: string, s: string) => (useColor ? `\u001b[${code}m${s}\u001b[0m` : s);

export type Scope = string;

function stamp(): string {
  return new Date().toISOString().slice(11, 19);
}

export const log = {
  info(scope: Scope, msg: string): void {
    process.stderr.write(`${c("90", stamp())} ${c("36", `[${scope}]`)} ${msg}\n`);
  },
  step(scope: Scope, msg: string): void {
    process.stderr.write(`${c("90", stamp())} ${c("35", `[${scope}]`)} ${c("1", msg)}\n`);
  },
  ok(scope: Scope, msg: string): void {
    process.stderr.write(`${c("90", stamp())} ${c("32", `[${scope}]`)} ${msg}\n`);
  },
  warn(scope: Scope, msg: string): void {
    process.stderr.write(`${c("90", stamp())} ${c("33", `[${scope}] warn`)} ${msg}\n`);
  },
  error(scope: Scope, msg: string): void {
    process.stderr.write(`${c("90", stamp())} ${c("31", `[${scope}] error`)} ${msg}\n`);
  },
};
