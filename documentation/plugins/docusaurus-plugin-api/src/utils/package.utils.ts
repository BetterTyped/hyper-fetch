import { getPath } from "./file.utils";

export const getPackageJson = (packageRoot: string) => {
  try {
    return require(getPath(packageRoot, "/package.json"));
  } catch (err) {
    return;
  }
};
