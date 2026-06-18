export * from "./types.js";
export * from "./brand.js";
export * from "./workspace.js";
export * from "./alignment.js";
export * from "./orchestrator.js";
export { parseScript } from "./script/parse.js";
export { runScriptAgent } from "./agents/script-agent.js";
export { runSlidesAgent } from "./agents/slides-agent.js";
export { runVoiceAgent } from "./agents/voice-agent.js";
export { runRecordingAgent } from "./agents/recording-agent.js";
export { buildPlan, clipsBySegment } from "./timeline/backend.js";
export type { TimelineBackend, TimelinePlan, PlacedClip } from "./timeline/backend.js";
export { FfmpegBackend, renderPlanToVideo } from "./timeline/ffmpeg-backend.js";
export type { RenderResult } from "./timeline/ffmpeg-backend.js";
export { PalmierBackend } from "./timeline/palmier-backend.js";
export { probeVideo, parseFfprobeJson } from "./util/exec.js";
export type { VideoProbe } from "./util/exec.js";

export { exportLesson, verifyExport } from "./deliver/export.js";
export type { ExportOptions, ExportResult } from "./deliver/export.js";
export {
  publishLesson,
  choosePublishTarget,
  MuxPublishTarget,
  muxAuthHeader,
  buildCreateUploadBody,
  parseUploadCreate,
  parseUploadStatus,
  parseAsset,
} from "./deliver/mux.js";
export type {
  PublishTarget,
  PublishTargetName,
  PublishOptions,
  PublishResult,
  PublishOutcome,
  FetchLike,
} from "./deliver/mux.js";
export {
  compileLessonMoments,
  prepareLessonMoments,
  compileMoments,
  mapMomentKind,
  emitMomentsSql,
  buildMomentsBundle,
} from "./deliver/moments.js";
export type {
  MomentsDoc,
  AuthoredMoment,
  CompiledMoments,
  CompiledSection,
  CompiledMoment,
  MomentsBundle,
  MomentsResult,
  PreparedMoments,
  AttachTarget,
  AttachTargetName,
} from "./deliver/moments.js";
export {
  attachLesson,
  chooseAttachTarget,
  ApiAttachTarget,
  SupabaseAttachTarget,
  buildApiRequest,
  parseApiResponse,
  restHeaders,
  parseIdRows,
  lessonPatchFor,
  chapterRowsFor,
  momentRowsFor,
  DEFAULT_API_PATH,
} from "./deliver/attach.js";
export type {
  AttachOptions,
  AttachResult,
  ApiAttachConfig,
  ApiAttachResponse,
  SupabaseAttachConfig,
  LessonPatch,
  ChapterRow,
  MomentRow,
} from "./deliver/attach.js";
