// Stand-in engine CLI for runEngineCommand tests (no machine-readable output).
// `init <id>` succeeds (exit 0, logs to stderr like the real CLI). Anything
// else fails with a stderr message that runEngineCommand should surface.
const [cmd, id] = process.argv.slice(2);

if (cmd === "init" && id) {
  process.stderr.write(`ok cli seeded ${id}/script.md\n`);
  process.exit(0);
}

process.stderr.write("warn boom\nerror init requires a lessonId\n");
process.exit(1);
