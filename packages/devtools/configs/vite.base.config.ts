import path from "node:path";
import type { UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export const config: UserConfig = {
  plugins: [
    tsconfigPaths({
      root: path.resolve(__dirname, "../"),
    }),
  ],
  resolve: {
    preserveSymlinks: true,
  },
};
