import { getJestProjects } from "@nx/jest";
import type { Config } from "@jest/types";

export default {
  projects: getJestProjects(),
};

export const getJestConfig = (): Config.InitialOptions => ({
  cache: false,
  verbose: true,
  testEnvironment: "jsdom",
  testTimeout: 1000000,
  preset: "ts-jest",
  testRegex: [".spec.ts"],
  roots: ["<rootDir>/__tests__", "<rootDir>/src"],
  coverageProvider: "v8",
  coverageReporters: [["lcov", { projectRoot: "../.." }], "clover", "json", "text"],
  collectCoverageFrom: ["<rootDir>/src/**/*.ts", "<rootDir>/src/**/*.tsx"],
  coveragePathIgnorePatterns: [".spec", "test", "tests", "types", "constants", "index.ts"],
  moduleDirectories: ["node_modules", "src"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "./tsconfig.json",
        isolatedModules: true,
        useESM: true,
      },
    ],
  },
  watchPlugins: ["jest-watch-typeahead/filename", "jest-watch-typeahead/testname"],
  setupFilesAfterEnv: ["jest-extended/all", "<rootDir>/__tests__/jest.setup.ts", `${__dirname}/jest.polyfills.js`],
  moduleNameMapper: {
    "@browser-adapter": ["<rootDir>/src/adapter/adapter.browser.ts"],
    "@server-adapter": ["<rootDir>/src/adapter/adapter.server.ts"],
  },
  testEnvironmentOptions: {
    customExportConditions: [""],
  },
});
