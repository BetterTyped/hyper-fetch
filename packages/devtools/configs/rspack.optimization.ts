import type { Configuration } from "@rspack/core";
import { rspack } from "@rspack/core";

import { isProduction } from "./rspack.env";

const optimization: Configuration["optimization"] = {
  splitChunks: {
    cacheGroups: {
      vendors: {
        name: "chunk-vendors",
        test: /[\\/]node_modules[\\/]/,
        priority: -10,
        chunks: "initial",
      },
      common: {
        name: "chunk-common",
        minChunks: 2,
        priority: -20,
        chunks: "initial",
        reuseExistingChunk: true,
      },
    },
  },
  chunkIds: isProduction ? "deterministic" : "named",
  // add runtimeChunk config, resulting in production env can't load preload.js
  runtimeChunk: {
    name: "runtime",
  },
};

if (isProduction) {
  optimization.minimize = true;
  optimization.minimizer = [new rspack.SwcJsMinimizerRspackPlugin(), new rspack.LightningCssMinimizerRspackPlugin()];
}

export { optimization };
