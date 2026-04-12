module.exports = {
  extends: ["../../.eslintrc.js"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json", "./__tests__/tsconfig.json"],
  },
  rules: {},
  ignorePatterns: ["dist/", "coverage/", "vite.config.ts", "/*.js"],
};
