import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const workspaceHyperFetchAliases = {
  "@hyper-fetch/axios": path.resolve(__dirname, "../adapter-axios/src/index.ts"),
  "@hyper-fetch/core": path.resolve(__dirname, "../core/src/index.ts"),
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
      "@/": `${path.resolve(__dirname, "src/frontend")}/`,
      "@app": path.resolve(__dirname, "src/app"),
      "@server": path.resolve(__dirname, "src/server"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@testing": path.resolve(__dirname, "__tests__"),
    },
  },
  test: {
    alias: {
      ...workspaceHyperFetchAliases,
      "@/": `${path.resolve(__dirname, "src/frontend")}/`,
      "@app": path.resolve(__dirname, "src/app"),
      "@server": path.resolve(__dirname, "src/server"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@testing": path.resolve(__dirname, "__tests__"),
    },
    coverage: {
      exclude: ["**/*.spec.*", "**/types.*", "**/constants.*", "**/index.ts"],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
    },
    environment: "jsdom",
    globals: true,
    include: ["__tests__/**/*.spec.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
    setupFiles: ["./__tests__/vitest.setup.ts"],
    testTimeout: 15_000,
  },
});
