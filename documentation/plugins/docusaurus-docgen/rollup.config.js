import pkg from "./package.json";
import external from "rollup-plugin-peer-deps-external";
import del from "rollup-plugin-delete";
import dts from "rollup-plugin-dts";
import copy from "rollup-plugin-copy";

import esbuild from "rollup-plugin-esbuild";

export default [
  {
    input: pkg.source,
    output: [
      { file: pkg.main, format: "cjs", exports: "named", sourcemap: true },
      { file: pkg.module, format: "esm", exports: "named", sourcemap: true },
    ],
    plugins: [
      del({ targets: ["dist/*"] }),
      // Todo make dynamic read from code
      copy({
        targets: [
          {
            src: ["node_modules/@docusaurus/plugin-content-docs/lib/*", "!**/*.ts"],
            dest: "dist/lib",
          },
        ],
      }),
      external(),
      esbuild(),
    ],
  },
  {
    input: pkg.source,
    output: [{ file: pkg.types, format: "es" }],
    external: [/\.scss$/, /\.css$/],
    plugins: [
      dts({
        compilerOptions: {
          baseUrl: "./src",
        },
      }),
    ],
  },
];
