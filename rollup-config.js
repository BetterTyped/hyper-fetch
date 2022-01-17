import resolve from "@rollup/plugin-node-resolve";
import external from "rollup-plugin-peer-deps-external";
import del from "rollup-plugin-delete";
import typescript from "rollup-plugin-ts";
import commonjs from "@rollup/plugin-commonjs";
import dts from "rollup-plugin-dts";
import { terser } from "rollup-plugin-terser";

// const { LERNA_ROOT_PATH } = process.env;

export default (pkg) => [
  {
    input: pkg.source,
    output: [
      { file: pkg.main, format: "cjs", exports: "named", sourcemap: true },
      {
        file: pkg.module,
        format: "esm",
        exports: "named",
        sourcemap: true,
      },
    ],
    plugins: [
      del({ targets: ["dist/*"] }),
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
    ],
  },
];
