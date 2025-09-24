import path from "path";
import { rawConfigSchema } from "config/schema";
import { FRAMEWORKS, Framework } from "./frameworks";
import { Config, getConfig, resolveConfigPaths } from "utils/get-config";
import { getPackageInfo } from "utils/get-package-info";
import fg from "fast-glob";
import fs from "fs-extra";
import { loadConfig } from "tsconfig-paths";
import { z } from "zod";

export type ProjectInfo = {
  framework: Framework;
  isSrcDir: boolean;
  isRSC: boolean;
  isTsx: boolean;
  aliasPrefix: string | null;
};

const PROJECT_SHARED_IGNORE = ["**/node_modules/**", ".next", "public", "dist", "build"];

const TS_CONFIG_SCHEMA = z.object({
  compilerOptions: z.object({
    paths: z.record(z.string(), z.string().or(z.array(z.string()))),
  }),
});

export async function getProjectInfo(cwd: string): Promise<ProjectInfo | null> {
  const [configFiles, isSrcDir, isTsx, aliasPrefix, packageJson] = await Promise.all([
    fg.glob("**/{next,vite,astro,app}.config.*|gatsby-config.*|composer.json|react-router.config.*", {
      cwd,
      deep: 3,
      ignore: PROJECT_SHARED_IGNORE,
    }),
    fs.pathExists(path.resolve(cwd, "src")),
    isTypeScriptProject(cwd),
    getTsConfigAliasPrefix(cwd),
    getPackageInfo(cwd, false),
  ]);

  const isUsingAppDir = await fs.pathExists(path.resolve(cwd, `${isSrcDir ? "src/" : ""}app`));

  const type: ProjectInfo = {
    framework: FRAMEWORKS["manual"],
    isSrcDir,
    isRSC: false,
    isTsx,
    aliasPrefix,
  };

  // Next.js.
  if (configFiles.find((file) => file.startsWith("next.config."))?.length) {
    type.framework = isUsingAppDir ? FRAMEWORKS["next-app"] : FRAMEWORKS["next-pages"];
    type.isRSC = isUsingAppDir;
    return type;
  }

  // Astro.
  if (configFiles.find((file) => file.startsWith("astro.config."))?.length) {
    type.framework = FRAMEWORKS["astro"];
    return type;
  }

  // Gatsby.
  if (configFiles.find((file) => file.startsWith("gatsby-config."))?.length) {
    type.framework = FRAMEWORKS["gatsby"];
    return type;
  }

  // Laravel.
  if (configFiles.find((file) => file.startsWith("composer.json"))?.length) {
    type.framework = FRAMEWORKS["laravel"];
    return type;
  }

  // Remix.
  if (Object.keys(packageJson?.dependencies ?? {}).find((dep) => dep.startsWith("@remix-run/"))) {
    type.framework = FRAMEWORKS["remix"];
    return type;
  }

  // TanStack Start.
  if (
    [...Object.keys(packageJson?.dependencies ?? {}), ...Object.keys(packageJson?.devDependencies ?? {})].find((dep) =>
      dep.startsWith("@tanstack/react-start"),
    )
  ) {
    type.framework = FRAMEWORKS["tanstack-start"];
    return type;
  }

  // React Router.
  if (configFiles.find((file) => file.startsWith("react-router.config."))?.length) {
    type.framework = FRAMEWORKS["react-router"];
    return type;
  }

  // Vite.
  // Some Remix templates also have a vite.config.* file.
  // We'll assume that it got caught by the Remix check above.
  if (configFiles.find((file) => file.startsWith("vite.config."))?.length) {
    type.framework = FRAMEWORKS["vite"];
    return type;
  }

  // Vinxi-based (such as @tanstack/start and @solidjs/solid-start)
  // They are vite-based, and the same configurations used for Vite should work flawlessly
  const appConfig = configFiles.find((file) => file.startsWith("app.config"));
  if (appConfig?.length) {
    const appConfigContents = await fs.readFile(path.resolve(cwd, appConfig), "utf8");
    if (appConfigContents.includes("defineConfig")) {
      type.framework = FRAMEWORKS["vite"];
      return type;
    }
  }

  // Expo.
  if (packageJson?.dependencies?.expo) {
    type.framework = FRAMEWORKS["expo"];
    return type;
  }

  return type;
}

export async function getTsConfigAliasPrefix(cwd: string) {
  const tsConfig = await loadConfig(cwd);

  if (tsConfig?.resultType === "failed" || !Object.entries(tsConfig?.paths).length) {
    return null;
  }

  // This assume that the first alias is the prefix.
  for (const [alias, paths] of Object.entries(tsConfig.paths)) {
    if (
      paths.includes("./*") ||
      paths.includes("./src/*") ||
      paths.includes("./app/*") ||
      paths.includes("./resources/js/*") // Laravel.
    ) {
      return alias.replace(/\/\*$/, "") ?? null;
    }
  }

  // Use the first alias as the prefix.
  return Object.keys(tsConfig?.paths)?.[0].replace(/\/\*$/, "") ?? null;
}

export async function isTypeScriptProject(cwd: string) {
  const files = await fg.glob("tsconfig.*", {
    cwd,
    deep: 1,
    ignore: PROJECT_SHARED_IGNORE,
  });

  return files.length > 0;
}

export async function getTsConfig(cwd: string) {
  for (const fallback of ["tsconfig.json", "tsconfig.web.json", "tsconfig.app.json"]) {
    const filePath = path.resolve(cwd, fallback);
    if (!(await fs.pathExists(filePath))) {
      continue;
    }

    // We can't use fs.readJSON because it doesn't support comments.
    const contents = await fs.readFile(filePath, "utf8");
    const cleanedContents = contents.replace(/\/\*\s*\*\//g, "");
    const result = TS_CONFIG_SCHEMA.safeParse(JSON.parse(cleanedContents));

    if (result.error) {
      continue;
    }

    return result.data;
  }

  return null;
}

export async function getProjectConfig(
  cwd: string,
  defaultProjectInfo: ProjectInfo | null = null,
): Promise<Config | null> {
  // Check for existing component config.
  const [existingConfig, projectInfo] = await Promise.all([
    getConfig(cwd),
    !defaultProjectInfo ? getProjectInfo(cwd) : Promise.resolve(defaultProjectInfo),
  ]);

  if (existingConfig) {
    return existingConfig;
  }

  if (!projectInfo) {
    return null;
  }

  const config: z.infer<typeof rawConfigSchema> = {
    $schema: "https://ui.shadcn.com/schema.json",
    rsc: projectInfo.isRSC,
    tsx: projectInfo.isTsx,
    aliases: {
      api: `${projectInfo.aliasPrefix}/api`,
      components: `${projectInfo.aliasPrefix}/components`,
      ui: `${projectInfo.aliasPrefix}/components/ui`,
      hooks: `${projectInfo.aliasPrefix}/hooks`,
      lib: `${projectInfo.aliasPrefix}/lib`,
      utils: `${projectInfo.aliasPrefix}/lib/utils`,
    },
  };

  return await resolveConfigPaths(cwd, config);
}
