/**
 * HGDW brand constants. These are the single source of truth used by the
 * Slides Agent (deck CSS) and the Slides verification step.
 *
 * Wordmark is intentionally "HOT GIRLS DONT WORK" — no apostrophe.
 */

export const BRAND = {
  wordmark: "HOT GIRLS DONT WORK",
  colors: {
    yellow: "#FFD56B",
    coral: "#FF7E5F",
    sunset: "#FF5263",
    darkBg: "#0a0808",
    text: "#f6efe6",
    softText: "#cbb7a2",
  },
  gradient: "linear-gradient(135deg, #FFD56B 0%, #FF7E5F 50%, #FF5263 100%)",
  fonts: {
    sans: "Inter",
    mono: "JetBrains Mono",
  },
  border: "3px",
} as const;

/** Warm brand tones used by the verifier when bg === "gradient". */
export const WARM_TONES: ReadonlyArray<readonly [number, number, number]> = [
  [255, 213, 107], // yellow
  [255, 126, 95], // coral
  [255, 82, 99], // sunset
];

/** Dark tones used by the verifier when bg === "dark". */
export const DARK_TONES: ReadonlyArray<readonly [number, number, number]> = [
  [10, 8, 8], // darkBg
];

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 24,
  // The deck renders at half size with a 2x device scale factor → 1920x1080.
  cssWidth: 960,
  cssHeight: 540,
  deviceScaleFactor: 2,
} as const;
