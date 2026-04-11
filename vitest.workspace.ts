import { defineWorkspace } from "vitest/config";

// eslint-disable-next-line import/no-default-export
export default defineWorkspace([
  "packages/*/vite.config.ts",
  "examples/react-app/vite.config.ts",
  "examples/next-app/vitest.config.ts",
  "examples/next-app-router/vitest.config.ts",
]);
