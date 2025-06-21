import type { Config } from "@jest/types";

import { getJestConfig } from "../../jest.config";

const config: Config.InitialOptions = getJestConfig();

config.moduleNameMapper = {
  "^@\/(.*)$": "<rootDir>/src/frontend/$1",
  "^@shared\/(.*)$": "<rootDir>/src/shared/$1",
  "^@server\/(.*)$": "<rootDir>/src/server/$1",
  "^@app\/(.*)$": "<rootDir>/src/app/$1",
};

export default config;
