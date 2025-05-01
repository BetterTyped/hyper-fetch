import path from "node:path";
import { loadEnv } from "vite";
import type { UserConfigFnObject } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { sentryVitePlugin } from "@sentry/vite-plugin";

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
      }),
      tsconfigPaths({
        root: path.resolve(__dirname, "../"),
      }),
    ],
    resolve: {
      preserveSymlinks: true,
    },
  };
};
