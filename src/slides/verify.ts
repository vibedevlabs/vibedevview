import { DARK_TONES, WARM_TONES } from "../brand.js";
import type { Background } from "../types.js";
import { runBinary } from "../util/exec.js";

export interface ColorStats {
  avg: [number, number, number];
  /** mean perceived luminance 0..255 */
  luma: number;
  /** mean warmth: (R - B). Positive = warm. */
  warmth: number;
}

/**
 * Sample the average color of a PNG by downscaling to an NxN grid with ffmpeg
 * and reading the raw RGB bytes. No image-decoding dependency required.
 */
export async function sampleColors(pngPath: string, grid = 8): Promise<ColorStats> {
  const raw = await runBinary("ffmpeg", [
    "-v",
    "error",
    "-i",
    pngPath,
    "-vf",
    `scale=${grid}:${grid}`,
    "-pix_fmt",
    "rgb24",
    "-f",
    "rawvideo",
    "-",
  ]);
  let r = 0;
  let g = 0;
  let b = 0;
  const n = raw.length / 3;
  for (let i = 0; i < raw.length; i += 3) {
    r += raw[i] ?? 0;
    g += raw[i + 1] ?? 0;
    b += raw[i + 2] ?? 0;
  }
  r /= n;
  g /= n;
  b /= n;
  return {
    avg: [r, g, b],
    luma: 0.2126 * r + 0.7152 * g + 0.0722 * b,
    warmth: r - b,
  };
}

export interface VerifyResult {
  ok: boolean;
  reason?: string;
  stats: ColorStats;
}

/**
 * Verify a rendered slide matches the expected background family. This is the
 * lightweight analogue of ViMax's VLM consistency check: it catches blank,
 * mis-themed, or failed renders before they reach the timeline.
 */
export async function verifySlide(pngPath: string, bg: Background): Promise<VerifyResult> {
  const stats = await sampleColors(pngPath);
  if (bg === "dark") {
    const ok = stats.luma < 90;
    return { ok, reason: ok ? undefined : `expected dark frame but luma=${stats.luma.toFixed(0)}`, stats };
  }
  if (bg === "gradient") {
    // Warm gradient: average should lean warm (R noticeably > B) and not be dark.
    const ok = stats.warmth > 25 && stats.luma > 90;
    return {
      ok,
      reason: ok
        ? undefined
        : `expected warm gradient but warmth=${stats.warmth.toFixed(0)} luma=${stats.luma.toFixed(0)}`,
      stats,
    };
  }
  // light
  const ok = stats.luma > 150;
  return { ok, reason: ok ? undefined : `expected light frame but luma=${stats.luma.toFixed(0)}`, stats };
}

/** Reference palettes (exported for tests / docs). */
export const PALETTES = { warm: WARM_TONES, dark: DARK_TONES };
