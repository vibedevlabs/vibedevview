import YAML from "yaml";
import {
  ManifestSchema,
  SlideSpecSchema,
  DoStepSchema,
  type Manifest,
  type Segment,
} from "../types.js";

/**
 * script.md format (authored by the Script Agent, human-editable):
 *
 *   ---
 *   lesson: B-AB1
 *   title: Build With AI
 *   track: BUILD / ABSORB 1
 *   voice: Ja'dan
 *   ---
 *
 *   ## 01 · Cold open
 *   phase: SOURCE
 *   duration: 9
 *
 *   SAY:
 *   By the end of this session you'll do three things...
 *
 *   SLIDE:
 *   ```yaml
 *   frame: N1-title
 *   title: Build With AI
 *   ```
 *
 *   ## 12 · Terminal demo
 *   duration: 20
 *   SAY:
 *   Watch what happens when we run the build.
 *   DO:
 *   ```yaml
 *   - action: Open Terminal
 *   - action: Run the build
 *     target: npm run build
 *   ```
 */

const FENCE = /^(```|~~~)\s*(\w+)?\s*$/;
const HEADING = /^##\s+(\S+)\s*(?:[·|\-—:]\s*)?(.*)$/;
const DIRECTIVE = /^(phase|duration|voice|silent|frame_id|frameId)\s*:\s*(.+)$/i;
const LABEL = /^(SAY|SLIDE|DO)\s*:\s*$/i;

interface RawSegment {
  id: string;
  label?: string;
  directives: Record<string, string>;
  say?: string;
  slideYaml?: string;
  doYaml?: string;
}

function splitFrontmatter(text: string): { meta: Record<string, unknown>; body: string } {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: text };
  const meta = (YAML.parse(m[1]!) ?? {}) as Record<string, unknown>;
  return { meta, body: text.slice(m[0].length) };
}

function consumeFence(lines: string[], start: number): { content: string; next: number } {
  // lines[start] is the opening fence.
  const open = lines[start]!.match(FENCE)!;
  const marker = open[1]!;
  const buf: string[] = [];
  let i = start + 1;
  for (; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.startsWith(marker)) {
      i++;
      break;
    }
    buf.push(line);
  }
  return { content: buf.join("\n"), next: i };
}

function parseSegmentBlock(id: string, label: string | undefined, lines: string[]): RawSegment {
  const seg: RawSegment = { id, label: label?.trim() || undefined, directives: {} };
  let mode: "none" | "say" = "none";
  const sayLines: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    const labelMatch = line.match(LABEL);
    const directiveMatch = line.match(DIRECTIVE);
    const fenceMatch = line.match(FENCE);

    if (labelMatch) {
      const kind = labelMatch[1]!.toUpperCase();
      mode = "none";
      // SLIDE / DO are followed by a fenced yaml block (skipping blank lines).
      if (kind === "SLIDE" || kind === "DO") {
        let j = i + 1;
        while (j < lines.length && lines[j]!.trim() === "") j++;
        if (j < lines.length && FENCE.test(lines[j]!)) {
          const { content, next } = consumeFence(lines, j);
          if (kind === "SLIDE") seg.slideYaml = content;
          else seg.doYaml = content;
          i = next;
          continue;
        }
      } else if (kind === "SAY") {
        mode = "say";
      }
      i++;
      continue;
    }

    if (mode === "none" && directiveMatch) {
      seg.directives[directiveMatch[1]!.toLowerCase()] = directiveMatch[2]!.trim();
      i++;
      continue;
    }

    if (mode === "none" && fenceMatch) {
      // Stray fenced block with no label — skip it safely.
      const { next } = consumeFence(lines, i);
      i = next;
      continue;
    }

    if (mode === "say") {
      sayLines.push(line);
    }
    i++;
  }

  const say = sayLines.join("\n").trim();
  if (say) seg.say = say;
  return seg;
}

function toSegment(raw: RawSegment): Segment {
  const d = raw.directives;
  const slide = raw.slideYaml ? SlideSpecSchema.parse(YAML.parse(raw.slideYaml)) : undefined;
  const doSteps = raw.doYaml
    ? (YAML.parse(raw.doYaml) as unknown[]).map((s) => DoStepSchema.parse(s))
    : undefined;

  const silent = /^(true|yes|1)$/i.test(d.silent ?? "");
  const durationEstimate = d.duration ? Number.parseFloat(d.duration) : guessDuration(raw);

  return {
    id: raw.id,
    frameId: (d.frame_id ?? d.frameid ?? raw.id).trim(),
    label: raw.label,
    phase: d.phase ? (d.phase.toUpperCase() as Segment["phase"]) : undefined,
    say: raw.say,
    slide,
    do: doSteps,
    voice: d.voice,
    silent,
    durationEstimate: durationEstimate > 0 ? durationEstimate : 4,
  };
}

/** Rough estimate (~165 wpm) used only when a segment omits `duration`. */
function guessDuration(raw: RawSegment): number {
  if (raw.say) {
    const words = raw.say.split(/\s+/).filter(Boolean).length;
    return Math.max(2, Math.round((words / 165) * 60));
  }
  return 4;
}

/** Parse a script.md document into a validated Manifest (segments.json). */
export function parseScript(text: string): Manifest {
  const { meta, body } = splitFrontmatter(text);
  const lines = body.split("\n");

  const segments: Segment[] = [];
  let current: { id: string; label?: string; buf: string[] } | null = null;
  const flush = () => {
    if (current) segments.push(toSegment(parseSegmentBlock(current.id, current.label, current.buf)));
  };

  for (const line of lines) {
    const h = line.match(HEADING);
    if (h) {
      flush();
      current = { id: h[1]!.trim(), label: h[2], buf: [] };
    } else if (current) {
      current.buf.push(line);
    }
  }
  flush();

  const manifest: Manifest = {
    lessonId: String(meta.lesson ?? meta.lessonId ?? "untitled"),
    title: String(meta.title ?? "Untitled Lesson"),
    track: meta.track ? String(meta.track) : undefined,
    voiceDefault: String(meta.voice ?? meta.voiceDefault ?? "Ja'dan"),
    segments,
  };
  return ManifestSchema.parse(manifest);
}
