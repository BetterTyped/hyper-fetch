import { getDefaultAliases } from "config/get-ts-alias";
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

  // Every alias has to resolve to the directory created here, whatever the paths and base url of the project
  const defaultAliases = await getDefaultAliases(cwd, mainPath, apiDir);

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
