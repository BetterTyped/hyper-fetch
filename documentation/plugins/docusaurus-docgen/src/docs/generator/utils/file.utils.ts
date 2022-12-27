import * as fs from "fs";
import * as path from "path";
import fsExtra from "fs-extra";

import { info, warning } from "../../../utils/log.utils";
import { name as libraryName } from "../../../constants/name.constants";

export const readFile = (filePath: string): string | null => {
  try {
    return fs.readFileSync(filePath, "utf8");
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

export function emptyDocsDir(dirname: string) {
  warning(`Empty api directory at ${dirname}`);
  fsExtra.emptyDirSync(dirname);
}

export function prepareApiDirectory(dirname: string) {
  const exists = fs.existsSync(dirname);
  if (exists) {
    // empty
    return true;
  }
  // create
  info(`Creating api directory at ${dirname}`);
  fs.mkdirSync(dirname, { recursive: true });
  return false;
}

export const cleanFileName = (name: string) => {
  const newName = name.replace(/\s+/gi, "-"); // Replace white space with dash
  return newName.replace(/[^a-zA-Z0-9-]/gi, ""); // Strip any special charactere
};

/**
 * Find difference between regular function and hook
 */
export const getKindName = (kind: string, name: string) => {
  const isHook = () => {
    const isUppercase = name[3] === name[3]?.toUpperCase();
    return name.startsWith("use") && isUppercase && kind === "Function";
  };
  if (isHook()) {
    return "Hook";
  }
  return kind;
};
function copyFolderSync(from: string, to: string) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to);
  }
  try {
    fs.readdirSync(from).forEach((element) => {
      if (fs.lstatSync(path.join(from, element)).isFile()) {
        fs.copyFileSync(path.join(from, element), path.join(to, element));
      } else {
        copyFolderSync(path.join(from, element), path.join(to, element));
      }
    });
  } catch (err) {
    return null;
  }
}

export const getLibFiles = (): { DEFAULT_OPTIONS: any } => {
  copyFolderSync(
    "node_modules/@docusaurus/plugin-content-docs/lib/",
    `node_modules/.bin/${libraryName}/`,
  );
  // eslint-disable-next-line @typescript-eslint/no-var-requires, import/extensions, import/no-dynamic-require, global-require
  return require(`.bin/${libraryName}/options`);
};
