/* eslint-disable */
const { build } = require("esbuild");
const { nodeExternalsPlugin } = require("esbuild-node-externals");

const pkg = require(`${process.cwd()}/package.json`);

const isCore = pkg.name === "@hyper-fetch/core";

/**
 * Building
 */

const buildPackage = async (additionalOptions = {}) => {
  const {
    platform = "browser",
    outputMain = pkg.main,
    outputModule = pkg.module,
    tsconfig = "tsconfig.json",
    preDir = "",
  } = additionalOptions;

  const options = {
    platform,
    target: "es6",
    entryPoints: [pkg.source],
    bundle: true,
    minify: true,
    sourcemap: true,
    treeShaking: true,
    tsconfig,
    plugins: [nodeExternalsPlugin()],
  };

  build({
    ...options,
    outfile: preDir ? outputMain.replace("dist", preDir) : outputMain,
    format: "cjs",
  });
  build({
    ...options,
    outfile: preDir ? outputModule.replace("dist", preDir) : outputModule,
    format: "esm",
  });
};

if (isCore) {
  buildPackage({ platform: "browser", preDir: "dist/browser", tsconfig: "tsconfig.json" });
  buildPackage({ platform: "node", preDir: "dist/server", tsconfig: "tsconfig.node.json" });
  buildPackage({ platform: "node", tsconfig: "tsconfig.node.json" });
} else {
  buildPackage();
}
