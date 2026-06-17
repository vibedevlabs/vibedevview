import { promises as fs } from "node:fs";
import { FRAME_TYPES } from "../types.js";
import { complete, llmFromEnv, type LlmConfig } from "../llm.js";
import { parseScript } from "../script/parse.js";
import { log } from "../util/log.js";
import type { Workspace } from "../workspace.js";

const SCOPE = "script";

const SYSTEM_PROMPT = `You are the HGDW Script Agent. You turn a topic brief into a tutorial-video script for the "HOT GIRLS DONT WORK" (HGDW) curriculum.

Follow the HGDW teaching arc across the lesson: SOURCE → ABSORB → MIRROR → COMMAND.

Output a single Markdown document in EXACTLY this format and nothing else:

---
lesson: <slug>
title: <title>
track: <track name>
voice: Ja'dan
---

## <2-digit id> · <short label>
phase: <SOURCE|ABSORB|MIRROR|COMMAND>
duration: <seconds, integer>

SAY:
<spoken narration — natural, warm, direct. Omit for silent/visual-only segments.>

SLIDE:
\`\`\`yaml
frame: <one of the frame types below>
title: <…>
# plus fields appropriate to the frame (eyebrow, subtitle, body[], code, lang, stat, statLabel, columns[], tags[], caption)
\`\`\`

DO:
\`\`\`yaml
- action: <what to do on screen>
  target: <app or command>
  note: <optional>
\`\`\`

Rules:
- Every segment has a 2-digit id (01, 02, …) in order.
- Use SAY for narration, SLIDE for a rendered frame, DO only when a screen recording is needed.
- A segment may combine SAY + SLIDE, or SAY + DO (slide replaced by the recording).
- Keep each SAY to 1–3 sentences. Estimate duration from the narration (~165 wpm) for SAY, or visual hold time otherwise.
- Use C6-code frames for any code; put the code under the \`code:\` field with \`lang:\`.
- Open with N1-title, close with O1-outro.

Frame types: ${FRAME_TYPES.join(", ")}.`;

export interface ScriptAgentOptions {
  llm?: LlmConfig;
  topicBrief?: string;
}

/**
 * Script Agent — generates script.md from a topic brief using an LLM, then
 * validates it parses into segments. If script.md already exists it is left
 * untouched (the human-edited script is the source of truth). Requires an LLM
 * to be configured; otherwise instructs the operator to provide script.md.
 */
export async function runScriptAgent(ws: Workspace, opts: ScriptAgentOptions = {}): Promise<string> {
  await ws.ensure();
  if (await ws.exists(ws.scriptPath)) {
    log.info(SCOPE, "script.md already exists — leaving it untouched");
    return await fs.readFile(ws.scriptPath, "utf8");
  }

  const llm = opts.llm ?? llmFromEnv();
  if (!llm) {
    throw new Error(
      `No script.md at ${ws.scriptPath} and no LLM configured. Either drop a script.md in the ` +
        `production folder, or set PALMIER_LLM_API_KEY (+ PALMIER_LLM_PROVIDER/MODEL).`,
    );
  }

  const brief =
    opts.topicBrief ??
    ((await fs.readFile(ws.root + "/topic-brief.md", "utf8").catch(() => "")) ||
      `Lesson id: ${ws.lessonId}. Write an introductory HGDW lesson on this topic.`);

  log.step(SCOPE, `generating script.md via ${llm.provider}/${llm.model}`);
  const out = await complete(llm, SYSTEM_PROMPT, brief);
  const cleaned = out.replace(/^```(?:markdown)?\n?/i, "").replace(/```\s*$/i, "").trim() + "\n";

  // Validate before writing — a script that doesn't parse is not a script.
  parseScript(cleaned);
  await fs.writeFile(ws.scriptPath, cleaned, "utf8");
  log.ok(SCOPE, `wrote ${ws.scriptPath}`);
  return cleaned;
}
