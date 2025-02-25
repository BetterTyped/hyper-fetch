import fs from "fs";
import path from "path";

const appDirectory = fs.realpathSync(process.cwd());

export const pathResolve = (relativePath: string): string => {
  return path.resolve(appDirectory, relativePath);
};

export const appSrcPath = pathResolve("./src");
