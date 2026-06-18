import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { spawnEngine } from "../src/main/engine-adapter";
import type { EngineEvent } from "../src/shared/ipc";

const dir = path.dirname(fileURLToPath(import.meta.url));
const fakeCli = path.resolve(dir, "fixtures/fake-cli.mjs");

/**
 * Contract for spawnEngine (the child-CLI NDJSON reader):
 *  - emits each well-formed JSON line to onEvent, in order;
 *  - ignores non-JSON noise lines on stdout;
 *  - reassembles events split across multiple stdout chunks (line buffering);
 *  - captures the {type:"result"} payload and resolves ok:true on exit 0;
 *  - on non-zero exit resolves ok:false with a stderr tail in `error`.
 * External boundary (the child process) is a fixture; the unit under test
 * (parsing/aggregation) is exercised for real.
 */
describe("spawnEngine NDJSON parsing", () => {
  it("parses events in order, skips noise, buffers split lines, captures result", async () => {
    const events: EngineEvent[] = [];
    const res = await spawnEngine({
      nodeBin: process.execPath,
      cliPath: fakeCli,
      args: ["ok"],
      onEvent: (e) => events.push(e),
    });

    expect(events).toEqual([
      { type: "phase", name: "slides", status: "start" },
      { type: "slide.rendered", frameId: "01", path: "/x/01.png", verified: true },
      { type: "voice.done", segId: "01", duration: 3.5, source: "estimate" },
      {
        type: "result",
        result: { lessonId: "T", status: "assembled", segments: 1, totalDuration: 3.5, message: "done" },
      },
    ]);
    expect(res.ok).toBe(true);
    expect(res.result?.message).toBe("done");
    expect(res.error).toBeUndefined();
  });

  it("reports failure with a stderr tail on non-zero exit", async () => {
    const events: EngineEvent[] = [];
    const res = await spawnEngine({
      nodeBin: process.execPath,
      cliPath: fakeCli,
      args: ["fail"],
      onEvent: (e) => events.push(e),
    });
    expect(res.ok).toBe(false);
    expect(res.result).toBeUndefined();
    expect(res.error).toContain("boom: something broke");
    expect(events).toEqual([]);
  });
});
