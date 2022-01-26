import * as path from "path";

import { parseToJson } from "../parser/parser";
import { asyncForEach } from "../utils/loop.utils";
import { PluginOptions } from "../types/package.types";
import { apiDocsPath, apiDir } from "../constants/paths.constants";
import { info, success, trace } from "../utils/log.utils";
import { cleanFileName } from "../utils/file.utils";
import { apiGenerator } from "../generators/api.generator";
import { generateMonorepoPage } from "../generators/monorepo.page";

let generated = false;

const builder = async (apiRootDir: string, options: PluginOptions) => {
  const { packages } = options;
  const isMonorepo = packages.length > 1;

  if (generated) {
    return info(`Using cached api`);
  }

  if (isMonorepo) {
    generateMonorepoPage(apiRootDir, options);
  }

  // Generate docs for each package
  await asyncForEach(packages, async (element) => {
    const { dir, title, entryPath, tsconfigName = "/tsconfig.json", tsconfigDir = element.dir } = element;

    // Setup
    const mainTitle = cleanFileName(title);

    // Package tsconfig file
    const tsconfigPath = path.join(tsconfigDir, tsconfigName);

    // Package entry file
    const entry = path.join(dir, entryPath);

    // Output directory
    trace(`Setup directories for ${mainTitle || "default"}`, mainTitle);
    const packageApiDir = isMonorepo ? path.join(apiRootDir, mainTitle) : apiRootDir; // -> /api/Hyper-Fetch(if monorepo) or /api
    const apiJsonDocsPath = path.join(packageApiDir, apiDocsPath);

    // Scan and parse docs to json
    info(`Starting project parsing.`, mainTitle);
    await parseToJson(apiJsonDocsPath, entry, tsconfigPath);
    success(`Successfully parsed docs!`, mainTitle);

    // Generate docs files
    const json = await import(apiJsonDocsPath);
    info(`Generating docs files...`, mainTitle);
    await apiGenerator(json, mainTitle, apiRootDir);
    generated = true;
  });
};
export default builder;
