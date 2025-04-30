import path from "node:path";
import type { UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export const config: UserConfig = {
  envDir: path.resolve(__dirname, "../"),
  plugins: [
    tsconfigPaths({
      root: path.resolve(__dirname, "../"),
    }),
  ],
  resolve: {
    preserveSymlinks: true,
  },
};
