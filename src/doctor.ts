import { promises as fs } from "node:fs";
import { chromium } from "playwright";
import { run } from "./util/exec.js";
import { resolveVoice } from "./voices.js";

export interface Check {
  name: string;
  ok: boolean;
  detail: string;
  fix?: string;
}

async function checkNode(): Promise<Check> {
  const major = Number.parseInt(process.versions.node.split(".")[0]!, 10);
  return {
    name: "Node.js >= 20",
    ok: major >= 20,
    detail: `v${process.versions.node}`,
    fix: "brew install node  (or use nvm to install Node 20+)",
  };
}

async function checkBinary(bin: string): Promise<Check> {
  try {
    const { stdout } = await run(bin, ["-version"], { allowFail: true });
    const first = stdout.split("\n")[0] ?? "";
    return { name: bin, ok: true, detail: first.slice(0, 60) };
  } catch {
    return { name: bin, ok: false, detail: "not found", fix: "brew install ffmpeg" };
  }
}

async function checkChromium(): Promise<Check> {
  try {
    const exe = chromium.executablePath();
    await fs.access(exe);
    return { name: "Playwright Chromium", ok: true, detail: exe };
  } catch {
    return {
      name: "Playwright Chromium",
      ok: false,
      detail: "not installed",
      fix: "npx playwright install chromium",
    };
  }
}

async function checkElevenLabs(): Promise<Check[]> {
  const key = process.env.ELEVENLABS_API_KEY ?? "";
  if (!key) {
    return [
      {
        name: "ELEVENLABS_API_KEY",
        ok: false,
        detail: "not set — voiceover will fall back to duration estimates",
        fix: "export ELEVENLABS_API_KEY=...",
      },
    ];
  }
  const want = resolveVoice(process.env.PALMIER_VOICE);
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": key } });
    if (!res.ok) {
      return [{ name: "ElevenLabs key", ok: false, detail: `auth failed (${res.status})`, fix: "check the key" }];
    }
    const data = (await res.json()) as { voices: { voice_id: string; name: string }[] };
    const has = data.voices.some((v) => v.voice_id === want.id);
    return [
      { name: "ElevenLabs key", ok: true, detail: `${data.voices.length} voices available` },
      {
        name: `voice "${want.name}"`,
        ok: has,
        detail: has ? want.id : `${want.id} not in this account`,
        fix: has ? undefined : `pick an available voice via PALMIER_VOICE=<name|id>`,
      },
    ];
  } catch (err) {
    return [{ name: "ElevenLabs key", ok: false, detail: (err as Error).message.slice(0, 80) }];
  }
}

async function checkPalmierMcp(): Promise<Check> {
  const url = process.env.PALMIER_MCP_URL ?? "http://127.0.0.1:19789/mcp";
  const required = process.env.PALMIER_TIMELINE === "palmier";
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    await fetch(url, { method: "GET", signal: ctrl.signal }).finally(() => clearTimeout(t));
    return { name: "Palmier Pro MCP", ok: true, detail: `reachable at ${url}` };
  } catch {
    return {
      name: "Palmier Pro MCP",
      ok: !required,
      detail: required ? `unreachable at ${url}` : `not running (only needed for --backend palmier)`,
      fix: required ? "open Palmier Pro on this Mac" : undefined,
    };
  }
}

export async function doctor(): Promise<{ checks: Check[]; ok: boolean }> {
  const checks: Check[] = [];
  checks.push(await checkNode());
  checks.push(await checkBinary("ffmpeg"));
  checks.push(await checkBinary("ffprobe"));
  checks.push(await checkChromium());
  checks.push(...(await checkElevenLabs()));
  checks.push(await checkPalmierMcp());
  const ok = checks.every((c) => c.ok);
  return { checks, ok };
}
