import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  testEnvironment: "jsdom",
  preset: "ts-jest",
  roots: ["<rootDir>/tests", "<rootDir>/src"],
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
  coverageProvider: "v8",
  collectCoverageFrom: ["<rootDir>/src/**/*{ts,tsx}"],
  coveragePathIgnorePatterns: [".spec", "test", "tests", "src/types", "src/constants"],
  moduleDirectories: ["node_modules", "src"],
  globals: {
    "ts-jest": {
      tsconfig: "./tests/tsconfig.tests.json",
    },
  },
  watchPlugins: ["jest-watch-typeahead/filename", "jest-watch-typeahead/testname"],
};
export default config;
