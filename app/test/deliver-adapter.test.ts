import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { deliverArgs, runJsonObjectCommand, type DeliverStep } from "../src/main/engine-adapter";
import type { ExportResult } from "../src/shared/ipc";

const dir = path.dirname(fileURLToPath(import.meta.url));
const fakeCli = path.resolve(dir, "fixtures/fake-cli-deliver.mjs");

/**
 * Contract for `deliverArgs` — the GUI's safe-by-default deliver invocation:
 *  - export takes no flags;
 *  - publish is pinned to `--target dryrun` (never a real Mux upload);
 *  - attach is pinned to `--target sql` (only emits reviewable SQL);
 *  - NO step ever emits `--apply` or a real write target (mux/api/supabase),
 *    so the engine's write-gate can't be tripped from a GUI click.
 */
describe("deliverArgs — safe-by-default contract", () => {
  it("export uses the bare command (no flags)", () => {
    expect(deliverArgs("export", "B-AB1")).toEqual(["export", "B-AB1"]);
  });

  it("publish is pinned to a dry-run target", () => {
    expect(deliverArgs("publish", "B-AB1")).toEqual(["publish", "B-AB1", "--target", "dryrun"]);
  });

  it("attach is pinned to the sql (file-only) target", () => {
    expect(deliverArgs("attach", "B-AB1")).toEqual(["attach", "B-AB1", "--target", "sql"]);
  });

  it("no step ever emits --apply or a real write target", () => {
    const steps: DeliverStep[] = ["export", "publish", "attach"];
    for (const step of steps) {
      const args = deliverArgs(step, "B-AB1");
      expect(args).not.toContain("--apply");
      for (const realTarget of ["mux", "api", "supabase"]) {
        expect(args).not.toContain(realTarget);
      }
      // the lessonId is always carried through verbatim
      expect(args).toContain("B-AB1");
    }
  });
});

/**
 * Contract for `runJsonObjectCommand` (the deliver reader): unlike the NDJSON
 * stream, deliver commands print one pretty-printed (multi-line) JSON object,
 * so the parser must JSON.parse the WHOLE stdout — not the last line — and must
 * surface a failed command's stderr tail rather than a parse error.
 */
describe("runJsonObjectCommand — whole-stdout JSON parsing", () => {
  it("parses a multi-line JSON object into the typed result", async () => {
    const res = await runJsonObjectCommand<ExportResult>({
      nodeBin: process.execPath,
      cliPath: fakeCli,
      args: deliverArgs("export", "B-AB1"),
    });
    expect(res.path).toBe("/x/videos/B-AB1.mp4");
    expect(res.clipCount).toBe(4);
    expect(res.withinTolerance).toBe(true);
    expect(res.durationSeconds).toBeCloseTo(35.18, 2);
    expect(res.driftSeconds).toBeCloseTo(0.02, 2);
    expect(res.notes).toEqual(["concat ok"]);
  });

  it("rejects with the stderr tail when the command exits non-zero with no stdout", async () => {
    await expect(
      runJsonObjectCommand({ nodeBin: process.execPath, cliPath: fakeCli, args: ["missing", "B-AB1"] }),
    ).rejects.toThrow(/run `palmier export B-AB1` first/);
  });
});
