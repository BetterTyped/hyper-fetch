import type { Config } from "config/schema";
import * as path from "node:path";

const DEFAULT_FILE_NAME = "openapi.client";
const EXTENSIONS = [".ts", ".js", ".tsx", ".jsx"];

/**
 * Resolves where the generated SDK is written: the `api` folder from `api.json`, with `.ts` (or `.js` when `tsx` is off)
 * appended when the file name has no extension.
 */
export const getSdkFilePath = ({ config, fileName }: { config: Config; fileName?: string }) => {
  const name = fileName || DEFAULT_FILE_NAME;
  const hasExtension = EXTENSIONS.some((ext) => name.endsWith(ext));
  const extension = config.tsx ? ".ts" : ".js";

  return path.join(config.resolvedPaths.api, hasExtension ? name : `${name}${extension}`);
};
