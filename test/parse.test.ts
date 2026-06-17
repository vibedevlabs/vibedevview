import { describe, expect, it } from "vitest";
import { parseScript } from "../src/script/parse.js";
import { hasDo, hasSay, hasSlide } from "../src/types.js";

/**
 * Contract for parseScript(text) -> Manifest:
 *  - Reads YAML frontmatter: lesson|lessonId, title, track, voice|voiceDefault.
 *  - Splits body on `## <id> · <label>` headings; <id> is the segment id.
 *  - Directives (phase|duration|voice|silent|frame_id) apply to the segment.
 *  - SAY: captures following prose until the next label/heading.
 *  - SLIDE:/DO: consume the next fenced YAML block (validated by zod).
 *  - frameId defaults to the segment id unless frame_id directive overrides.
 *  - duration: uses the directive; otherwise estimates from word count (~165 wpm, min 2).
 *  - silent accepts true/yes/1; output is validated by ManifestSchema (throws on bad data).
 */

const SCRIPT = `---
lesson: B-AB1
title: Build With AI
track: BUILD / ABSORB 1
voice: Courtney
---

## 01 · Cold open
phase: SOURCE
duration: 9

SAY:
By the end of this session
you will do three things.

SLIDE:
\`\`\`yaml
frame: N1-title
title: Build With AI
subtitle: Specs, Agents & the Build Loop
\`\`\`

## 07 · Vocab
silent: yes
frame_id: VOCAB

SLIDE:
\`\`\`yaml
frame: N4-vocab
tags: [spec, agent, loop]
\`\`\`

## 09 · Terminal demo
SAY:
Watch what happens when we run the build.

DO:
\`\`\`yaml
- action: Open Terminal
- action: Run the build
  target: npm run build
\`\`\`
`;

describe("parseScript", () => {
  const m = parseScript(SCRIPT);

  it("parses frontmatter into manifest fields", () => {
    expect(m.lessonId).toBe("B-AB1");
    expect(m.title).toBe("Build With AI");
    expect(m.track).toBe("BUILD / ABSORB 1");
    expect(m.voiceDefault).toBe("Courtney");
    expect(m.segments).toHaveLength(3);
  });

  it("captures multi-line SAY, phase, and explicit duration on segment 01", () => {
    const s = m.segments[0]!;
    expect(s.id).toBe("01");
    expect(s.label).toBe("Cold open");
    expect(s.phase).toBe("SOURCE");
    expect(s.durationEstimate).toBe(9);
    expect(s.say).toBe("By the end of this session\nyou will do three things.");
    expect(s.frameId).toBe("01"); // defaults to id
    expect(s.slide?.frame).toBe("N1-title");
    expect(s.slide?.subtitle).toBe("Specs, Agents & the Build Loop");
  });

  it("honors silent + frame_id override and estimates duration when omitted (segment 07)", () => {
    const s = m.segments[1]!;
    expect(s.silent).toBe(true);
    expect(s.frameId).toBe("VOCAB");
    expect(s.slide?.frame).toBe("N4-vocab");
    expect(s.slide?.tags).toEqual(["spec", "agent", "loop"]);
    // No SAY and no duration directive -> guessDuration returns 4 for non-narrated.
    expect(s.durationEstimate).toBe(4);
  });

  it("parses a DO block into ordered steps with targets (segment 09)", () => {
    const s = m.segments[2]!;
    expect(s.do).toEqual([
      { action: "Open Terminal" },
      { action: "Run the build", target: "npm run build" },
    ]);
    // 8 words / 165 wpm * 60 ≈ 2.9 -> rounds to 3.
    expect(s.durationEstimate).toBe(3);
  });

  it("derivations classify each segment correctly", () => {
    const [cold, vocab, demo] = m.segments;
    expect([hasSay(cold!), hasSlide(cold!), hasDo(cold!)]).toEqual([true, true, false]);
    // silent segment: has a slide but SAY is suppressed by silent flag.
    expect([hasSay(vocab!), hasSlide(vocab!), hasDo(vocab!)]).toEqual([false, true, false]);
    expect([hasSay(demo!), hasSlide(demo!), hasDo(demo!)]).toEqual([true, false, true]);
  });

  it("falls back to defaults when frontmatter is absent", () => {
    const m2 = parseScript("## 01 · Hi\nSAY:\nHello there.\n");
    expect(m2.lessonId).toBe("untitled");
    expect(m2.title).toBe("Untitled Lesson");
    expect(m2.voiceDefault).toBe("Courtney");
    expect(m2.segments).toHaveLength(1);
    expect(m2.segments[0]!.say).toBe("Hello there.");
  });

  it("rejects an invalid frame type via schema validation", () => {
    const bad = `## 01 · Bad\nduration: 5\nSLIDE:\n\`\`\`yaml\nframe: NOPE-9000\n\`\`\`\n`;
    expect(() => parseScript(bad)).toThrow();
  });
});
