// Stand-in for the engine CLI's deliver commands, used to test
// runJsonObjectCommand's whole-stdout JSON parsing in isolation. The real
// deliver commands print `JSON.stringify(res, null, 2)` (pretty, multi-line),
// which this mirrors. Invoked as: node fake-cli-deliver.mjs <command> <lessonId> [...]
const cmd = process.argv[2];

if (cmd === "export") {
  const result = {
    lessonId: "B-AB1",
    path: "/x/videos/B-AB1.mp4",
    clipCount: 4,
    expectedDuration: 35.2,
    durationSeconds: 35.18,
    driftSeconds: 0.02,
    withinTolerance: true,
    width: 1920,
    height: 1080,
    fps: 30,
    sizeBytes: 13010234,
    notes: ["concat ok"],
  };
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exit(0);
}

if (cmd === "missing") {
  // Mirrors publishLesson's "no exported video" failure: stderr + non-zero exit.
  process.stderr.write("no exported video at /x/videos/B-AB1.mp4 — run `palmier export B-AB1` first\n");
  process.exit(1);
}

process.stderr.write(`unknown command: ${cmd}\n`);
process.exit(2);
