import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { z } from "zod";
import {
  AlignmentSchema,
  ManifestSchema,
  RecordingManifestSchema,
  TimelineSchema,
  type Alignment,
  type Manifest,
  type RecordingManifest,
  type Timeline,
} from "./types.js";

/**
 * A Workspace is the shared working directory for one production. Agents do not
 * talk to each other directly — they coordinate through the files here.
 */
export class Workspace {
  readonly lessonId: string;
  readonly root: string;

  constructor(lessonId: string, root: string) {
    this.lessonId = lessonId;
    this.root = root;
  }

  static productionsDir(): string {
    return (
      process.env.PALMIER_PRODUCTIONS_DIR ?? path.join(homedir(), "hgdw-productions")
    );
  }

  static for(lessonId: string): Workspace {
    return new Workspace(lessonId, path.join(Workspace.productionsDir(), lessonId));
  }

  // ── paths ──────────────────────────────────────────────────────────────
  get scriptPath() {
    return path.join(this.root, "script.md");
  }
  get manifestPath() {
    return path.join(this.root, "segments.json");
  }
  get timelinePath() {
    return path.join(this.root, "timeline.json");
  }
  get alignmentPath() {
    return path.join(this.root, "alignment.json");
  }
  get recordingManifestPath() {
    return path.join(this.root, "recordings", "recording-manifest.json");
  }
  get slidesDir() {
    return path.join(this.root, "slides");
  }
  get deckPath() {
    return path.join(this.slidesDir, "deck.html");
  }
  get audioDir() {
    return path.join(this.root, "audio", "individual");
  }
  get recordingsDir() {
    return path.join(this.root, "recordings");
  }
  get videosDir() {
    return path.join(this.root, "videos");
  }
  slidePath(frameId: string) {
    return path.join(this.slidesDir, `${frameId}.png`);
  }
  audioPath(segId: string) {
    return path.join(this.audioDir, `seg-${segId}.mp3`);
  }

  // ── lifecycle ────────────────────────────────────────────────────────────
  async ensure(): Promise<void> {
    await Promise.all(
      [this.root, this.slidesDir, this.audioDir, this.recordingsDir, this.videosDir].map((d) =>
        fs.mkdir(d, { recursive: true }),
      ),
    );
  }

  async exists(p: string): Promise<boolean> {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }

  // ── typed JSON IO ─────────────────────────────────────────────────────────
  private async readJson<T>(p: string, schema: z.ZodType<T, z.ZodTypeDef, unknown>): Promise<T> {
    const raw = await fs.readFile(p, "utf8");
    return schema.parse(JSON.parse(raw));
  }
  private async writeJson(p: string, data: unknown): Promise<void> {
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  }

  readManifest = () => this.readJson(this.manifestPath, ManifestSchema);
  writeManifest = (m: Manifest) => this.writeJson(this.manifestPath, m);

  readTimeline = () => this.readJson(this.timelinePath, TimelineSchema);
  writeTimeline = (t: Timeline) => this.writeJson(this.timelinePath, t);

  readAlignment = () => this.readJson(this.alignmentPath, AlignmentSchema);
  writeAlignment = (a: Alignment) => this.writeJson(this.alignmentPath, a);

  readRecordingManifest = () =>
    this.readJson(this.recordingManifestPath, RecordingManifestSchema);
  writeRecordingManifest = (r: RecordingManifest) =>
    this.writeJson(this.recordingManifestPath, r);
}
