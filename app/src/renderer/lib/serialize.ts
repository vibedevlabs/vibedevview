import YAML from "yaml";
import type { Manifest, Segment } from "vibedevview/types";

/**
 * Serialize a Manifest back into the script.md format `parseScript` reads. The
 * invariant (covered by a round-trip test) is:
 *   parseScript(serializeScript(m)) deep-equals m
 * so the structured segment editor can mutate the manifest and re-emit source
 * without drifting from the raw-markdown view.
 */
export function serializeScript(m: Manifest): string {
  const meta: Record<string, string> = { lesson: m.lessonId, title: m.title };
  if (m.track) meta.track = m.track;
  meta.voice = m.voiceDefault;
  const frontmatter = `---\n${YAML.stringify(meta).trimEnd()}\n---\n`;
  const body = m.segments.map(serializeSegment).join("\n");
  return `${frontmatter}\n${body}`;
}

function serializeSegment(seg: Segment): string {
  const lines: string[] = [];
  lines.push(seg.label ? `## ${seg.id} · ${seg.label}` : `## ${seg.id}`);
  if (seg.phase) lines.push(`phase: ${seg.phase}`);
  lines.push(`duration: ${seg.durationEstimate}`);
  if (seg.voice) lines.push(`voice: ${seg.voice}`);
  if (seg.silent) lines.push(`silent: true`);
  if (seg.frameId !== seg.id) lines.push(`frame_id: ${seg.frameId}`);

  if (seg.say) lines.push("", "SAY:", seg.say);
  if (seg.slide) lines.push("", "SLIDE:", "```yaml", YAML.stringify(seg.slide).trimEnd(), "```");
  if (seg.do && seg.do.length) lines.push("", "DO:", "```yaml", YAML.stringify(seg.do).trimEnd(), "```");

  return lines.join("\n") + "\n";
}
