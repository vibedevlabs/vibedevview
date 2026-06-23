import { contextBridge, ipcRenderer } from "electron";
import type {
  CorrectRequest,
  DeliverPreview,
  DoctorResult,
  DraftRequest,
  DraftResult,
  EngineEvent,
  ExportSlidesResult,
  ProduceRequest,
  RunResult,
  StatusResult,
  StudioApi,
} from "../shared/ipc";

const api: StudioApi = {
  listLessons: () => ipcRenderer.invoke("studio:listLessons"),
  readScript: (id) => ipcRenderer.invoke("studio:readScript", id),
  writeScript: (id, text) => ipcRenderer.invoke("studio:writeScript", id, text),
  newLesson: (id: string): Promise<string> => ipcRenderer.invoke("studio:newLesson", id),
  status: (id): Promise<StatusResult> => ipcRenderer.invoke("studio:status", id),
  doctor: (): Promise<DoctorResult> => ipcRenderer.invoke("studio:doctor"),
  draft: (req: DraftRequest): Promise<DraftResult> => ipcRenderer.invoke("studio:draft", req),
  produce: (req: ProduceRequest): Promise<RunResult> => ipcRenderer.invoke("studio:produce", req),
  correct: (req: CorrectRequest): Promise<RunResult> => ipcRenderer.invoke("studio:correct", req),
  deliverPreview: (id: string): Promise<DeliverPreview> => ipcRenderer.invoke("studio:deliverPreview", id),
  exportSlides: (id: string): Promise<ExportSlidesResult> => ipcRenderer.invoke("studio:exportSlides", id),
  slideUrl: (id, frameId) => ipcRenderer.invoke("studio:slideUrl", id, frameId),
  onEvent: (handler: (event: EngineEvent) => void) => {
    const listener = (_e: unknown, event: EngineEvent) => handler(event);
    ipcRenderer.on("studio:event", listener);
    return () => ipcRenderer.removeListener("studio:event", listener);
  },
};

contextBridge.exposeInMainWorld("studio", api);
