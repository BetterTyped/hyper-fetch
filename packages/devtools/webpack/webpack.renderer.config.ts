import path from "path";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import { WebpackConfiguration } from "@electron-forge/plugin-webpack/dist/Config";

import { rules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";

rules.push({
  test: /\.css$/,
  use: [{ loader: "style-loader" }, { loader: "css-loader" }, { loader: "postcss-loader" }],
});

export const rendererConfig: WebpackConfiguration = {
  module: {
    rules,
  },
  plugins,
  resolve: {
    plugins: [new TsconfigPathsPlugin({ configFile: path.join(__dirname, "../tsconfig.json") })],
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
    fallback: {
      fs: false,
      path: false,
      url: false,
      assert: false,
      stream: false,
      util: false,
      child_process: false,
      worker_threads: false,
      module: false,
    },
  },
  target: "electron-renderer",
};
