/* eslint-disable */
const { build } = require("esbuild");
const { rollup } = require("rollup");
const { nodeExternalsPlugin } = require("esbuild-node-externals");
const dts = require("rollup-plugin-dts").default;

const pkg = require(`${process.cwd()}/package.json`);

const buildPackage = async () => {
  const options = {
    target: "es6",
    entryPoints: [pkg.source],
    bundle: true,
    minify: true,
    sourcemap: true,
    treeShaking: true,
    plugins: [nodeExternalsPlugin()],
  };

  build({
    ...options,
    outfile: pkg.main,
    format: "cjs",
  });

  build({
    ...options,
    outfile: pkg.module,
    format: "esm",
  });
};

buildPackage();
