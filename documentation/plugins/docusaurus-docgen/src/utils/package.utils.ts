/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import * as path from "path";

export const getPackageJson = (dir: string, name: string): undefined | Record<string, unknown> => {
  try {
    return require(path.join(dir, name));
  } catch (err) {
    throw new Error("Cannot find package.json");
  }
};
