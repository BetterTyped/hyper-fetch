module.exports = {
  babelrcRoots: ["packages/*"],
  plugins: ["babel-plugin-transform-vite-meta-env"],
  presets: [
    "@babel/preset-env",
    "@babel/preset-typescript",
    [
      "@babel/preset-react",
      {
        runtime: "automatic",
      },
    ],
  ],
};
