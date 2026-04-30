import path from "path";
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";

import { getRollupExternalsFromPackageJson } from "../../scripts/vite-lib-externals-from-package";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      fileName: "index",
      formats: ["es"],
    },
    minify: false,
    rollupOptions: {
      external: getRollupExternalsFromPackageJson(__dirname),
    },
    sourcemap: true,
  },
  plugins: [tsconfigPaths(), dts({ entryRoot: "src" })],
  test: {
    alias: {
      "@hyper-fetch/core": path.resolve(__dirname, "../core/src/index.ts"),
      "@hyper-fetch/sockets": path.resolve(__dirname, "./src/index.ts"),
      "@hyper-fetch/testing": path.resolve(__dirname, "../testing/src/index.ts"),
    },
    coverage: {
      exclude: ["**/*.spec.*", "**/types.*", "**/constants.*", "**/index.ts"],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
    },
    globals: true,
    setupFiles: ["./__tests__/vitest.setup.ts"],
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["__tests__/features/**/*.spec.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
        },
      },
      {
        extends: true,
        test: {
          name: "e2e",
          environment: "node",
          include: ["__tests__/e2e/**/*.spec.{ts,tsx}"],
        },
      },
    ],
  },
});
