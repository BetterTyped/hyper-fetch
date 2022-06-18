/* eslint-disable */
const { build } = require("esbuild");
const { nodeExternalsPlugin } = require("esbuild-node-externals");

const pkg = require(`${process.cwd()}/package.json`);
const entryPath = `${process.cwd()}/index.ts`;

const buildPackage = () => {
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
};

buildPackage();
