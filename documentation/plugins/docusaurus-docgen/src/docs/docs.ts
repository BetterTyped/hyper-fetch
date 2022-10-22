import * as path from "path";

import { asyncForEach } from "../utils/loop.utils";
import { PkgMeta, PluginOptions } from "../types/package.types";
import {
  libraryDir,
  optionsPath,
  docsJsonPath,
  packageConfigPath,
} from "../constants/paths.constants";
import { success, trace } from "../utils/log.utils";
import { cleanFileName, createFile } from "../utils/file.utils";
import { generateMonorepoPage } from "./pages/monorepo.page";
import { generatePackagePage } from "./pages/package.page";
import { parseTypescriptToJson } from "./parser/parser";

export const buildDocs = async (
  docsGenerationDir: string,
  generatedFilesDir: string,
  options: PluginOptions,
) => {
  const { packages, tsConfigPath } = options;
  const isMonorepo = packages.length > 1;

  if (isMonorepo) {
    trace(`Generating monorepo page for ${options.packages.length} packages`);
    generateMonorepoPage(docsGenerationDir, options);
  }

  /**
   * Save generation options
   */
  createFile(path.join(generatedFilesDir, "..", libraryDir, optionsPath), JSON.stringify(options));

  /**
   * Generate docs for each package
   */
  await asyncForEach(packages, async (pkg) => {
    const { dir, title, entryPath, tsconfigName = "/tsconfig.json", tsconfigDir = pkg.dir } = pkg;

    /**
     * Get directories required for package generation
     */
    trace(`Setup package directories for ${cleanFileName(title)}`);
    // Returns Hyper Fetch => Hyper-Fetch
    const packageName = cleanFileName(title);
    // Returns /api/Hyper-Fetch(if monorepo) or /api
    const packageDocsDir = isMonorepo
      ? path.join(docsGenerationDir, packageName)
      : docsGenerationDir;
    // Returns [packageDir]/docs.json
    const packageDocsJsonPaths = path.join(packageDocsDir, docsJsonPath);
    // Package tsconfig file
    const tsconfigPath = tsConfigPath ?? path.join(tsconfigDir, tsconfigName);
    // Generate meta
    const pkgMeta: PkgMeta = {
      directory: packageDocsJsonPaths,
    };
    // Package entry files
    const entries = Array.isArray(entryPath)
      ? entryPath.map((entry) => path.join(dir, entry))
      : [path.join(dir, entryPath)];

    createFile(
      path.join(generatedFilesDir, "..", libraryDir, packageConfigPath),
      JSON.stringify(pkgMeta),
    );

    /**
     * Generate package page from readme or custom setup
     */
    trace(`Generating package page`, packageName);
    generatePackagePage(packageDocsDir, pkg);

    /**
     * Scan and parse docs to json
     */
    trace(`Starting project parsing...`, packageName);
    await parseTypescriptToJson(packageDocsJsonPaths, entries, tsconfigPath, options);
    trace(`Successfully parsed docs.`, packageName);

    /**
     * Generate docs files
     */
    trace(`Generating docs files...`, packageName);
    // const json = await import(packageDocsDir);
    // await apiGenerator(json, options, packageName, docsGenerationDir);
    trace(`Successfully generated docs files.`, packageName);
  });
  success(`Successfully builded docs!`);
};
