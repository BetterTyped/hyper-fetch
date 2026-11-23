import { sentryVitePlugin } from "@sentry/vite-plugin";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";
import { loadEnv } from "vite";
import type { ConfigEnv, UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

type ConfigOptions = {
  /** `electron` for the main and preload bundles, which Electron loads with `require()`, `renderer` for the page */
  target: "electron" | "renderer";
};

export const config = ({ mode }: ConfigEnv, { target }: ConfigOptions): UserConfig => {
  const env = loadEnv(mode, path.resolve(__dirname, "../"));

  return {
    build: {
      sourcemap: true, // Source map generation must be turned on
    },
    envDir: path.resolve(__dirname, "../"),
    plugins: [
      sentryVitePlugin({
        authToken: env.VITE_SENTRY_AUTH_TOKEN,
        org: "better-typed",
        project: "hyper-flow",
        telemetry: false,
        release: {
          // Sentry adds the release as a module imported before the entry. In a CommonJS bundle Rolldown then emits the
          // entry's `require()` interop above its own helpers, so the main process crashed on launch with
          // "M is not a function". The Electron SDK names the release from the app version on its own.
          inject: target === "renderer",
        },
      }),
      // Finds the nearest tsconfig of every file, so the sibling packages built from source resolve their own paths
      tsconfigPaths(),
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: path.join(__dirname, "../src/frontend/routes"),
        generatedRouteTree: path.join(__dirname, "../src/frontend/routeTree.gen.ts"),
        quoteStyle: "double",
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "../src/frontend"),
        "@app": path.resolve(__dirname, "../src/app"),
        "@server": path.resolve(__dirname, "../src/server"),
        "@shared": path.resolve(__dirname, "../src/shared"),
        // Monorepo packages publish `dist/`; alias to source so the app builds without pre-building siblings.
        "@hyper-fetch/core": path.resolve(__dirname, "../../core/src/index.ts"),
        "@hyper-fetch/axios": path.resolve(__dirname, "../../adapter-axios/src/index.ts"),
        "@hyper-fetch/firebase": path.resolve(__dirname, "../../adapter-firebase/src/index.ts"),
        "@hyper-fetch/firebase-admin": path.resolve(__dirname, "../../adapter-firebase-admin/src/index.ts"),
        "@hyper-fetch/graphql": path.resolve(__dirname, "../../adapter-graphql/src/index.ts"),
        "@hyper-fetch/plugin-devtools": path.resolve(__dirname, "../../plugin-devtools/src/index.ts"),
        "@hyper-fetch/react": path.resolve(__dirname, "../../react/src/index.ts"),
        "@hyper-fetch/sockets": path.resolve(__dirname, "../../sockets/src/index.ts"),
        "@hyper-fetch/testing": path.resolve(__dirname, "../../testing/src/index.ts"),
      },
    },
  };
};
