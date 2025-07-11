import path from "path";
import fs from "fs-extra";
import { z } from "zod";

import { generateOptionsSchema } from "commands/generate";
import * as ERRORS from "utils/errors";
import { getConfig } from "config/get-config";
import { Config } from "config/schema";
import { highlighter } from "utils/highlighter";
import { logger } from "utils/logger";
import { handleError } from "utils/handle-error";

export async function preFlightGenerate(options: z.infer<typeof generateOptionsSchema>): Promise<{
  errors: Record<string, boolean>;
  config: Config;
}> {
  const errors: Record<string, boolean> = {};

  // Ensure target directory exists.
  // Check for empty project. We assume if no package.json exists, the project is empty.
  if (!fs.existsSync(options.cwd) || !fs.existsSync(path.resolve(options.cwd, "package.json"))) {
    errors[ERRORS.MISSING_DIR_OR_EMPTY_PROJECT] = true;

    handleError(errors);
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
