import * as path from "path";
import { LoadContext, Plugin } from "@docusaurus/types";

import { parseToJson } from "./parser/parser";
import { asyncForEach } from "./utils/loop.utils";
import { PluginOptions } from "./types/package.types";
import { getPackageJson } from "./utils/package.utils";
import { apiDocsPath } from "./constants/paths.constants";
import { prepareApiDirectory } from "./utils/file.utils";
import { info, success, trace } from "./utils/log.utils";
import { cleanFileName } from "./utils/file.utils";
import { apiGenerator } from "./generators/api.generator";
import { name } from "./constants/name.constants";

const plugin = function (context: LoadContext, options: PluginOptions): Plugin<LoadContext, PluginOptions> {
  const { generatedFilesDir } = context;
  const { apiDir = "api", packages } = options;
  const isMonorepo = packages.length > 1;

  return {
    name,

    async loadContent() {
      info(`Generate docs for ${packages.length} package`);

      const docsRoot = generatedFilesDir;
      const apiRootDir = path.join(docsRoot, apiDir);

      // Prepare api directory
      await prepareApiDirectory(apiRootDir);

      // Generate docs for each package
      await asyncForEach(packages, async (element) => {
        const {
          dir,
          title,
          entryPath,
          tsconfigName = "/tsconfig.json",
          tsconfigDir = element.dir,
          packageJsonName = "/package.json",
          packageJsonDir = element.dir,
        } = element;

        // Package.json file
        const packageJson = getPackageJson(packageJsonDir, packageJsonName);

        // Setup
        const mainTitle = cleanFileName(title || packageJson?.name || "default");

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
        const packageRoute = isMonorepo ? path.join(apiDir, mainTitle) : apiDir;
        info(`Generating docs files...`, mainTitle);
        await apiGenerator(json, packageRoute, docsRoot);
      });

      return context;
    },
  };
};
export default plugin;
