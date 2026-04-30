/// <reference types="vitest/config" />
import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";

import { getRollupExternalsFromPackageJson } from "../../scripts/vite-lib-externals-from-package";

export default defineConfig({
  build: {
    lib: {
      entry: {
        cli: "src/cli/index.ts",
        index: "src/index.ts",
      },
      formats: ["cjs"],
    },
    minify: false,
    rollupOptions: {
      external: [...getRollupExternalsFromPackageJson(__dirname), "@hyper-fetch/core"],
    },
    sourcemap: true,
  },
  plugins: [tsconfigPaths(), dts({ entryRoot: "src" })],
  test: {
    alias: {
      "@hyper-fetch/core": path.resolve(__dirname, "../core/src/index.ts"),
    },
    coverage: {
      exclude: ["**/*.spec.*", "**/types.*", "**/constants.*", "**/index.ts"],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
    },
    environment: "node",
    globals: true,
    include: ["__tests__/**/*.spec.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
    setupFiles: ["./__tests__/vitest.setup.ts"],
  },
});
