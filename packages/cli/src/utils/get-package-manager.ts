import path from "path";
import { constants } from "fs";
import { access } from "fs/promises";

export async function getPackageManager(cwd: string): Promise<"npm" | "yarn" | "pnpm"> {
  const yarnLock = path.resolve(cwd, "yarn.lock");
  const pnpmLock = path.resolve(cwd, "pnpm-lock.yaml");

  try {
    await access(yarnLock, constants.F_OK);
    return "yarn";
  } catch (e) {
    // file does not exist
  }

  try {
    await access(pnpmLock, constants.F_OK);
    return "pnpm";
  } catch (e) {
    // file does not exist
  }

  return "npm";
}
