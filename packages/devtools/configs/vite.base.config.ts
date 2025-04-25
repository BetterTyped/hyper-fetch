import path from "node:path";
import type { UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export const config: UserConfig = {
  build: {
    rollupOptions: {
      input: "src/app/index.html",
    },
  },
  plugins: [
    tsconfigPaths({
      root: path.resolve(__dirname, "../"),
    }),
  ],
  resolve: {
    preserveSymlinks: true, // this is the fix!
  },
};
