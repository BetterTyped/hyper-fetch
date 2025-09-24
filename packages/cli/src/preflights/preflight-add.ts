import * as path from "node:path";
import * as fs from "fs-extra";
import { z } from "zod";

import { addOptionsSchema } from "commands/add";
import { getConfig } from "config/get-config";
import { highlighter } from "utils/highlighter";
import { logger } from "utils/logger";
import { Config } from "config/schema";
import { ConfigParseError } from "features/add-components/utils/errors";

export async function preFlightAdd(options: z.infer<typeof addOptionsSchema>): Promise<{ config: Config }> {
  // Ensure target directory exists.
  // Check for empty project. We assume if no package.json exists, the project is empty.
  if (!fs.existsSync(options.cwd) || !fs.existsSync(path.resolve(options.cwd, "package.json"))) {
    throw new ConfigParseError(options.cwd, "Missing directory or empty project");
  }

  try {
    const config = await getConfig(options.cwd);

    return {
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
