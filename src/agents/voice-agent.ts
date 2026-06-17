import { promises as fs } from "node:fs";
import { hasSay, type Manifest, type Timeline, type TimelineEntry } from "../types.js";
import { resolveVoice, TTS_MODEL, VOICE_SETTINGS } from "../voices.js";
import { probeDuration } from "../util/exec.js";
import { log } from "../util/log.js";
import type { Workspace } from "../workspace.js";

const SCOPE = "voice";
const ELEVEN_BASE = "https://api.elevenlabs.io/v1/text-to-speech";

async function synthesize(apiKey: string, voiceId: string, text: string): Promise<Buffer> {
  const res = await fetch(`${ELEVEN_BASE}/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      accept: "audio/mpeg",
      "content-type": "application/json",
    },
    body: JSON.stringify({ text, model_id: TTS_MODEL, voice_settings: VOICE_SETTINGS }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs ${res.status}: ${detail.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

export interface VoiceAgentOptions {
  /** Restrict to specific segment ids (for the correction loop). */
  only?: string[];
  apiKey?: string;
}

/**
 * Voice Agent — calls ElevenLabs for each SAY block, measures real durations
 * with ffprobe, and writes timeline.json (the timing authority). Silent and
 * narration-less segments hold for their duration estimate. Without an API key
 * it degrades gracefully to estimates so the rest of the pipeline still runs.
 */
export async function runVoiceAgent(
  ws: Workspace,
  manifest: Manifest,
  opts: VoiceAgentOptions = {},
): Promise<Timeline> {
  await ws.ensure();
  const apiKey = opts.apiKey ?? process.env.ELEVENLABS_API_KEY ?? "";
  const only = opts.only ? new Set(opts.only) : undefined;

  // Start from existing timeline so corrections only touch targeted segments.
  const existing = (await ws.exists(ws.timelinePath)) ? await ws.readTimeline() : undefined;
  const segments: Record<string, TimelineEntry> = { ...(existing?.segments ?? {}) };

  if (!apiKey) {
    log.warn(SCOPE, "ELEVENLABS_API_KEY not set — using duration estimates (no audio).");
  }

  for (const seg of manifest.segments) {
    if (only && !only.has(seg.id)) continue;

    if (!hasSay(seg)) {
      segments[seg.id] = { duration: seg.durationEstimate, source: "silent" };
      continue;
    }
    if (!apiKey) {
      segments[seg.id] = { duration: seg.durationEstimate, source: "estimate" };
      continue;
    }

    const voice = resolveVoice(seg.voice ?? process.env.PALMIER_VOICE ?? manifest.voiceDefault);
    log.info(SCOPE, `seg ${seg.id} → ${voice.name} (${seg.say!.length} chars)`);
    try {
      const audio = await synthesize(apiKey, voice.id, seg.say!);
      const out = ws.audioPath(seg.id);
      await fs.writeFile(out, audio);
      const duration = await probeDuration(out);
      segments[seg.id] = { audioPath: out, duration, source: "tts" };
      log.ok(SCOPE, `seg ${seg.id} → ${duration.toFixed(2)}s`);
    } catch (err) {
      // One bad voice/segment must not abort the whole production — fall back
      // to the duration estimate and flag it for the human.
      log.warn(SCOPE, `seg ${seg.id} TTS failed (${(err as Error).message.slice(0, 120)}); using estimate`);
      segments[seg.id] = { duration: seg.durationEstimate, source: "estimate" };
    }
  }

  const timeline: Timeline = { lessonId: manifest.lessonId, fps: 24, segments };
  await ws.writeTimeline(timeline);
  log.ok(SCOPE, `wrote ${ws.timelinePath}`);
  return timeline;
}
