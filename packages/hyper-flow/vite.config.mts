/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const workspaceHyperFetchAliases = {
  "@hyper-fetch/core": path.resolve(__dirname, "../core/src/index.ts"),
  "@hyper-fetch/axios": path.resolve(__dirname, "../adapter-axios/src/index.ts"),
  "@hyper-fetch/firebase": path.resolve(__dirname, "../adapter-firebase/src/index.ts"),
  "@hyper-fetch/firebase-admin": path.resolve(__dirname, "../adapter-firebase-admin/src/index.ts"),
  "@hyper-fetch/graphql": path.resolve(__dirname, "../adapter-graphql/src/index.ts"),
  "@hyper-fetch/plugin-devtools": path.resolve(__dirname, "../plugin-devtools/src/index.ts"),
  "@hyper-fetch/react": path.resolve(__dirname, "../react/src/index.ts"),
  "@hyper-fetch/sockets": path.resolve(__dirname, "../sockets/src/index.ts"),
  "@hyper-fetch/testing": path.resolve(__dirname, "../testing/src/index.ts"),
} as const;

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      ...workspaceHyperFetchAliases,
      "@server": path.resolve(__dirname, "src/server"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@app": path.resolve(__dirname, "src/app"),
      "@testing": path.resolve(__dirname, "__tests__"),
      "@/": path.resolve(__dirname, "src/frontend") + "/",
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    testTimeout: 15000,
    setupFiles: ["./__tests__/vitest.setup.ts"],
    include: ["__tests__/**/*.spec.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["**/*.spec.*", "**/types.*", "**/constants.*", "**/index.ts"],
    },
    alias: {
      ...workspaceHyperFetchAliases,
      "@server": path.resolve(__dirname, "src/server"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@app": path.resolve(__dirname, "src/app"),
      "@testing": path.resolve(__dirname, "__tests__"),
      "@/": path.resolve(__dirname, "src/frontend") + "/",
    },
  },
});
