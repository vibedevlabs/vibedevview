import { parseScript } from "vibedevview/script/parse";
import type { Manifest } from "vibedevview/types";

export interface ValidationResult {
  manifest?: Manifest;
  /** Human-readable parse/validation error, when the script does not parse. */
  error?: string;
}

/** Wrap parseScript so the editor can show a friendly error instead of throwing. */
export function validateScript(text: string): ValidationResult {
  try {
    return { manifest: parseScript(text) };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
