import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { log } from "../util/log.js";
import type { Workspace } from "../workspace.js";
import type { AssembleResult, PlacedClip, TimelineBackend, TimelinePlan } from "./backend.js";

const SCOPE = "palmier";

/**
 * Tool-name candidates. Palmier Pro's MCP tool names aren't pinned by the spec,
 * so we discover the tool list at runtime and match by substring, with env
 * overrides (PALMIER_TOOL_IMPORT / _ADD / _STATE / _REPLACE) as an escape hatch.
 */
const TOOL_CANDIDATES = {
  import: ["import_media", "import", "add_media", "media_import"],
  add: ["add_to_timeline", "place_clip", "add_clip", "timeline_add", "insert_clip"],
  state: ["get_timeline", "read_timeline", "timeline_state", "get_state"],
  replace: ["replace_clip", "swap_clip", "replace_media", "replace"],
};

export interface PalmierBackendOptions {
  url?: string;
}

export class PalmierBackend implements TimelineBackend {
  readonly name = "palmier";
  private readonly url: string;
  private client?: Client;
  private toolNames: string[] = [];

  constructor(opts: PalmierBackendOptions = {}) {
    this.url = opts.url ?? process.env.PALMIER_MCP_URL ?? "http://127.0.0.1:19789/mcp";
  }

  private async connect(): Promise<Client> {
    if (this.client) return this.client;
    const client = new Client({ name: "hgdw-palmier", version: "0.1.0" }, { capabilities: {} });
    const transport = new StreamableHTTPClientTransport(new URL(this.url));
    try {
      await client.connect(transport);
    } catch (err) {
      throw new Error(
        `Could not reach Palmier Pro MCP at ${this.url}. ` +
          `Open Palmier Pro on the Mac (it only serves the MCP while running). Cause: ${(err as Error).message}`,
      );
    }
    const { tools } = await client.listTools();
    this.toolNames = tools.map((t) => t.name);
    log.info(SCOPE, `connected; ${tools.length} tools: ${this.toolNames.join(", ")}`);
    this.client = client;
    return client;
  }

  private resolveTool(kind: keyof typeof TOOL_CANDIDATES): string {
    const override = process.env[`PALMIER_TOOL_${kind.toUpperCase()}`];
    if (override) return override;
    for (const cand of TOOL_CANDIDATES[kind]) {
      const hit = this.toolNames.find((n) => n.toLowerCase().includes(cand));
      if (hit) return hit;
    }
    throw new Error(
      `No Palmier MCP tool matched "${kind}". Available: ${this.toolNames.join(", ") || "(none)"}. ` +
        `Set PALMIER_TOOL_${kind.toUpperCase()} to the correct tool name.`,
    );
  }

  private async call(name: string, args: Record<string, unknown>): Promise<unknown> {
    const client = await this.connect();
    const res = await client.callTool({ name, arguments: args });
    if ((res as { isError?: boolean }).isError) {
      throw new Error(`Palmier tool ${name} failed: ${JSON.stringify(res.content)}`);
    }
    return res;
  }

  private async place(clip: PlacedClip): Promise<void> {
    if (!clip.mediaPath) return;
    const importTool = this.resolveTool("import");
    const addTool = this.resolveTool("add");
    await this.call(importTool, { path: clip.mediaPath });
    await this.call(addTool, {
      path: clip.mediaPath,
      track: clip.track,
      position: clip.start,
      start: clip.start,
      duration: clip.duration,
      segment: clip.segId,
    });
    log.ok(SCOPE, `placed ${clip.track}/${clip.segId} @ ${clip.start.toFixed(2)}s`);
  }

  async assemble(plan: TimelinePlan, _ws: Workspace): Promise<AssembleResult> {
    await this.connect();
    let count = 0;
    // Track order matters: slides first (base), then recordings (replace), then audio.
    const order: PlacedClip["track"][] = ["Slides", "Recordings", "Voiceover"];
    for (const track of order) {
      for (const clip of plan.clips.filter((c) => c.track === track)) {
        await this.place(clip);
        count++;
      }
    }
    log.ok(SCOPE, `placed ${count} clips on the Palmier timeline`);
    return { backend: this.name, clipCount: count };
  }

  async swap(plan: TimelinePlan, segId: string, _ws: Workspace): Promise<void> {
    const replaceTool = this.resolveTool("replace");
    for (const clip of plan.clips.filter((c) => c.segId === segId && c.mediaPath)) {
      await this.call(replaceTool, {
        path: clip.mediaPath,
        track: clip.track,
        position: clip.start,
        duration: clip.duration,
        segment: clip.segId,
      });
      log.ok(SCOPE, `swapped ${clip.track}/${segId}`);
    }
  }

  async close(): Promise<void> {
    await this.client?.close().catch(() => {});
    this.client = undefined;
  }
}
