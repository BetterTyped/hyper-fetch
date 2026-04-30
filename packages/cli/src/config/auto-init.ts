import { getTsConfigAliasPrefix } from "config/get-ts-alias";
import type { Config } from "config/schema";
import { configSchema } from "config/schema";
import * as fs from "fs-extra";
import * as path from "node:path";
import { logger } from "utils/logger";
import { spinner } from "utils/spinner";

/**
 * Automatically initialize the project with default configuration.
 * Called when `api.json` is not found during any CLI command.
 */
export async function autoInit(cwd: string): Promise<void> {
  logger.break();
  logger.info("No api.json found — auto-initializing project...");
  logger.break();

  const mainPath = "src";
  const apiDir = "api";
  const fullPath = path.join(cwd, mainPath, apiDir);
  const configPath = path.join(cwd, "api.json");

  const aliasPrefix = (await getTsConfigAliasPrefix(cwd)) || "";
  const alias = aliasPrefix ? `${aliasPrefix}/` : "";

  const defaultAliases: Config["aliases"] = {
    api: `${alias}${apiDir}`,
    hooks: `${alias}hooks`,
    ui: `${alias}components/ui`,
    components: `${alias}components`,
    lib: `${alias}lib`,
  };

  const defaultConfig: Omit<Config, "resolvedPaths"> = {
    tsx: true,
    aliases: defaultAliases,
  };

  const s1 = spinner(`Initialize API directory at ${path.join(mainPath, apiDir)}`).start();
  if (!fs.existsSync(fullPath)) {
    await fs.mkdir(fullPath, { recursive: true });
  }
  s1.succeed();

  const s2 = spinner("Create api.json configuration file").start();
  configSchema.omit({ resolvedPaths: true }).parse(defaultConfig);
  await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
  s2.succeed();

  logger.break();
  logger.info("Auto-initialization complete!");
  logger.break();
}
