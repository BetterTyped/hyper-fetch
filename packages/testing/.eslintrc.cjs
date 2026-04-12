module.exports = {
  extends: ["plugin:@nx/react", "../../.eslintrc.js"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"],
  },
  rules: {
    "react/jsx-props-no-spreading": 0,
    "react/require-default-props": 0,
  },
  ignorePatterns: ["dist/", "coverage/", "vite.config.ts", "/*.js"],
};
