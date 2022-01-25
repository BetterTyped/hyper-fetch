import * as fs from "fs";
import { warning, info } from "./log.utils";
// import fsExtra from "fs-extra";

export function prepareApiDirectory(dirname: string) {
  const exists = fs.existsSync(dirname);
  if (exists) {
    // empty
    warning(`Empty api directory at ${dirname}`);
    // fsExtra.emptyDirSync(dirname);
  } else {
    // create
    info(`Creating api directory at ${dirname}`);
    fs.mkdirSync(dirname, { recursive: true });
  }
}

export const cleanFileName = (name: string) => {
  name = name.replace(/\s+/gi, "-"); // Replace white space with dash
  return name.replace(/[^a-zA-Z0-9\-]/gi, ""); // Strip any special charactere
};
