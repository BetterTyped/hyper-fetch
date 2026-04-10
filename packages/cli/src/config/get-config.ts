import * as path from "node:path";
import * as fs from "fs-extra";
import { loadConfig } from "tsconfig-paths";

import { highlighter } from "utils/highlighter";
import { resolveImport } from "utils/resolve-import";
import { handleError } from "../utils/handle-error";
import { configSchema, Config } from "config/schema";
import { autoInit } from "config/auto-init";

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
  if (!fs.existsSync(path.resolve(cwd, "api.json"))) {
    await autoInit(cwd);
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
