import type { Configuration } from "@rspack/core";

// import { isProduction } from "./rspack.env";
import { plugins } from "./rspack.plugins";
import { rules } from "./rspack.rules";
import { pathResolve } from "./utils";

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: "./src/app/main.ts",
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins,
  resolve: {
    tsConfig: pathResolve("tsconfig.json"),
  },
  output: {
    globalObject: "this",
  },
  // devtool: isProduction ? false : "eval-cheap-module-source-map",
};
