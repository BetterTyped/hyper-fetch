import type IForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

import { pathResolve } from "../configs/utils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

export const plugins: any[] = [
  new ForkTsCheckerWebpackPlugin({
    async: true,
    formatter: "codeframe",
    // logger: 'webpack-infrastructure',
    typescript: {
      configFile: pathResolve("tsconfig.json"),
      mode: "write-references",
      typescriptPath: require.resolve("typescript"),
      configOverwrite: {},
      diagnosticOptions: {
        semantic: true,
        syntactic: true,
      },
    },
    devServer: false,
  }),
];
