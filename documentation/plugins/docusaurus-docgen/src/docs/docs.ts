/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import * as path from "path";

import { pluginOptionsPath } from "../constants/paths.constants";
import { asyncForEach } from "./generator/utils/loop.utils";
import { PackageOptionsFile, PackageOptionsFileParts, PluginOptions } from "../types/package.types";
import { success, trace } from "../utils/log.utils";
import { cleanFileName, createFile } from "./generator/utils/file.utils";
import { generateMonorepoPage } from "./pages/presentation/monorepo.page";
import { generatePackagePage } from "./pages/presentation/package.page";
import { parseTypescriptToJson } from "./parser/parser";
import { apiGenerator } from "./generator/api-generator";
import { getPackageOptions } from "./generator/utils/package.utils";

export const buildDocs = async (
  docsGenerationDir: string,
  generatedFilesDir: string,
  pluginOptions: PluginOptions,
) => {
  const { id, packages, tsConfigPath } = pluginOptions;
  const isMonorepo = packages.length > 1;
  const fullDocsPath = path.join(generatedFilesDir, docsGenerationDir);

  if (isMonorepo) {
    trace(`Generating monorepo page for ${pluginOptions.packages.length} packages`);
    generateMonorepoPage(fullDocsPath, pluginOptions);
  }

  /**
   * Save generation options
   */
  const optionsFilePath = path.join(fullDocsPath, pluginOptionsPath);
  const packageFileOptions: PackageOptionsFile = {
    id,
    packages: packages.map((pkg) => {
      const values: PackageOptionsFileParts = {
        title: pkg.title,
        logo: pkg.logo,
        description: pkg.description,
        readmeName: pkg.readmeName,
        showImports: pkg.showImports,
      };
      return values;
    }) as PackageOptionsFileParts[],
  };
  createFile(optionsFilePath, JSON.stringify(packageFileOptions));

  /**
   * Generate docs for each package
   */
  await asyncForEach(packages, async (packageOptions) => {
    const {
      packageName,
      tsconfigPath,
      pkgMeta,
      entries,
      packageOptionsPath,
      packageDocsDir,
      packageDocsJsonPath,
    } = getPackageOptions(
      packages,
      packageOptions,
      docsGenerationDir,
      generatedFilesDir,
      tsConfigPath,
      isMonorepo,
    );

    /**
     * Get directories required for package generation
     */
    trace(`Setup package directories for ${cleanFileName(packageOptions.title)}`, packageName);
    createFile(packageOptionsPath, JSON.stringify(pkgMeta));

    /**
     * Generate package page from readme or custom setup
     */
    trace(`Generating package page`, packageName);
    generatePackagePage(packageDocsDir, packageOptions);

    /**
     * Scan and parse docs to json
     */
    trace(`Starting project parsing...`, packageName);
    await parseTypescriptToJson(packageDocsJsonPath, entries, tsconfigPath, pluginOptions);
    trace(`Successfully parsed docs.`, packageName);
  });

  /**
   * Generate docs files
   */
  await asyncForEach(packages, async (packageOptions) => {
    const { packageName, docsJsonPaths, packageDocsDir } = getPackageOptions(
      packages,
      packageOptions,
      docsGenerationDir,
      generatedFilesDir,
      tsConfigPath,
      isMonorepo,
    );

    trace(`Generating docs files for ${cleanFileName(packageOptions.title)}`);

    const parsedApiJsons = docsJsonPaths.map((docsPath) => {
      return require(docsPath);
    });

    await apiGenerator({
      packageName,
      parsedApiJsons,
      packageDocsDir,
      docsGenerationDir,
      pluginOptions,
      packageOptions,
    });
    trace(`Successfully generated docs files.`, packageName);
  });
  success(`Successfully builded docs!`);
};
