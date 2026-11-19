/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

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
  plugins: [dts({ entryRoot: "src" })],
  test: {
    coverage: {
      exclude: ["**/*.spec.*", "**/index.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
    },
    environment: "node",
    globals: true,
    include: ["__tests__/**/*.spec.ts"],
  },
});
