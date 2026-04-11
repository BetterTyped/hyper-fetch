/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["cjs"],
      fileName: "index",
    },
    sourcemap: true,
    minify: false,
  },
  plugins: [dts(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./__tests__/vitest.setup.ts"],
    include: ["__tests__/**/*.spec.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["**/*.spec.*", "**/types.*", "**/constants.*", "**/index.ts"],
    },
  },
});
