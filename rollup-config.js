import resolve from "@rollup/plugin-node-resolve";
import external from "rollup-plugin-peer-deps-external";
import del from "rollup-plugin-delete";
import typescript from "rollup-plugin-ts";
import commonjs from "@rollup/plugin-commonjs";
import dts from "rollup-plugin-dts";
import copy from "rollup-plugin-copy";
import { terser } from "rollup-plugin-terser";

const { LERNA_ROOT_PATH } = process.env;

export default (pkg, tsconfig) => [
  {
    input: pkg.source,
    output: [
      { file: pkg.main.replace("dist", "temp"), format: "cjs", exports: "named", sourcemap: true },
      {
        file: pkg.module.replace("dist", "temp"),
        format: "esm",
        exports: "named",
        sourcemap: true,
      },
    ],
    plugins: [
      del({ targets: ["temp/*"] }),
      external({
        includeDependencies: true,
      }),
      resolve(),
      commonjs({
        include: ["node_modules/**"],
      }),
      typescript({
        transpiler: "babel",
        // debug mode
        // tsconfig: (resolvedConfig) => {
        //   // method executes twice, and second time baseUrl: '.'
        //   // it doesn't matter if i override baseUrl or not

        //   console.log(`>> config`, resolvedConfig);

        //   return resolvedConfig;
        // },
      }),
      terser({
        compress: true,
      }),
    ],
    external: Object.keys(pkg.peerDependencies || {}),
  },
  {
    input: pkg.source,
    output: [{ file: pkg.types, format: "es" }],
    external: [/\.scss$/, /\.css$/],
    plugins: [
      dts({
        compilerOptions: {
          baseUrl: "./lib",
        },
        hook: "options",
      }),
      copy({
        targets: [{ src: "temp/*", dest: "dist" }],
        hook: "buildEnd",
      }),
      del({ targets: ["temp"], hook: "closeBundle" }),
    ],
  },
];
