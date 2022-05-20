import * as fs from "fs";
import * as path from "path";
import { warning, info } from "./log.utils";
import fsExtra from "fs-extra";

export const readFile = (path: string): string | null => {
  try {
    return fs.readFileSync(path, "utf8");
  } catch (err) {
    return null;
  }
};

export const createFile = (filePath: string, data: string) => {
  const dirname = path.dirname(filePath);
  const exists = fs.existsSync(dirname);

  if (!exists) {
    fs.mkdirSync(dirname, { recursive: true });
  }

  fs.writeFileSync(filePath, data);
};

export function prepareApiDirectory(dirname: string) {
  const exists = fs.existsSync(dirname);
  if (exists) {
    // empty
    warning(`Empty api directory at ${dirname}`);
    fsExtra.emptyDirSync(dirname);
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

/**
 * Find difference between regular function and hook
 */
export const getKindName = (kind: string, name: string) => {
  const isHook = () => {
    const isUppercase = name[3] == name[3]?.toUpperCase();
    return name.startsWith("use") && isUppercase && kind === "Function";
  };
  if (isHook()) {
    return "Hook";
  }
  return kind;
};
