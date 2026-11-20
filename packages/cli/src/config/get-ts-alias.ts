import type { Config } from "config/schema";
import * as path from "node:path";
import { loadConfig } from "tsconfig-paths";

const toImportPath = (relativePath: string) => relativePath.split(path.sep).join("/");

/**
 * Import path which resolves to the given directory. A path alias of the project is used when one of its targets
 * contains the directory (`@/api` for `"@/*": ["./src/*"]`). Otherwise the path is relative to the base url - the
 * project's own TypeScript resolves such imports, and so does the config loader.
 */
export async function getImportAlias(cwd: string, directory: string): Promise<string> {
  const tsConfig = await loadConfig(cwd);

  if (tsConfig.resultType === "failed") {
    return toImportPath(path.relative(cwd, directory));
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const [alias, targets] of Object.entries(tsConfig.paths ?? {})) {
    if (alias.endsWith("/*")) {
      // eslint-disable-next-line no-restricted-syntax
      for (const target of targets) {
        if (target.endsWith("/*")) {
          const targetDirectory = path.resolve(tsConfig.absoluteBaseUrl, target.slice(0, -2));
          const relativePath = path.relative(targetDirectory, directory);
          if (!relativePath.startsWith("..") && !path.isAbsolute(relativePath)) {
            return [alias.slice(0, -2), toImportPath(relativePath)].filter(Boolean).join("/");
          }
        }
      }
    }
  }

  return toImportPath(path.relative(tsConfig.absoluteBaseUrl, directory));
}

/**
 * Aliases of the directories the CLI writes to, all placed in the main directory of the project
 */
export async function getDefaultAliases(cwd: string, mainPath: string, apiDir: string): Promise<Config["aliases"]> {
  const getAlias = (directory: string) => getImportAlias(cwd, path.join(cwd, mainPath, directory));

  return {
    api: await getAlias(apiDir),
    hooks: await getAlias("hooks"),
    ui: await getAlias(path.join("components", "ui")),
    components: await getAlias("components"),
    lib: await getAlias("lib"),
  };
}
