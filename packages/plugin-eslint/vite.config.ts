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
      formats: ["cjs"],
    },
    minify: false,
    rollupOptions: {
      // ESLint and typescript-eslint come from the user's install. Bundling them also swaps Node built-ins for browser stubs.
      external: [...getRollupExternalsFromPackageJson(__dirname), /^eslint(\/|$)/, /^@typescript-eslint\//],
    },
    sourcemap: true,
  },
  plugins: [tsconfigPaths(), dts({ entryRoot: "src" })],
  test: {
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
