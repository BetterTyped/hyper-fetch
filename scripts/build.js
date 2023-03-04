/* eslint-disable */
const { build } = require("esbuild");
const { nodeExternalsPlugin } = require("esbuild-node-externals");

const pkg = require(`${process.cwd()}/package.json`);

const isCore = pkg.name === "@hyper-fetch/core";

/**
 * Building
 */

const buildPackage = async (additionalOptions = {}) => {
  const { platform = "browser", outputMain = pkg.main, tsconfig = "tsconfig.json" } = additionalOptions;

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
    outfile: outputMain,
    format: "esm",
  });
};

if (isCore) {
  buildPackage({ platform: "browser", outputMain: "dist/browser/index.ejs.js", tsconfig: "tsconfig.json" });
  buildPackage({ platform: "node", outputMain: "dist/server/index.ejs.js", tsconfig: "tsconfig.node.json" });
} else {
  buildPackage();
}
