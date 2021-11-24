import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  testEnvironment: "jsdom",
  preset: "ts-jest",
  roots: ["<rootDir>/tests", "<rootDir>/src"],
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
  coverageDirectory: "coverage",
  testPathIgnorePatterns: ["node_modules", "documentation", "example", "dist", "coverage"],
  moduleDirectories: ["node_modules", "src"],
  globals: {
    "ts-jest": {
      tsconfig: "./tests/tsconfig.tests.json",
    },
  },
};
export default config;
