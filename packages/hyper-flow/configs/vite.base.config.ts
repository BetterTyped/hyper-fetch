import { sentryVitePlugin } from "@sentry/vite-plugin";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";
import { loadEnv } from "vite";
import type { UserConfigFnObject } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export const config: UserConfigFnObject = ({ mode }) => {
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
      }),
      tsconfigPaths({
        root: path.resolve(__dirname, "../"),
      }),
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: path.join(__dirname, "../src/frontend/routes"),
        generatedRouteTree: path.join(__dirname, "../src/frontend/routeTree.gen.ts"),
        quoteStyle: "double",
      }),
    ],
    resolve: {
      preserveSymlinks: true,
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
