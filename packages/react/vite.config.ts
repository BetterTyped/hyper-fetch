/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";
import { getDtsCompilerOptionsForPackage } from "../../scripts/vite-dts-internal-paths";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index",
    },
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: ["@hyper-fetch/core", "@hyper-fetch/sockets", "react", "react-dom"],
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
    environment: "jsdom",
    setupFiles: ["./__tests__/vitest.setup.ts"],
    include: ["__tests__/**/*.spec.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["**/*.spec.*", "**/types.*", "**/constants.*", "**/index.ts"],
    },
    alias: {
      "@hyper-fetch/core": path.resolve(__dirname, "../core/src/index.ts"),
      "@hyper-fetch/sockets": path.resolve(__dirname, "../sockets/src/index.ts"),
      "@hyper-fetch/testing": path.resolve(__dirname, "../testing/src/index.ts"),
    },
  },
});
