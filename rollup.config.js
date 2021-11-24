import path from "path";
import { DEFAULT_EXTENSIONS } from "@babel/core";

import pkg from "./package.json";
import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import external from "rollup-plugin-peer-deps-external";
import del from "rollup-plugin-delete";
import typescript from "rollup-plugin-typescript2";
import commonjs from "@rollup/plugin-commonjs";
import dts from "rollup-plugin-dts";
import copy from "rollup-plugin-copy";
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: pkg.source,
    output: [
      { file: pkg.main.replace("dist", "temp"), format: "cjs", exports: "named", sourcemap: true },
      { file: pkg.module.replace("dist", "temp"), format: "esm", exports: "named", sourcemap: true },
    ],
    plugins: [
      del({ targets: ["temp/*"] }),
      external({
        includeDependencies: true,
      }),
      resolve({
        browser: true,
        moduleDirectories: ["node_modules", "src"],
      }),
      commonjs({
        include: ["node_modules/**"],
      }),
      typescript({
        useTsconfigDeclarationDir: true,
        rollupCommonJSResolveHack: true,
      }),
      // babel({
      //   babelrc: false,
      //   exclude: ["node_modules/**"],
      //   extensions: [...DEFAULT_EXTENSIONS, ".ts", ".tsx"],
      // }),
      // terser({
      //   compress: true,
      // }),
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
          baseUrl: "./src",
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
