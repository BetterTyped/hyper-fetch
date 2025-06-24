import type { Config } from "@jest/types";

import { getJestConfig } from "../../jest.config";

const config: Config.InitialOptions = getJestConfig();

config.moduleNameMapper = {
  ...config.moduleNameMapper,
  "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
    "<rootDir>/__tests__/filte-mock.js",
  "^@\/(.*)$": "<rootDir>/src/frontend/$1",
  "^@shared\/(.*)$": "<rootDir>/src/shared/$1",
  "^@server\/(.*)$": "<rootDir>/src/server/$1",
  "^@app\/(.*)$": "<rootDir>/src/app/$1",
};

export default config;
