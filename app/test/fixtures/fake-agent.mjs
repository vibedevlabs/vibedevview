#!/usr/bin/env node
// Fake local agent CLI (stands in for `devin`/`claude`) for draft tests.
// Echoes the lesson id pulled from the prompt and whether it saw a `--`
// separator, wrapped in a ```markdown fence with prose around it so the
// adapter's fence-extraction is exercised end to end.
const args = process.argv.slice(2);
const prompt = args[args.length - 1] ?? "";
const sawSep = args.includes("--");
const id = (prompt.match(/lesson id "([^"]+)"/) || [])[1] || "UNKNOWN";

if (process.env.FAKE_AGENT_FAIL === "1") {
  process.stderr.write("fake agent: simulated failure\n");
  process.exit(3);
}
if (process.env.FAKE_AGENT_EMPTY === "1") {
  // Exit 0 but emit only whitespace — simulates an agent that "succeeds" yet
  // produces no usable script (the adapter must reject this, not return blank).
  process.stdout.write("   \n\n");
  process.exit(0);
}

process.stdout.write(
  `Sure, here's a draft:\n\n` +
    "```markdown\n" +
    `# Title: ${id}\n` +
    `sep:${sawSep}\n` +
    `phase: HOOK\n\n` +
    `SAY:\n` +
    `Hello from the fake agent.\n` +
    "```\n\n" +
    `Let me know if you'd like changes.\n`,
);
