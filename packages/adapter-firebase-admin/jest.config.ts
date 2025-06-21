import type { Config } from "@jest/types";

import { getJestConfig } from "../../jest.config";

const config: Config.InitialOptions = {
  ...getJestConfig(),
  transformIgnorePatterns: [],
};
export default config;
