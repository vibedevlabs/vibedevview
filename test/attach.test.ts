import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  ApiAttachTarget,
  SupabaseAttachTarget,
  attachLesson,
  buildApiRequest,
  chapterRowsFor,
  chooseAttachTarget,
  lessonPatchFor,
  momentRowsFor,
  parseApiResponse,
  parseIdRows,
  resolveSupabaseUrl,
  restHeaders,
  supabaseUrlFromServiceKey,
} from "../src/deliver/attach.js";
import type { MomentsBundle } from "../src/deliver/moments.js";
import type { FetchLike, HttpReply } from "../src/deliver/mux.js";

/**
 * Contracts under test:
 *
 * lessonPatchFor/chapterRowsFor/momentRowsFor: pure bundle → DB-row transforms; column
 *   names + values exactly mirror lessons / lesson_video_chapters / lesson_moments; title and
 *   content are omitted from the lesson PATCH when null (so we never blank existing copy).
 * buildApiRequest: POST <base><path> with Bearer token + JSON body === bundle; trailing slash
 *   on base is stripped; path overridable.
 * parseApiResponse: requires a non-empty string lessonSlug; counts default to 0.
 * restHeaders/parseIdRows: PostgREST apikey+Bearer (+Prefer) headers; pull `id` out of select=id rows.
 * ApiAttachTarget.attach: one POST, surfaces non-2xx as an error, returns the parsed slug, dryRun:false.
 * SupabaseAttachTarget.attach: resolve course→lesson by slug, PATCH lesson, DELETE+re-POST chapters
 *   and moments, in that exact order, with the exact row payloads; throws when course/lesson missing
 *   or any request fails; skips empty POSTs.
 * chooseAttachTarget: opt wins, else PALMIER_ATTACH_TARGET (api|supabase), else "sql".
 * attachLesson: DOUBLE GATE — sql never writes; api/supabase without --apply dry-run; api/supabase
 *   with --apply but no Mux playback id refuse; always emits the JSON + SQL artifacts.
 */

const ok = (body: unknown): HttpReply => ({
  ok: true,
  status: 200,
  text: async () => JSON.stringify(body),
  json: async () => body,
});
const empty = (): HttpReply => ({ ok: true, status: 204, text: async () => "", json: async () => null });
const fail = (status: number, text = "boom"): HttpReply => ({
  ok: false,
  status,
  text: async () => text,
  json: async () => ({}),
});

const bundle: MomentsBundle = {
  lesson: {
    course: "ai-mastery",
    slug: "meet-claude",
    title: "Meet Your New Coworker",
    content: "Intro to Claude",
    videoUrl: "mux:pb123",
    lessonType: "video",
    playerType: "interactive",
    isPublished: true,
    allowPreview: true,
  },
  sections: [
    { title: "Intro", startSeconds: 0, sortOrder: 0 },
    { title: "Setup", startSeconds: 30, sortOrder: 1 },
  ],
  moments: [
    {
      startSeconds: 35,
      title: "Install Claude",
      description: null,
      artifactKind: "snippet",
      artifactTitle: "Install",
      artifactBody: "curl it\nrun it",
      artifactUrl: null,
      artifactCopyable: true,
      isCheckpoint: false,
      checkpointInstructions: null,
      checkpointCtaLabel: null,
      sortOrder: 0,
    },
    {
      startSeconds: 60,
      title: "Pause and try",
      description: "do it",
      artifactKind: null,
      artifactTitle: null,
      artifactBody: null,
      artifactUrl: null,
      artifactCopyable: true,
      isCheckpoint: true,
      checkpointInstructions: "open Claude",
      checkpointCtaLabel: "I did it — continue",
      sortOrder: 1,
    },
  ],
};

describe("lessonPatchFor", () => {
  it("maps the lesson to a video+interactive published PATCH", () => {
    expect(lessonPatchFor(bundle)).toEqual({
      video_url: "mux:pb123",
      lesson_type: "video",
      player_type: "interactive",
      is_published: true,
      allow_preview: true,
      title: "Meet Your New Coworker",
      content: "Intro to Claude",
    });
  });

  it("omits title/content when null so existing copy is never blanked", () => {
    const patch = lessonPatchFor({ ...bundle, lesson: { ...bundle.lesson, title: null, content: null, videoUrl: null } });
    expect(patch).toEqual({
      video_url: null,
      lesson_type: "video",
      player_type: "interactive",
      is_published: true,
      allow_preview: true,
    });
    expect(patch).not.toHaveProperty("title");
    expect(patch).not.toHaveProperty("content");
  });
});

describe("chapterRowsFor", () => {
  it("maps sections to lesson_video_chapters rows with the lesson id", () => {
    expect(chapterRowsFor("L9", bundle)).toEqual([
      { lesson_id: "L9", title: "Intro", start_seconds: 0, sort_order: 0 },
      { lesson_id: "L9", title: "Setup", start_seconds: 30, sort_order: 1 },
    ]);
  });
});

describe("momentRowsFor", () => {
  it("maps moments to lesson_moments rows preserving artifact + checkpoint fields", () => {
    expect(momentRowsFor("L9", bundle)).toEqual([
      {
        lesson_id: "L9",
        start_seconds: 35,
        end_seconds: null,
        title: "Install Claude",
        description: null,
        artifact_kind: "snippet",
        artifact_title: "Install",
        artifact_body: "curl it\nrun it",
        artifact_url: null,
        artifact_copyable: true,
        is_checkpoint: false,
        checkpoint_instructions: null,
        checkpoint_cta_label: null,
        sort_order: 0,
      },
      {
        lesson_id: "L9",
        start_seconds: 60,
        end_seconds: null,
        title: "Pause and try",
        description: "do it",
        artifact_kind: null,
        artifact_title: null,
        artifact_body: null,
        artifact_url: null,
        artifact_copyable: true,
        is_checkpoint: true,
        checkpoint_instructions: "open Claude",
        checkpoint_cta_label: "I did it — continue",
        sort_order: 1,
      },
    ]);
  });
});

describe("buildApiRequest", () => {
  it("POSTs the bundle as JSON with a Bearer token to <base><default path>", () => {
    const { url, init } = buildApiRequest({ base: "https://lms.example.com/", token: "tok_abc" }, bundle);
    expect(url).toBe("https://lms.example.com/api/admin/lessons/moments");
    expect(init.method).toBe("POST");
    expect(init.headers["authorization"]).toBe("Bearer tok_abc");
    expect(init.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual(bundle);
  });

  it("honors a custom path", () => {
    const { url } = buildApiRequest({ base: "https://lms.example.com", token: "t", path: "/api/x" }, bundle);
    expect(url).toBe("https://lms.example.com/api/x");
  });
});

describe("parseApiResponse", () => {
  it("returns slug + counts on a well-formed response", () => {
    expect(parseApiResponse({ lessonSlug: "meet-claude", sectionCount: 2, momentCount: 3 })).toEqual({
      lessonSlug: "meet-claude",
      sectionCount: 2,
      momentCount: 3,
    });
  });

  it("defaults counts to 0 when omitted", () => {
    expect(parseApiResponse({ lessonSlug: "x" })).toEqual({ lessonSlug: "x", sectionCount: 0, momentCount: 0 });
  });

  it("throws when lessonSlug is missing or not a string", () => {
    expect(() => parseApiResponse({ sectionCount: 1 })).toThrow(/lessonSlug/);
    expect(() => parseApiResponse({ lessonSlug: 5 })).toThrow(/lessonSlug/);
    expect(() => parseApiResponse(null)).toThrow(/expected a JSON object/);
  });
});

describe("restHeaders", () => {
  it("sets apikey + Bearer + content-type, and Prefer when given", () => {
    expect(restHeaders("svc")).toEqual({
      apikey: "svc",
      authorization: "Bearer svc",
      "content-type": "application/json",
    });
    expect(restHeaders("svc", "return=minimal")["Prefer"]).toBe("return=minimal");
  });
});

describe("parseIdRows", () => {
  it("pulls the id column from each row", () => {
    expect(parseIdRows([{ id: "a" }, { id: "b" }])).toEqual(["a", "b"]);
  });
  it("throws on a non-array or a row without a string id", () => {
    expect(() => parseIdRows({ id: "a" })).toThrow(/expected an array/);
    expect(() => parseIdRows([{ name: "x" }])).toThrow(/missing string `id`/);
  });
});

interface RecordedCall {
  method: string;
  url: string;
  body: unknown;
  headers: Record<string, string> | undefined;
}

describe("ApiAttachTarget", () => {
  it("throws without base or token", () => {
    expect(() => new ApiAttachTarget({ base: "", token: "t" })).toThrow(/HGDW_LMS_API_BASE/);
    expect(() => new ApiAttachTarget({ base: "b", token: "" })).toThrow(/HGDW_LMS_API_TOKEN/);
  });

  it("POSTs once and returns the parsed slug", async () => {
    const calls: RecordedCall[] = [];
    const http: FetchLike = async (url, init) => {
      calls.push({ method: init.method, url, body: init.body ? JSON.parse(init.body as string) : undefined, headers: init.headers });
      return ok({ lessonSlug: "meet-claude", sectionCount: 2, momentCount: 2 });
    };
    const target = new ApiAttachTarget({ base: "https://lms.example.com", token: "tok", fetchLike: http });
    const res = await target.attach(bundle);
    expect(res).toEqual({ target: "api", lessonSlug: "meet-claude", dryRun: false });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.method).toBe("POST");
    expect(calls[0]?.url).toBe("https://lms.example.com/api/admin/lessons/moments");
    expect(calls[0]?.headers?.["authorization"]).toBe("Bearer tok");
    expect(calls[0]?.body).toEqual(bundle);
  });

  it("surfaces a non-2xx response as an error", async () => {
    const http: FetchLike = async () => fail(403, "forbidden");
    const target = new ApiAttachTarget({ base: "https://lms.example.com", token: "tok", fetchLike: http });
    await expect(target.attach(bundle)).rejects.toThrow(/hgdw-lms attach → 403: forbidden/);
  });
});

function supabaseFetch(calls: RecordedCall[], overrides: Partial<Record<string, HttpReply>> = {}): FetchLike {
  return async (url, init) => {
    calls.push({ method: init.method, url, body: init.body ? JSON.parse(init.body as string) : undefined, headers: init.headers });
    if (init.method === "GET" && url.includes("/courses?")) return overrides["courses"] ?? ok([{ id: "course-1" }]);
    if (init.method === "GET" && url.includes("/lessons?")) return overrides["lessons"] ?? ok([{ id: "lesson-9" }]);
    if (init.method === "PATCH") return overrides["patch"] ?? empty();
    return empty();
  };
}

describe("SupabaseAttachTarget", () => {
  it("throws without url or service key", () => {
    expect(() => new SupabaseAttachTarget({ url: "", serviceKey: "k" })).toThrow(/HGDW_SUPABASE_URL/);
    expect(() => new SupabaseAttachTarget({ url: "u", serviceKey: "" })).toThrow(/HGDW_SUPABASE_SERVICE_KEY/);
  });

  it("resolves course→lesson then PATCH + DELETE + POST in order with exact payloads", async () => {
    const calls: RecordedCall[] = [];
    const target = new SupabaseAttachTarget({
      url: "https://proj.supabase.co/",
      serviceKey: "svc",
      fetchLike: supabaseFetch(calls),
    });
    const res = await target.attach(bundle);
    expect(res).toEqual({ target: "supabase", lessonSlug: "meet-claude", dryRun: false });

    expect(calls.map((c) => c.method)).toEqual(["GET", "GET", "PATCH", "DELETE", "DELETE", "POST", "POST"]);
    expect(calls[0]?.url).toBe("https://proj.supabase.co/rest/v1/courses?slug=eq.ai-mastery&select=id");
    expect(calls[1]?.url).toBe("https://proj.supabase.co/rest/v1/lessons?course_id=eq.course-1&slug=eq.meet-claude&select=id");
    expect(calls[2]?.url).toBe("https://proj.supabase.co/rest/v1/lessons?id=eq.lesson-9");
    expect(calls[2]?.body).toEqual(lessonPatchFor(bundle));
    expect(calls[3]?.url).toContain("/rest/v1/lesson_video_chapters?lesson_id=eq.lesson-9");
    expect(calls[4]?.url).toContain("/rest/v1/lesson_moments?lesson_id=eq.lesson-9");
    expect(calls[5]?.body).toEqual(chapterRowsFor("lesson-9", bundle));
    expect(calls[5]?.headers?.["Prefer"]).toBe("return=minimal");
    expect(calls[6]?.body).toEqual(momentRowsFor("lesson-9", bundle));
    expect(calls[0]?.headers?.["apikey"]).toBe("svc");
  });

  it("throws when the course slug does not resolve, before writing anything", async () => {
    const calls: RecordedCall[] = [];
    const target = new SupabaseAttachTarget({
      url: "https://proj.supabase.co",
      serviceKey: "svc",
      fetchLike: supabaseFetch(calls, { courses: ok([]) }),
    });
    await expect(target.attach(bundle)).rejects.toThrow(/course "ai-mastery" not found/);
    expect(calls.map((c) => c.method)).toEqual(["GET"]);
  });

  it("skips the POSTs when there are no sections or moments", async () => {
    const calls: RecordedCall[] = [];
    const target = new SupabaseAttachTarget({
      url: "https://proj.supabase.co",
      serviceKey: "svc",
      fetchLike: supabaseFetch(calls),
    });
    await target.attach({ ...bundle, sections: [], moments: [] });
    expect(calls.map((c) => c.method)).toEqual(["GET", "GET", "PATCH", "DELETE", "DELETE"]);
  });

  it("surfaces a failed PATCH", async () => {
    const calls: RecordedCall[] = [];
    const target = new SupabaseAttachTarget({
      url: "https://proj.supabase.co",
      serviceKey: "svc",
      fetchLike: supabaseFetch(calls, { patch: fail(401, "nope") }),
    });
    await expect(target.attach(bundle)).rejects.toThrow(/supabase PATCH .* → 401: nope/);
  });
});

describe("chooseAttachTarget", () => {
  const saved = process.env.PALMIER_ATTACH_TARGET;
  afterEach(() => {
    if (saved === undefined) delete process.env.PALMIER_ATTACH_TARGET;
    else process.env.PALMIER_ATTACH_TARGET = saved;
  });

  it("prefers the explicit option", () => {
    process.env.PALMIER_ATTACH_TARGET = "supabase";
    expect(chooseAttachTarget("api")).toBe("api");
  });
  it("falls back to PALMIER_ATTACH_TARGET", () => {
    process.env.PALMIER_ATTACH_TARGET = "api";
    expect(chooseAttachTarget()).toBe("api");
  });
  it("defaults to sql", () => {
    delete process.env.PALMIER_ATTACH_TARGET;
    expect(chooseAttachTarget()).toBe("sql");
  });
});

describe("attachLesson (double-gate safety)", () => {
  let root = "";
  const lessonId = "AT1";
  const savedDir = process.env.PALMIER_PRODUCTIONS_DIR;
  const savedBase = process.env.HGDW_LMS_API_BASE;
  const savedToken = process.env.HGDW_LMS_API_TOKEN;

  beforeAll(async () => {
    root = await fs.mkdtemp(path.join(tmpdir(), "vdv-attach-"));
    process.env.PALMIER_PRODUCTIONS_DIR = root;
    const ws = path.join(root, lessonId);
    await fs.mkdir(ws, { recursive: true });
    await fs.writeFile(
      path.join(ws, "segments.json"),
      JSON.stringify({
        lessonId,
        title: "Attach Test",
        voiceDefault: "Ja'dan",
        segments: [
          { id: "01", frameId: "01", silent: false, durationEstimate: 30 },
          { id: "02", frameId: "02", silent: false, durationEstimate: 40 },
        ],
      }),
    );
    await fs.writeFile(
      path.join(ws, "timeline.json"),
      JSON.stringify({
        lessonId,
        fps: 24,
        segments: {
          "01": { duration: 30, source: "tts", audioPath: "/a/01.mp3" },
          "02": { duration: 40, source: "tts", audioPath: "/a/02.mp3" },
        },
      }),
    );
    await fs.writeFile(
      path.join(ws, "moments.yaml"),
      [
        "lesson:",
        "  course: ai-mastery",
        "  slug: meet-claude",
        "  title: Meet Your New Coworker",
        "sections:",
        "  - title: Intro",
        '    seg: "01"',
        "moments:",
        "  - kind: snippet",
        "    title: Install Claude",
        '    seg: "01"',
        "    offset: 5",
        '    body: "curl it"',
        "  - kind: pause",
        "    title: Pause and try",
        '    seg: "02"',
        "    instructions: open Claude",
        "",
      ].join("\n"),
    );
  });

  afterAll(async () => {
    if (savedDir === undefined) delete process.env.PALMIER_PRODUCTIONS_DIR;
    else process.env.PALMIER_PRODUCTIONS_DIR = savedDir;
    if (root) await fs.rm(root, { recursive: true, force: true });
  });

  it("sql target (default) never writes and always emits the JSON + SQL artifacts", async () => {
    const res = await attachLesson(lessonId);
    expect(res.target).toBe("sql");
    expect(res.applied).toBe(false);
    expect(res.dryRun).toBe(true);
    expect(res.sectionCount).toBe(1);
    expect(res.momentCount).toBe(2);
    expect(res.checkpointCount).toBe(1);
    expect(res.notes.join(" ")).toMatch(/review and run .*\.sql/);
    await expect(fs.stat(res.jsonPath)).resolves.toBeTruthy();
    await expect(fs.stat(res.sqlPath)).resolves.toBeTruthy();
  });

  it("api target WITHOUT --apply dry-runs and never constructs a network client", async () => {
    delete process.env.HGDW_LMS_API_BASE;
    delete process.env.HGDW_LMS_API_TOKEN;
    const res = await attachLesson(lessonId, { target: "api" });
    expect(res.target).toBe("api");
    expect(res.applied).toBe(false);
    expect(res.dryRun).toBe(true);
    expect(res.notes.join(" ")).toMatch(/dry run — would write via "api"/);
  });

  it("api/supabase WITH --apply but no Mux playback id refuses to attach", async () => {
    await expect(attachLesson(lessonId, { target: "api", apply: true })).rejects.toThrow(/no Mux playback id/);
    await expect(attachLesson(lessonId, { target: "supabase", apply: true })).rejects.toThrow(/no Mux playback id/);
  });

  it("api WITH --apply + playback id but missing creds fails on the credential gate (no network)", async () => {
    delete process.env.HGDW_LMS_API_BASE;
    delete process.env.HGDW_LMS_API_TOKEN;
    await expect(attachLesson(lessonId, { target: "api", apply: true, playbackId: "pb999" })).rejects.toThrow(
      /HGDW_LMS_API_BASE/,
    );
  });

  afterAll(() => {
    if (savedBase === undefined) delete process.env.HGDW_LMS_API_BASE;
    else process.env.HGDW_LMS_API_BASE = savedBase;
    if (savedToken === undefined) delete process.env.HGDW_LMS_API_TOKEN;
    else process.env.HGDW_LMS_API_TOKEN = savedToken;
  });
});

describe("supabaseUrlFromServiceKey", () => {
  function jwt(payload: Record<string, unknown>): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${header}.${body}.sig`;
  }

  it("derives https://<ref>.supabase.co from a service-role token", () => {
    const token = jwt({ iss: "supabase", ref: "qvzeehmdqjhrwbxapvqi", role: "service_role" });
    expect(supabaseUrlFromServiceKey(token)).toBe("https://qvzeehmdqjhrwbxapvqi.supabase.co");
  });

  it("returns null when the payload has no ref", () => {
    expect(supabaseUrlFromServiceKey(jwt({ iss: "supabase", role: "service_role" }))).toBeNull();
  });

  it("returns null for a non-JWT string and for undecodable garbage", () => {
    expect(supabaseUrlFromServiceKey("not-a-jwt")).toBeNull();
    expect(supabaseUrlFromServiceKey("aaa.@@@notbase64@@@.bbb")).toBeNull();
  });
});

describe("resolveSupabaseUrl precedence", () => {
  function jwt(ref: string): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify({ iss: "supabase", ref, role: "service_role" })).toString("base64url");
    return `${header}.${body}.sig`;
  }
  const HGDW = jwt("qvzeehmdqjhrwbxapvqi");

  it("prefers an explicit HGDW_SUPABASE_URL over key derivation and generic SUPABASE_URL", () => {
    expect(
      resolveSupabaseUrl({
        HGDW_SUPABASE_URL: "https://custom.hgdw.dev",
        HGDW_SUPABASE_SERVICE_KEY: HGDW,
        SUPABASE_URL: "https://other.supabase.co",
      }),
    ).toBe("https://custom.hgdw.dev");
  });

  it("derives from the HGDW key BEFORE a generic SUPABASE_URL (cross-project guard)", () => {
    // The exact bug: a stray SUPABASE_URL for an unrelated project must not win.
    expect(
      resolveSupabaseUrl({
        HGDW_SUPABASE_SERVICE_KEY: HGDW,
        SUPABASE_URL: "https://rxmaxzcmulfcpnprwosm.supabase.co",
      }),
    ).toBe("https://qvzeehmdqjhrwbxapvqi.supabase.co");
  });

  it("falls back to the generic SUPABASE_URL only when there is no HGDW key/url", () => {
    expect(resolveSupabaseUrl({ SUPABASE_URL: "https://generic.supabase.co" })).toBe(
      "https://generic.supabase.co",
    );
  });

  it("ignores blank/whitespace HGDW_SUPABASE_URL and returns empty when nothing resolvable", () => {
    expect(resolveSupabaseUrl({ HGDW_SUPABASE_URL: "  ", SUPABASE_URL: "  " })).toBe("");
    expect(resolveSupabaseUrl({})).toBe("");
  });
});
