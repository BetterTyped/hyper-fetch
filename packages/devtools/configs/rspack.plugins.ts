import { rspack } from "@rspack/core";
// import ESLintPlugin from "eslint-webpack-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
// import StylelintPlugin from "stylelint-webpack-plugin";
// import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";

import { isDevelopment } from "./rspack.env";
import {
  // appSrcPath,
  pathResolve,
} from "./utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const plugins: any[] = [
  new rspack.DefinePlugin({
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  }),
];

if (isDevelopment) {
  plugins.push(new rspack.HotModuleReplacementPlugin());

  plugins.push(
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
  );
  // plugins.push(
  //   new ESLintPlugin({
  //     context: appSrcPath,
  //     eslintPath: require.resolve("eslint"),
  //     extensions: ["ts", "tsx", "js", "jsx"],
  //     fix: true,
  //     emitError: true,
  //     emitWarning: true,
  //     lintDirtyModulesOnly: true,
  //     // formatter: 'stylish',
  //     // rspack 上使用 threads 有问题，会导致编译堵塞
  //     // threads: true,
  //   }),
  // );
  // plugins.push(
  //   new StylelintPlugin({
  //     context: appSrcPath,
  //     stylelintPath: require.resolve("stylelint"),
  //     extensions: ["less", "css", "scss", "sass"],
  //     fix: true,
  //     emitError: true,
  //     emitWarning: true,
  //     lintDirtyModulesOnly: true,
  //     threads: true,
  //   }),
  // );
}

export { plugins };
