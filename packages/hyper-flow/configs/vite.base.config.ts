import path from "node:path";
import { loadEnv } from "vite";
import type { UserConfigFnObject } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { sentryVitePlugin } from "@sentry/vite-plugin";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { tanstackRouter } from "@tanstack/router-plugin/vite";

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
      },
    },
  };
};
