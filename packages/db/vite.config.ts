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
      "@hyper-fetch/sockets": path.resolve(__dirname, "../sockets/src/index.ts"),
      "@hyper-fetch/testing": path.resolve(__dirname, "../testing/src/index.ts"),
      "@hyper-fetch/db": path.resolve(__dirname, "./src/index.ts"),
    },
    coverage: {
      exclude: ["**/*.spec.*", "**/*.types.ts", "**/index.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
    globals: true,
    setupFiles: ["./__tests__/vitest.setup.ts"],
    typecheck: {
      enabled: true,
      include: ["__tests__/**/*.types.spec.ts"],
      tsconfig: "./__tests__/tsconfig.json",
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["__tests__/features/**/*.spec.ts"],
          exclude: ["__tests__/**/*.types.spec.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["__tests__/integration/**/*.spec.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "e2e",
          environment: "node",
          include: ["__tests__/e2e/**/*.spec.ts"],
        },
      },
    ],
  },
});
