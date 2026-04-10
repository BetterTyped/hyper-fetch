const dts = require("rollup-plugin-dts").default;

const config = [
  {
    input: "./src/index.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    external: [/^node:/, "http", "https"],
    plugins: [
      dts({
        compilerOptions: {
          baseUrl: "./src",
        },
      }),
    ],
  },
];

module.exports.default = config;
