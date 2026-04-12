/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";
import { getDtsCompilerOptionsForPackage } from "../../scripts/vite-dts-internal-paths";
import { getRollupExternalsFromPackageJson } from "../../scripts/vite-lib-externals-from-package";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        cli: "src/cli/index.ts",
      },
      formats: ["cjs"],
    },
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: [...getRollupExternalsFromPackageJson(__dirname), "@hyper-fetch/core"],
    },
  },
  plugins: [
    dts({
      entryRoot: "src",
      compilerOptions: getDtsCompilerOptionsForPackage(__dirname),
    }),
    tsconfigPaths(),
  ],
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
    alias: {
      "@hyper-fetch/core": path.resolve(__dirname, "../core/src/index.ts"),
    },
  },
});
