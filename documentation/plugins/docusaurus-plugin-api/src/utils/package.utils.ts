import * as path from "path";

export const getPackageJson = (dir: string, name: string): undefined | Record<string, unknown> => {
  try {
    return require(path.join(dir, name));
  } catch (err) {
    return;
  }
};
