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
    // The CLI runs in Node: without the ssr target Vite builds for the browser and
    // swaps `fs`, `path` and friends for an empty stub, which crashes on startup.
    ssr: true,
    rollupOptions: {
      external: [...getRollupExternalsFromPackageJson(__dirname), "@hyper-fetch/core"],
    },
    sourcemap: true,
  },
  // Dependencies stay bundled, only Node builtins (and peers above) are left as `require` calls
  ssr: {
    noExternal: true,
    resolve: {
      // Output is CJS, so prefer the CJS build of dual packages (ESM entries of some of them
      // touch `module.exports` and break once bundled)
      mainFields: ["main", "module"],
    },
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
