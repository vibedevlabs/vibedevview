import { afterEach, describe, expect, it } from "vitest";
import { resolveGitGate } from "../src/orchestrator.js";

/**
 * Contract: resolveGitGate(opts) picks the effective gate level.
 *   - An explicit opts.gitGate always wins (including "off").
 *   - Otherwise: "committed" when the resolved backend is palmier (live), else "off".
 *   - Backend resolution falls back to PALMIER_TIMELINE when opts.backend is unset.
 */

const ENV_KEY = "PALMIER_TIMELINE";
const original = process.env[ENV_KEY];
afterEach(() => {
  if (original === undefined) delete process.env[ENV_KEY];
  else process.env[ENV_KEY] = original;
});

describe("resolveGitGate", () => {
  it("honors an explicit gitGate even when the backend is live", () => {
    expect(resolveGitGate({ backend: "palmier", gitGate: "off" })).toBe("off");
    expect(resolveGitGate({ backend: "ffmpeg", gitGate: "pushed" })).toBe("pushed");
  });

  it("auto-enables committed for the live palmier backend", () => {
    delete process.env[ENV_KEY];
    expect(resolveGitGate({ backend: "palmier" })).toBe("committed");
  });

  it("is off for the ffmpeg preview backend", () => {
    delete process.env[ENV_KEY];
    expect(resolveGitGate({ backend: "ffmpeg" })).toBe("off");
  });

  it("falls back to PALMIER_TIMELINE when no backend is given", () => {
    process.env[ENV_KEY] = "palmier";
    expect(resolveGitGate({})).toBe("committed");
    process.env[ENV_KEY] = "ffmpeg";
    expect(resolveGitGate({})).toBe("off");
  });

  it("defaults to off when neither backend nor env is set", () => {
    delete process.env[ENV_KEY];
    expect(resolveGitGate({})).toBe("off");
  });
});
