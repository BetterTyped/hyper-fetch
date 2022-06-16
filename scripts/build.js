/* eslint-disable */
const { build } = require("esbuild");
const { nodeExternalsPlugin } = require("esbuild-node-externals");

const pkg = require(`${process.cwd()}/package.json`);

/**
 * BUILD
 */

const options = {
  target: "es6",
  entryPoints: [pkg.source],
  bundle: true,
  // minify: true,
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
