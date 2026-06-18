import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { EngineAdapter } from "./engine-adapter";
import type { CorrectRequest, DraftRequest, EngineEvent, ProduceRequest } from "../shared/ipc";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Run the engine CLI with this Electron binary acting as plain Node.
const adapter = new EngineAdapter(process.execPath, { ELECTRON_RUN_AS_NODE: "1" });

let win: BrowserWindow | null = null;

function broadcast(event: EngineEvent): void {
  win?.webContents.send("studio:event", event);
}

function registerIpc(): void {
  ipcMain.handle("studio:listLessons", () => adapter.listLessons());
  ipcMain.handle("studio:readScript", (_e, id: string) => adapter.readScript(id));
  ipcMain.handle("studio:writeScript", (_e, id: string, text: string) => adapter.writeScript(id, text));
  ipcMain.handle("studio:newLesson", (_e, id: string) => adapter.newLesson(id));
  ipcMain.handle("studio:status", (_e, id: string) => adapter.status(id));
  ipcMain.handle("studio:doctor", () => adapter.doctor());
  ipcMain.handle("studio:draft", (_e, req: DraftRequest) => adapter.draft(req));
  ipcMain.handle("studio:produce", (_e, req: ProduceRequest) => adapter.produce(req, broadcast));
  ipcMain.handle("studio:correct", (_e, req: CorrectRequest) => adapter.correct(req, broadcast));
  ipcMain.handle("studio:deliverPreview", (_e, id: string) => adapter.deliverPreview(id));
  ipcMain.handle("studio:slideUrl", async (_e, id: string, frameId: string) => {
    const p = await adapter.slidePath(id, frameId);
    return p ? pathToFileURL(p).href : null;
  });
}

function createWindow(): void {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    title: "vibedevview Studio",
    backgroundColor: "#14110f",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      // The preload is an ESM module (index.mjs). Sandboxed renderers can only
      // load CommonJS preloads, so a sandboxed renderer would silently skip it
      // and `window.studio` would never be exposed (the app then falls back to
      // the browser stub — "engine actions disabled"). Disable the sandbox so
      // the ESM preload runs; contextIsolation still keeps the bridge isolated.
      sandbox: false,
    },
  });

  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) win.loadURL(devUrl);
  else win.loadFile(path.join(__dirname, "../renderer/index.html"));
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
