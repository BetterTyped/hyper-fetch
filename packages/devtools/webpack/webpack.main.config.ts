import path from "path";
import { WebpackConfiguration } from "@electron-forge/plugin-webpack/dist/Config";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";

import { rules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";

export const mainConfig: WebpackConfiguration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: "./src/app/index.ts",
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
    plugins: [new TsconfigPathsPlugin({ configFile: path.join(__dirname, "../tsconfig.json") })],
  },
};
