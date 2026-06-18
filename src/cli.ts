#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { correct, produce, type BackendName } from "./orchestrator.js";
import { parseScript } from "./script/parse.js";
import { Workspace } from "./workspace.js";
import { formatTimestamp } from "./alignment.js";
import type { RendererOptions, RendererMode } from "./slides/renderer.js";
import { log } from "./util/log.js";
import type { EngineEvent, EngineEventSink } from "./events.js";

function rendererOpts(o: { renderer?: string; cdpUrl?: string }): RendererOptions {
  return { mode: o.renderer as RendererMode | undefined, cdpUrl: o.cdpUrl };
}

const program = new Command();
program
  .name("palmier")
  .description("HGDW Palmier — multi-agent video production system")
  .version("0.1.0")
  .option("--json", "emit machine-readable output (NDJSON progress events on stdout) for the app");

/** True when the global --json flag is set. */
function jsonMode(): boolean {
  return program.opts().json === true;
}

/** In --json mode, returns a sink that writes one NDJSON EngineEvent per line. */
function reporter(): EngineEventSink | undefined {
  if (!jsonMode()) return undefined;
  return (e: EngineEvent) => process.stdout.write(JSON.stringify(e) + "\n");
}

program
  .command("produce")
  .description("Run the full production for a lesson")
  .argument("<lessonId>", "lesson id, e.g. B-AB1")
  .option("-b, --backend <name>", "timeline backend: ffmpeg | palmier")
  .option("--renderer <mode>", "slide renderer: launch | cdp")
  .option("--cdp-url <url>", "CDP endpoint when --renderer=cdp")
  .option("--no-placeholders", "do not render placeholders for missing recordings")
  .option("--no-review", "do not stop for human review after generating a script")
  .option("--no-clean", "place without first clearing the timeline (palmier; default clears to stay idempotent)")
  .option("--keep-bin", "clear the timeline but keep existing media-bin assets (palmier; default resets the bin)")
  .action(async (lessonId, o) => {
    const res = await produce(lessonId, {
      backend: o.backend as BackendName | undefined,
      review: o.review,
      placeholders: o.placeholders,
      renderer: rendererOpts(o),
      clean: o.clean,
      keepBin: o.keepBin,
      onEvent: reporter(),
    });
    // In --json mode the result is already emitted as a {type:"result"} event.
    if (!jsonMode()) process.stdout.write(JSON.stringify(res, null, 2) + "\n");
  });

program
  .command("script")
  .description("Generate (or validate) script.md for a lesson")
  .argument("<lessonId>")
  .option("--brief <text>", "topic brief to draft from")
  .option("--force", "overwrite an existing script.md (used by the app's Draft-with-AI)")
  .option("--stdout", "print the drafted script.md to stdout instead of a status line")
  .action(async (lessonId, o) => {
    const { runScriptAgent } = await import("./agents/script-agent.js");
    const ws = Workspace.for(lessonId);
    const md = await runScriptAgent(ws, { topicBrief: o.brief, force: o.force });
    const manifest = parseScript(md);
    await ws.writeManifest(manifest);
    if (o.stdout || jsonMode()) {
      process.stdout.write(jsonMode() ? JSON.stringify({ type: "script", lessonId, script: md, segments: manifest.segments.length }) + "\n" : md);
    } else {
      log.ok("cli", `script.md OK — ${manifest.segments.length} segments → ${ws.manifestPath}`);
    }
  });

program
  .command("slides")
  .description("Render + verify slides only")
  .argument("<lessonId>")
  .option("--renderer <mode>")
  .option("--cdp-url <url>")
  .option("--only <ids>", "comma-separated segment ids")
  .action(async (lessonId, o) => {
    const { runSlidesAgent } = await import("./agents/slides-agent.js");
    const ws = Workspace.for(lessonId);
    const manifest = await ws.readManifest();
    const res = await runSlidesAgent(ws, manifest, {
      only: o.only ? String(o.only).split(",") : undefined,
      renderer: rendererOpts(o),
    });
    process.stdout.write(JSON.stringify(res, null, 2) + "\n");
  });

program
  .command("voice")
  .description("Generate voiceover + timeline.json only")
  .argument("<lessonId>")
  .option("--only <ids>", "comma-separated segment ids")
  .action(async (lessonId, o) => {
    const { runVoiceAgent } = await import("./agents/voice-agent.js");
    const ws = Workspace.for(lessonId);
    const manifest = await ws.readManifest();
    const t = await runVoiceAgent(ws, manifest, { only: o.only ? String(o.only).split(",") : undefined });
    process.stdout.write(JSON.stringify(t, null, 2) + "\n");
  });

program
  .command("assemble")
  .description("(Re)assemble the timeline from already-produced assets")
  .argument("<lessonId>")
  .option("-b, --backend <name>", "ffmpeg | palmier")
  .option("--no-clean", "place without first clearing the timeline (palmier; default clears to stay idempotent)")
  .option("--keep-bin", "clear the timeline but keep existing media-bin assets (palmier; default resets the bin)")
  .action(async (lessonId, o) => {
    const { computeAlignment } = await import("./alignment.js");
    const { buildPlan, makeBackendForCli } = await loadAssembleDeps();
    const ws = Workspace.for(lessonId);
    const manifest = await ws.readManifest();
    const timeline = await ws.readTimeline();
    const alignment = computeAlignment(manifest, timeline);
    await ws.writeAlignment(alignment);
    const recording = (await ws.exists(ws.recordingManifestPath)) ? await ws.readRecordingManifest() : undefined;
    const plan = buildPlan(manifest, alignment, timeline, recording, ws);
    const backend = makeBackendForCli((o.backend as BackendName) ?? undefined);
    if (o.clean !== false && backend.clear) {
      const cleared = await backend.clear({ media: o.keepBin !== true });
      log.info("cli", `cleared ${cleared.removedClips} clip(s), ${cleared.deletedMedia} media asset(s)`);
    }
    const res = await backend.assemble(plan, ws);
    await backend.close?.();
    process.stdout.write(JSON.stringify(res, null, 2) + "\n");
  });

program
  .command("clear")
  .description("Clear the Palmier timeline + media bin — reset between takes/lessons")
  .option("-b, --backend <name>", "ffmpeg | palmier (default: palmier)")
  .option("--keep-bin", "clear the timeline only; keep imported assets in the media bin")
  .action(async (o) => {
    const { makeBackend } = await import("./orchestrator.js");
    const name =
      (o.backend as BackendName) ?? ((process.env.PALMIER_TIMELINE as BackendName) === "ffmpeg" ? "ffmpeg" : "palmier");
    const backend = makeBackend(name);
    if (!backend.clear) {
      log.warn("cli", `the ${backend.name} backend has no persistent timeline to clear`);
      return;
    }
    const res = await backend.clear({ media: o.keepBin !== true });
    await backend.close?.();
    process.stdout.write(JSON.stringify(res, null, 2) + "\n");
  });

program
  .command("correct")
  .description("Apply a timestamp-based correction and re-assemble")
  .argument("<lessonId>")
  .requiredOption("-k, --kind <kind>", "narration | slide | recording | retime")
  .option("--at <timestamp>", "timestamp like 1:23")
  .option("--seg <id>", "segment id")
  .option("-b, --backend <name>")
  .option("--renderer <mode>")
  .action(async (lessonId, o) => {
    const res = await correct(lessonId, {
      kind: o.kind,
      at: o.at,
      segId: o.seg,
      backend: o.backend as BackendName | undefined,
      renderer: rendererOpts(o),
      onEvent: reporter(),
    });
    if (!jsonMode()) process.stdout.write(JSON.stringify(res, null, 2) + "\n");
  });

program
  .command("status")
  .description("Show the production timeline (segments, timings, asset status)")
  .argument("<lessonId>")
  .action(async (lessonId) => {
    const { computeAlignment } = await import("./alignment.js");
    const ws = Workspace.for(lessonId);
    const manifest = await ws.readManifest();
    const timeline = (await ws.exists(ws.timelinePath)) ? await ws.readTimeline() : undefined;
    const alignment = timeline ? computeAlignment(manifest, timeline) : undefined;
    if (jsonMode()) {
      const segments = manifest.segments.map((seg) => {
        const a = alignment?.segments[seg.id];
        return {
          id: seg.id,
          label: seg.label ?? null,
          phase: seg.phase ?? null,
          frame: seg.slide?.frame ?? null,
          kinds: { say: !!seg.say, slide: !!seg.slide, do: !!seg.do },
          start: a?.start ?? null,
          end: a?.end ?? null,
          duration: a?.duration ?? seg.durationEstimate,
        };
      });
      process.stdout.write(
        JSON.stringify({ lessonId: manifest.lessonId, title: manifest.title, totalDuration: alignment?.totalDuration ?? null, segments }) + "\n",
      );
      return;
    }
    for (const seg of manifest.segments) {
      const a = alignment?.segments[seg.id];
      const stamp = a ? `${formatTimestamp(a.start)}–${formatTimestamp(a.end)}` : "—";
      const kinds = [seg.say ? "SAY" : "", seg.slide ? "SLIDE" : "", seg.do ? "DO" : ""].filter(Boolean).join("+");
      process.stdout.write(`${seg.id.padEnd(4)} ${stamp.padEnd(13)} ${kinds.padEnd(14)} ${seg.label ?? ""}\n`);
    }
    if (alignment) process.stdout.write(`\ntotal: ${formatTimestamp(alignment.totalDuration)}\n`);
  });

program
  .command("doctor")
  .description("Preflight: check Node, ffmpeg, Chromium, ElevenLabs + Palmier MCP")
  .action(async () => {
    const { doctor } = await import("./doctor.js");
    const { checks, ok } = await doctor();
    if (jsonMode()) {
      process.stdout.write(JSON.stringify({ ok, checks }) + "\n");
      process.exitCode = ok ? 0 : 1;
      return;
    }
    for (const c of checks) {
      const mark = c.ok ? "ok  " : "FAIL";
      process.stdout.write(`[${mark}] ${c.name.padEnd(22)} ${c.detail}\n`);
      if (!c.ok && c.fix) process.stdout.write(`        ↳ ${c.fix}\n`);
    }
    process.stdout.write(ok ? "\nAll checks passed.\n" : "\nSome checks failed — see fixes above.\n");
    process.exitCode = ok ? 0 : 1;
  });

program
  .command("init")
  .description("Create a production folder seeded with the example script")
  .argument("<lessonId>")
  .action(async (lessonId) => {
    const ws = Workspace.for(lessonId);
    await ws.ensure();
    if (await ws.exists(ws.scriptPath)) {
      log.warn("cli", `script.md already exists at ${ws.scriptPath}`);
      return;
    }
    const example = path.resolve(new URL("../examples/B-AB1/script.md", import.meta.url).pathname);
    const md = await fs.readFile(example, "utf8").catch(() => "");
    if (md) {
      await fs.writeFile(ws.scriptPath, md, "utf8");
      log.ok("cli", `seeded ${ws.scriptPath} from example — edit it, then \`palmier produce ${lessonId}\``);
    } else {
      log.warn("cli", "example script not found; create script.md manually");
    }
  });

async function loadAssembleDeps() {
  const { buildPlan } = await import("./timeline/backend.js");
  const { makeBackend } = await import("./orchestrator.js");
  const makeBackendForCli = (b?: BackendName) =>
    makeBackend(b ?? ((process.env.PALMIER_TIMELINE as BackendName) === "palmier" ? "palmier" : "ffmpeg"));
  return { buildPlan, makeBackendForCli };
}

program.parseAsync(process.argv).catch((err) => {
  log.error("cli", err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
