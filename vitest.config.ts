import { defineConfig } from "vitest/config";

// Scope the engine's test run to test/ only. The Studio app (app/) has its own
// vitest + dependencies and is tested separately, so it must not be pulled into
// the engine's CI run (where app/ dependencies are not installed).
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
  },
});
