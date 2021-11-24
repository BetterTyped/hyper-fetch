import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  testEnvironment: "jsdom",
  preset: "ts-jest",
  roots: ["<rootDir>/tests", "<rootDir>/src"],
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  coverageReporters: ["text"],
  collectCoverageFrom: ["<rootDir>/src"],
  testPathIgnorePatterns: ["node_modules"],
  moduleDirectories: ["node_modules", "src"],
};
export default config;
