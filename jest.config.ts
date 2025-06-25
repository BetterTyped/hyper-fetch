import { getJestProjects } from "@nx/jest";
import type { Config } from "@jest/types";
import path from "path";

export default {
  projects: getJestProjects(),
};

export const getJestConfig = (): Config.InitialOptions => ({
  cache: false,
  verbose: true,
  testEnvironment: "jsdom",
  testTimeout: 1000000,
  testRegex: [".spec.ts", ".spec.tsx"],
  roots: ["<rootDir>/__tests__", "<rootDir>/src"],
  coverageProvider: "babel",
  coverageReporters: [["lcov", { projectRoot: "../.." }], "clover", "json", "text"],
  collectCoverageFrom: ["<rootDir>/src/**/*.ts", "<rootDir>/src/**/*.tsx"],
  coveragePathIgnorePatterns: [".spec", "test", "tests", "types", "constants", "index.ts"],
  moduleDirectories: ["node_modules", "src"],
  watchPlugins: ["jest-watch-typeahead/filename", "jest-watch-typeahead/testname"],
  setupFilesAfterEnv: [
    "jest-extended",
    "jest-extended/all",
    "<rootDir>/__tests__/jest.setup.ts",
    `${__dirname}/jest.polyfills.js`,
  ],
  moduleNameMapper: {
    "@browser-adapter": [
      "<rootDir>/src/http-adapter/http-adapter.browser.ts",
      "<rootDir>/src/adapter/http-adapter.browser.ts",
    ],
    "@server-adapter": [
      "<rootDir>/src/http-adapter/http-adapter.server.ts",
      "<rootDir>/src/adapter/http-adapter.server.ts",
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(chalk|react|react-json-tree|color|color-convert|color-string|react-base16-styling|lodash-es)/)",
  ],
  // Fixes msw https://github.com/mswjs/msw/issues/1786
  testEnvironmentOptions: {
    customExportConditions: [""],
  },
  transform: {
    "^.+\\.[jt]sx?$": ["babel-jest", { configFile: path.resolve(__dirname, ".babelrc.js") }],
  },
});
