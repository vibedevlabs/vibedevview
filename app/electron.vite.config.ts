import { resolve } from "node:path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    build: {
      lib: { entry: resolve(__dirname, "src/main/index.ts") },
      rollupOptions: { external: ["electron"] },
    },
  },
  preload: {
    build: {
      lib: { entry: resolve(__dirname, "src/preload/index.ts") },
      rollupOptions: { external: ["electron"] },
    },
  },
  renderer: {
    root: resolve(__dirname, "src/renderer"),
    build: {
      rollupOptions: { input: resolve(__dirname, "src/renderer/index.html") },
    },
    plugins: [react()],
  },
});
