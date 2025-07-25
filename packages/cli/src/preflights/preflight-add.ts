import * as path from "node:path";
import * as fs from "fs-extra";
import { z } from "zod";

import { addOptionsSchema } from "commands/add";
import * as ERRORS from "utils/errors";
import { getConfig } from "config/get-config";
import { highlighter } from "utils/highlighter";
import { logger } from "utils/logger";

export async function preFlightAdd(options: z.infer<typeof addOptionsSchema>) {
  const errors: Record<string, boolean> = {};

  // Ensure target directory exists.
  // Check for empty project. We assume if no package.json exists, the project is empty.
  if (!fs.existsSync(options.cwd) || !fs.existsSync(path.resolve(options.cwd, "package.json"))) {
    errors[ERRORS.MISSING_DIR_OR_EMPTY_PROJECT] = true;
    return {
      errors,
      config: null,
    };
  }

  try {
    const config = await getConfig(options.cwd);

    return {
      errors,
      config: config!,
    };
  } catch (error) {
    logger.break();
    logger.error(
      `An invalid ${highlighter.info("api.json")} file was found at ${highlighter.info(
        options.cwd,
      )}.\nBefore you can add SDKs, you must create a valid ${highlighter.info(
        "api.json",
      )} file by running the ${highlighter.info("init")} command.`,
    );
    logger.break();
    process.exit(1);
  }
}
