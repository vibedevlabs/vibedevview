/** HGDW voice roster + ElevenLabs model settings (from the system spec). */

export interface VoiceConfig {
  id: string;
  name: string;
}

export const VOICES: Record<string, VoiceConfig> = {
  Courtney: { name: "Courtney", id: "lH8FzgwcPEePseQlJiNj" },
  "Ja'dan": { name: "Ja'dan", id: "zNqgrf8rS1DSYcSbugQi" },
  Jadan: { name: "Ja'dan", id: "zNqgrf8rS1DSYcSbugQi" },
};

export const TTS_MODEL = "eleven_multilingual_v2";
export const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75 } as const;

/** Resolve a voice name OR raw id to a config. Falls back to Ja'dan (HGDW default). */
export function resolveVoice(nameOrId: string | undefined): VoiceConfig {
  if (!nameOrId) return VOICES["Ja'dan"]!;
  if (VOICES[nameOrId]) return VOICES[nameOrId]!;
  // Looks like a raw ElevenLabs id (20+ alnum chars).
  if (/^[A-Za-z0-9]{18,}$/.test(nameOrId)) return { id: nameOrId, name: nameOrId };
  return VOICES["Ja'dan"]!;
}
