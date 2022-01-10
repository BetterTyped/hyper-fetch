import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  cacheDirectory: "node_modules/.cache/jest",
  testEnvironment: "jsdom",
  preset: "ts-jest",
  testRegex: [".spec.ts", ".spec.tsx"],
  roots: ["<rootDir>/__tests__", "<rootDir>/lib"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/jest.setup.ts"],
  coverageProvider: "v8",
  collectCoverageFrom: ["<rootDir>/lib/**/*{ts,tsx}"],
  coveragePathIgnorePatterns: [".spec", "test", "tests", "lib/types", "lib/constants"],
  moduleDirectories: ["node_modules", "lib"],
  globals: {
    "ts-jest": {
      tsconfig: "./__tests__/tsconfig.tests.json",
    },
  },
  watchPlugins: ["jest-watch-typeahead/filename", "jest-watch-typeahead/testname"],
};
export default config;
