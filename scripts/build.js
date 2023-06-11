/* eslint-disable */
const { build } = require("esbuild");
const { nodeExternalsPlugin } = require("esbuild-node-externals");

const pkg = require(`${process.cwd()}/package.json`);

const isIsomorphicBuild = ["@hyper-fetch/core", "@hyper-fetch/graphql", "@hyper-fetch/firebase"].includes(pkg.name);

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
    minify: false,
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

if (isIsomorphicBuild) {
  buildPackage({ platform: "browser", preDir: "dist/browser", tsconfig: "tsconfig.base.json" });
  buildPackage({ platform: "node", tsconfig: "tsconfig.json" });
} else {
  buildPackage();
}
