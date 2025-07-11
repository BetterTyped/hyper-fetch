import path from "path";
import fs from "fs-extra";
import { loadConfig } from "tsconfig-paths";

import { highlighter } from "utils/highlighter";
import { resolveImport } from "utils/resolve-import";
import { logger } from "../utils/logger";
import { handleError } from "../utils/handle-error";
import { configSchema, Config } from "config/schema";

export async function resolveConfigPaths(cwd: string, config: Omit<Config, "resolvedPaths">): Promise<Config> {
  // Read tsconfig.json.
  const tsConfig = await loadConfig(cwd);

  if (tsConfig.resultType === "failed") {
    throw new Error(`Failed to load ${config.tsx ? "tsconfig" : "jsconfig"}.json. ${tsConfig.message ?? ""}`.trim());
  }

  return configSchema.parse({
    ...config,
    resolvedPaths: {
      cwd,
      api: await resolveImport(config.aliases.api, tsConfig),
      components: await resolveImport(config.aliases.components, tsConfig),
      lib: await resolveImport(config.aliases.lib, tsConfig),
      hooks: await resolveImport(config.aliases.hooks, tsConfig),
      ui: await resolveImport(config.aliases.ui, tsConfig),
    },
  });
}

export async function getConfig(cwd: string): Promise<Config | null> {
  // Check for existing api.json file.
  if (!fs.existsSync(path.resolve(cwd, "api.json"))) {
    logger.break();
    logger.error(
      `An invalid ${highlighter.info("api.json")} file was found at ${highlighter.info(
        cwd,
      )}.\nBefore you can add or generate SDKs, you must create a valid ${highlighter.info(
        "api.json",
      )} file by running the ${highlighter.info("init")} command.`,
    );
    logger.break();
    process.exit(1);
  }
  const { data, error } = await configSchema
    .omit({ resolvedPaths: true }) // We enrich it later
    .safeParseAsync(JSON.parse(fs.readFileSync(path.resolve(cwd, "api.json"), "utf8")));

  if (error) {
    handleError(error);
  }

  if (!data) {
    throw new Error(`Invalid configuration found in ${highlighter.info(cwd)}.`);
  }

  return resolveConfigPaths(cwd, data);
}
