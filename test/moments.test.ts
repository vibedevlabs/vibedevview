import { describe, expect, it } from "vitest";
import {
  compileMoments,
  mapMomentKind,
  emitMomentsSql,
  buildMomentsBundle,
  MomentsDocSchema,
  type AuthoredMoment,
} from "../src/deliver/moments.js";
import type { Alignment } from "../src/types.js";

/**
 * Contracts under test:
 *
 * mapMomentKind(m): pure kind → LMS columns mapping.
 *   - prompt/snippet/note → artifactKind=kind, body kept, copyable defaults TRUE, not a checkpoint.
 *   - link → artifactKind='link', url kept, body dropped, copyable defaults TRUE.
 *   - file → artifactKind='file', url kept, copyable defaults FALSE.
 *   - pause → isCheckpoint=true, instructions/cta carried (cta defaults to DEFAULT_CTA),
 *             artifactKind='note' iff a body is present else null, copyable defaults FALSE.
 *   - explicit copyable always wins over the default.
 *
 * compileMoments(doc, alignment): resolve anchors → absolute seconds, sort by time, assign
 *   sort_order 1..n. `seg:` anchors resolve to alignment.segments[seg].start (+offset);
 *   `at:` anchors parse a timestamp (+offset). Throws on unknown seg, missing anchor,
 *   negative time, or time beyond totalDuration.
 *
 * emitMomentsSql(c, opts): idempotent BEGIN/COMMIT SQL modeled on the LMS seed —
 *   UPDATE lessons (video_url, player_type='interactive', flags), DELETE then re-INSERT
 *   chapters + one INSERT per moment, resolving the lesson by course+lesson slug. E'' escaping.
 *
 * buildMomentsBundle(c, playbackId): JSON contract for api/Electron — videoUrl = `mux:<id>` or null.
 */

const alignment: Alignment = {
  lessonId: "C1",
  totalDuration: 120,
  segments: {
    "01": { start: 0, end: 30, duration: 30 },
    "02": { start: 30, end: 75, duration: 45 },
    "03": { start: 75, end: 120, duration: 45 },
  },
};

describe("mapMomentKind", () => {
  const base = { title: "t" } as const;

  it("maps prompt to artifact_kind='prompt', copyable defaulting TRUE, not a checkpoint", () => {
    const m: AuthoredMoment = { ...base, kind: "prompt", body: "run this" };
    expect(mapMomentKind(m)).toEqual({
      artifactKind: "prompt",
      artifactBody: "run this",
      artifactUrl: null,
      artifactCopyable: true,
      isCheckpoint: false,
      checkpointInstructions: null,
      checkpointCtaLabel: null,
    });
  });

  it("maps snippet and note the same shape as prompt (body kept, copyable TRUE)", () => {
    for (const kind of ["snippet", "note"] as const) {
      const m: AuthoredMoment = { ...base, kind, body: "x" };
      const got = mapMomentKind(m);
      expect(got.artifactKind).toBe(kind);
      expect(got.artifactBody).toBe("x");
      expect(got.artifactCopyable).toBe(true);
      expect(got.isCheckpoint).toBe(false);
    }
  });

  it("maps link to url, drops body, copyable defaults TRUE", () => {
    const m: AuthoredMoment = { ...base, kind: "link", url: "https://x.dev", body: "ignored" };
    const got = mapMomentKind(m);
    expect(got).toEqual({
      artifactKind: "link",
      artifactBody: null,
      artifactUrl: "https://x.dev",
      artifactCopyable: true,
      isCheckpoint: false,
      checkpointInstructions: null,
      checkpointCtaLabel: null,
    });
  });

  it("maps file to url with copyable defaulting FALSE (downloads, not copy-paste)", () => {
    const m: AuthoredMoment = { ...base, kind: "file", url: "https://x.dev/a.zip" };
    const got = mapMomentKind(m);
    expect(got.artifactKind).toBe("file");
    expect(got.artifactUrl).toBe("https://x.dev/a.zip");
    expect(got.artifactCopyable).toBe(false);
  });

  it("maps pause to a checkpoint, defaulting the CTA and carrying instructions", () => {
    const m: AuthoredMoment = { ...base, kind: "pause", instructions: "1. do x\n2. do y" };
    const got = mapMomentKind(m);
    expect(got.isCheckpoint).toBe(true);
    expect(got.checkpointInstructions).toBe("1. do x\n2. do y");
    expect(got.checkpointCtaLabel).toBe("I did it — continue");
    expect(got.artifactKind).toBeNull(); // no body → no artifact
    expect(got.artifactCopyable).toBe(false);
  });

  it("pause WITH a body becomes a note-artifact checkpoint", () => {
    const m: AuthoredMoment = { ...base, kind: "pause", body: "note text" };
    const got = mapMomentKind(m);
    expect(got.isCheckpoint).toBe(true);
    expect(got.artifactKind).toBe("note");
    expect(got.artifactBody).toBe("note text");
  });

  it("explicit copyable=false overrides the prompt default of true", () => {
    const m: AuthoredMoment = { ...base, kind: "prompt", body: "x", copyable: false };
    expect(mapMomentKind(m).artifactCopyable).toBe(false);
  });

  it("explicit copyable=true overrides the file default of false", () => {
    const m: AuthoredMoment = { ...base, kind: "file", url: "u", copyable: true };
    expect(mapMomentKind(m).artifactCopyable).toBe(true);
  });
});

describe("compileMoments anchor resolution + ordering", () => {
  it("resolves seg anchors to segment start + offset and sorts by time", () => {
    const doc = MomentsDocSchema.parse({
      lesson: { course: "c", slug: "s" },
      moments: [
        { kind: "note", title: "late", seg: "03" }, // 75
        { kind: "note", title: "early", seg: "01", offset: 5 }, // 5
        { kind: "note", title: "mid", at: "0:40" }, // 40
      ],
    });
    const c = compileMoments(doc, alignment);
    expect(c.moments.map((m) => [m.title, m.startSeconds, m.sortOrder])).toEqual([
      ["early", 5, 1],
      ["mid", 40, 2],
      ["late", 75, 3],
    ]);
  });

  it("resolves section anchors and assigns sequential sort_order from 1", () => {
    const doc = MomentsDocSchema.parse({
      lesson: { course: "c", slug: "s" },
      sections: [
        { title: "B", seg: "02" },
        { title: "A", seg: "01" },
      ],
    });
    const c = compileMoments(doc, alignment);
    expect(c.sections).toEqual([
      { title: "A", startSeconds: 0, sortOrder: 1 },
      { title: "B", startSeconds: 30, sortOrder: 2 },
    ]);
  });

  it("throws on an unknown segment id", () => {
    const doc = MomentsDocSchema.parse({
      lesson: { course: "c", slug: "s" },
      moments: [{ kind: "note", title: "x", seg: "99" }],
    });
    expect(() => compileMoments(doc, alignment)).toThrow(/unknown segment "99"/);
  });

  it("throws when neither at nor seg is given", () => {
    const doc = MomentsDocSchema.parse({
      lesson: { course: "c", slug: "s" },
      moments: [{ kind: "note", title: "x" }],
    });
    expect(() => compileMoments(doc, alignment)).toThrow(/must specify "at" .* or "seg"/);
  });

  it("throws when an anchor resolves past the end of the video", () => {
    const doc = MomentsDocSchema.parse({
      lesson: { course: "c", slug: "s" },
      moments: [{ kind: "note", title: "x", at: "2:30" }], // 150 > 120
    });
    expect(() => compileMoments(doc, alignment)).toThrow(/exceeds video length/);
  });

  it("throws on a negative resolved time (negative offset before a segment)", () => {
    const doc = MomentsDocSchema.parse({
      lesson: { course: "c", slug: "s" },
      moments: [{ kind: "note", title: "x", seg: "01", offset: -2 }],
    });
    expect(() => compileMoments(doc, alignment)).toThrow(/negative time/);
  });
});

describe("emitMomentsSql", () => {
  const doc = MomentsDocSchema.parse({
    lesson: { course: "ai-mastery", slug: "meet-claude", title: "Meet Claude" },
    sections: [{ title: "Intro", seg: "01" }],
    moments: [
      { kind: "prompt", title: "Install", body: "curl it\nrun it", seg: "01", offset: 5 },
      { kind: "pause", title: "Try it", instructions: "Do the thing", seg: "02" },
    ],
  });
  const compiled = compileMoments(doc, alignment);

  it("wraps everything in a single BEGIN/COMMIT transaction", () => {
    const sql = emitMomentsSql(compiled, { playbackId: "pb123" });
    expect(sql).toContain("BEGIN;");
    expect(sql.trimEnd().endsWith("COMMIT;")).toBe(true);
    expect(sql.match(/BEGIN;/g)).toHaveLength(1);
    expect(sql.match(/COMMIT;/g)).toHaveLength(1);
  });

  it("sets the Mux url, interactive player_type and publish flags on the lesson", () => {
    const sql = emitMomentsSql(compiled, { playbackId: "pb123" });
    expect(sql).toContain("video_url = E'mux:pb123'");
    expect(sql).toContain("player_type = 'interactive'");
    expect(sql).toContain("is_published = true");
    expect(sql).toContain("allow_preview = true");
    expect(sql).toContain("title = E'Meet Claude'");
  });

  it("uses a placeholder + TODO when no playback id is known", () => {
    const sql = emitMomentsSql(compiled, { playbackId: null });
    expect(sql).toContain("video_url = E'mux:REPLACE_WITH_PLAYBACK_ID'");
    expect(sql).toContain("-- TODO");
  });

  it("DELETEs existing chapters and moments before reinserting (idempotent)", () => {
    const sql = emitMomentsSql(compiled, { playbackId: "pb" });
    expect(sql).toContain("DELETE FROM lesson_video_chapters WHERE lesson_id IN");
    expect(sql).toContain("DELETE FROM lesson_moments WHERE lesson_id IN");
  });

  it("resolves the lesson by course slug + lesson slug", () => {
    const sql = emitMomentsSql(compiled, { playbackId: "pb" });
    expect(sql).toContain("c.slug = 'ai-mastery' AND l.slug = 'meet-claude'");
  });

  it("escapes newlines and apostrophes in E'' string literals", () => {
    const sql = emitMomentsSql(compiled, { playbackId: "pb" });
    // body "curl it\nrun it" → newline becomes backslash-n inside the literal
    expect(sql).toContain("E'curl it\\nrun it'");
    expect(sql).not.toContain("curl it\nrun it'"); // no raw newline inside a literal
  });

  it("emits the checkpoint moment with is_checkpoint=true and the default CTA", () => {
    const sql = emitMomentsSql(compiled, { playbackId: "pb" });
    expect(sql).toContain("checkpoint_instructions");
    expect(sql).toContain("E'Do the thing'");
    expect(sql).toContain("E'I did it — continue'");
  });

  it("emits one INSERT per moment plus the chapters insert", () => {
    const sql = emitMomentsSql(compiled, { playbackId: "pb" });
    expect(sql.match(/INSERT INTO lesson_moments/g)).toHaveLength(2);
    expect(sql.match(/INSERT INTO lesson_video_chapters/g)).toHaveLength(1);
  });

  it("omits the lesson UPDATE entirely when updateLesson=false", () => {
    const sql = emitMomentsSql(compiled, { playbackId: "pb", updateLesson: false });
    expect(sql).not.toContain("UPDATE lessons");
    expect(sql).toContain("INSERT INTO lesson_moments");
  });
});

describe("buildMomentsBundle", () => {
  const compiled = compileMoments(
    MomentsDocSchema.parse({ lesson: { course: "c", slug: "s" }, moments: [] }),
    alignment,
  );

  it("sets videoUrl to mux:<id> and the interactive lesson fields when published", () => {
    const b = buildMomentsBundle(compiled, "pb999");
    expect(b.lesson.videoUrl).toBe("mux:pb999");
    expect(b.lesson.playerType).toBe("interactive");
    expect(b.lesson.lessonType).toBe("video");
    expect(b.lesson.isPublished).toBe(true);
    expect(b.lesson.allowPreview).toBe(true);
  });

  it("leaves videoUrl null when there is no playback id yet", () => {
    expect(buildMomentsBundle(compiled, null).lesson.videoUrl).toBeNull();
  });
});
