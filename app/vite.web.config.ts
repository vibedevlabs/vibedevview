import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Standalone web build of just the renderer — lets the editor + live preview +
 * validation be run/verified in a plain browser (no Electron). The `studio` IPC
 * bridge is absent in this mode, so the renderer falls back to its dev stub
 * (see src/renderer/lib/bridge.ts).
 */
export default defineConfig({
  root: resolve(__dirname, "src/renderer"),
  plugins: [react()],
  server: { port: 5174, host: true },
});
