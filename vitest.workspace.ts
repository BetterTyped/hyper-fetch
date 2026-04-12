import { defineConfig } from "vitest/config";

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  test: {
    projects: [
      "packages/*/vite.config.ts",
      "examples/react-app/vite.config.ts",
      "examples/next-app/vitest.config.ts",
      "examples/next-app-router/vitest.config.ts",
    ],
  },
});
