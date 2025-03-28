import fs from "node:fs";
import path from "node:path";
import chokidar from "chokidar";
import type { UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export const config: UserConfig = {
  plugins: [
    tsconfigPaths({
      root: path.resolve(__dirname, "../"),
    }),
    {
      // exclude @reins/router doesn't work
      name: "refresh-node_modules",
      configureServer() {
        const nodeModulesPath = path.resolve(__dirname, "node_modules");

        const watcher = chokidar.watch(nodeModulesPath, {
          ignored: [path.resolve(nodeModulesPath, ".vite")],
        });
        watcher.on("change", () => {
          // make vite restart server
          fs.writeFileSync(__filename, fs.readFileSync(__filename));
        });
      },
    },
  ],
  optimizeDeps: {
    exclude: ["@reins/router"],
  },
  resolve: {
    preserveSymlinks: true, // this is the fix!
  },
};
