import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  cacheDirectory: "node_modules/.cache/jest",
  testEnvironment: "jsdom",
  preset: "ts-jest",
  testRegex: [".spec.ts", ".spec.tsx"],
  roots: ["<rootDir>/__tests__", "<rootDir>/lib"],
  coverageProvider: "v8",
  collectCoverageFrom: ["<rootDir>/lib/**/*.ts", "<rootDir>/lib/**/*.tsx"],
  coveragePathIgnorePatterns: [".spec", "test", "tests", "types", "constants", "index.ts"],
  moduleDirectories: ["node_modules", "lib"],
  globals: {
    "ts-jest": {
      tsconfig: "./tsconfig.json",
    },
  },
  watchPlugins: ["jest-watch-typeahead/filename", "jest-watch-typeahead/testname"],
  setupFilesAfterEnv: ["jest-extended/all", "<rootDir>/__tests__/jest.setup.ts"],
};
export default config;
