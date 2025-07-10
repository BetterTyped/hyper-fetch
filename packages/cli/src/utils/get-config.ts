import path from "path";
import { highlighter } from "utils/highlighter";
import { resolveImport } from "utils/resolve-import";
import { cosmiconfig } from "cosmiconfig";
import fg from "fast-glob";
import { loadConfig } from "tsconfig-paths";
import { z } from "zod";

export const DEFAULT_STYLE = "default";
export const DEFAULT_COMPONENTS = "@/components";
export const DEFAULT_UTILS = "@/lib/utils";
export const DEFAULT_TAILWIND_CSS = "app/globals.css";
export const DEFAULT_TAILWIND_CONFIG = "tailwind.config.js";
export const DEFAULT_TAILWIND_BASE_COLOR = "slate";

// TODO: Figure out if we want to support all cosmiconfig formats.
// A simple components.json file would be nice.
const explorer = cosmiconfig("components", {
  searchPlaces: ["components.json"],
});

export const rawConfigSchema = z
  .object({
    $schema: z.string().optional(),
    libVersion: z.string(),
    aliases: z.object({
      api: z.string(),
    }),
    tsx: z.coerce.boolean().default(true),
  })
  .strict();

export type RawConfig = z.infer<typeof rawConfigSchema>;

export const configSchema = rawConfigSchema.extend({
  resolvedPaths: z.object({
    cwd: z.string(),
    api: z.string(),
  }),
});

export type Config = z.infer<typeof configSchema>;

// TODO: type the key.
// Okay for now since I don't want a breaking change.
// Fix: z.record requires two arguments: key schema and value schema.
export const workspaceConfigSchema = z.record(z.string(), configSchema);

export async function getConfig(cwd: string): Promise<Config | null> {
  const config = await getRawConfig(cwd);

  if (!config) {
    return null;
  }

  return await resolveConfigPaths(cwd, config);
}

export async function resolveConfigPaths(cwd: string, config: RawConfig) {
  // Read tsconfig.json.
  const tsConfig = await loadConfig(cwd);

  if (tsConfig.resultType === "failed") {
    throw new Error(`Failed to load ${config.tsx ? "tsconfig" : "jsconfig"}.json. ${tsConfig.message ?? ""}`.trim());
  }

  return configSchema.parse({
    ...config,
    resolvedPaths: {
      cwd,
      api: await resolveImport(config.aliases["api"], tsConfig),
    },
  });
}

export async function getRawConfig(cwd: string): Promise<RawConfig | null> {
  try {
    const configResult = await explorer.search(cwd);

    if (!configResult) {
      return null;
    }

    return rawConfigSchema.parse(configResult.config);
  } catch (error) {
    const componentPath = `${cwd}/components.json`;
    throw new Error(`Invalid configuration found in ${highlighter.info(componentPath)}.`);
  }
}

// Note: we can check for -workspace.yaml or "workspace" in package.json.
// Since cwd is not necessarily the root of the project.
// We'll instead check if ui aliases resolve to a different root.
export async function getWorkspaceConfig(config: Config) {
  let resolvedAliases: any = {};

  for (const key of Object.keys(config.aliases)) {
    if (!isAliasKey(key, config)) {
      continue;
    }

    const resolvedPath = config.resolvedPaths[key];
    const packageRoot = await findPackageRoot(config.resolvedPaths.cwd, resolvedPath);

    if (!packageRoot) {
      resolvedAliases[key] = config;
      continue;
    }

    resolvedAliases[key] = await getConfig(packageRoot);
  }

  const result = workspaceConfigSchema.safeParse(resolvedAliases);
  if (!result.success) {
    return null;
  }

  return result.data;
}

export async function findPackageRoot(cwd: string, resolvedPath: string) {
  const commonRoot = findCommonRoot(cwd, resolvedPath);
  const relativePath = path.relative(commonRoot, resolvedPath);

  const packageRoots = await fg.glob("**/package.json", {
    cwd: commonRoot,
    deep: 3,
    ignore: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/public/**"],
  });

  const matchingPackageRoot = packageRoots
    .map((pkgPath) => path.dirname(pkgPath))
    .find((pkgDir) => relativePath.startsWith(pkgDir));

  return matchingPackageRoot ? path.join(commonRoot, matchingPackageRoot) : null;
}

function isAliasKey(key: string, config: Config): key is keyof Config["aliases"] {
  return Object.keys(config.resolvedPaths)
    .filter((key) => key !== "utils")
    .includes(key);
}

export function findCommonRoot(cwd: string, resolvedPath: string) {
  const parts1 = cwd.split(path.sep);
  const parts2 = resolvedPath.split(path.sep);
  const commonParts = [];

  for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
    if (parts1[i] !== parts2[i]) {
      break;
    }
    commonParts.push(parts1[i]);
  }

  return commonParts.join(path.sep);
}
