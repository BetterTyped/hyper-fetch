import path from "path";
import { DEFAULT_EXTENSIONS } from "@babel/core";

import pkg from "./package.json";
import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import external from "rollup-plugin-peer-deps-external";
import del from "rollup-plugin-delete";
import typescript from "rollup-plugin-typescript2";
import commonjs from "@rollup/plugin-commonjs";
import svgr from "@svgr/rollup";
import url from "rollup-plugin-url";
import postcss from "rollup-plugin-postcss";
import dts from "rollup-plugin-dts";
import copy from "rollup-plugin-copy";
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: pkg.source,
    output: [
      { file: pkg.main, format: "cjs", exports: "named", sourcemap: true },
      { file: pkg.module, format: "esm", exports: "named", sourcemap: true },
    ],
    plugins: [
      del({ targets: ["dist/*"] }),
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
        declaration: true,
        rollupCommonJSResolveHack: true,
      }),
      babel({
        exclude: ["node_modules/**"],
        extensions: [...DEFAULT_EXTENSIONS, ".ts", ".tsx"],
      }),
      postcss({
        minimize: true,
        extract: "assets/styles/index.css",
        modules: {
          globalModulePaths: [/^((?!module.css)[\s\S])*$/],
        },
      }),
      url({
        fileName: "[dirname][hash][extname]",
        sourceDir: path.join(__dirname, "src"),
      }),
      svgr({
        svgoConfig: {
          plugins: {
            removeViewBox: false,
          },
        },
      }),
      copy({
        targets: [{ src: "src/assets/styles/light-theme.css", dest: "dist/assets/styles" }],
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
          baseUrl: "./src",
        },
      }),
    ],
  },
];
