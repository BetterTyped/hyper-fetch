import path from "path";
import { addOptionsSchema } from "commands/add";
import * as ERRORS from "utils/errors";
import { getConfig } from "utils/get-config";
import { highlighter } from "utils/highlighter";
import { logger } from "utils/logger";
import fs from "fs-extra";
import { z } from "zod";
import { configSchema } from "config/schema";
import { handleError } from "utils/handle-error";

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

  // Check for existing api.json file.
  if (fs.existsSync(path.resolve(options.cwd, "api.json"))) {
    const { error } = await configSchema.safeParseAsync(
      JSON.parse(fs.readFileSync(path.resolve(options.cwd, "api.json"), "utf8")),
    );

    if (error) {
      handleError(error);
    }
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
    logger.error(`Learn more at ${highlighter.info("https://ui.shadcn.com/docs/components-json")}.`);
    logger.break();
    process.exit(1);
  }
}
