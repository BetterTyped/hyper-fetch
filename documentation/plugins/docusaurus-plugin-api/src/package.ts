import * as path from "path";
import { LoadContext } from "@docusaurus/types";

import { parseToJson } from "./parser/parser";
import { asyncForEach } from "./utils/loop.utils";
import { PluginOptions } from "./types/package.types";
import { getPackageJson } from "./utils/package.utils";
import { apiDocsPath } from "./constants/paths.constants";
import { preparePluginConfig } from "./utils/docusaurus.utils";
import { prepareApiDirectory } from "./utils/file.utils";
import { info } from "./utils/log.utils";
import { cleanFileName } from "./utils/file.utils";

const plugin = function (context: LoadContext, options: PluginOptions) {
  const { generatedFilesDir } = context;
  const { apiDir = "api", sidebarPath, packages } = options;
  const isMonorepo = packages.length > 1;

  // inject configs
  info("Extending docusaurus config.");
  preparePluginConfig(context, apiDir, sidebarPath);

  return {
    name: "docusaurus-plugin-api",

    async contentLoaded() {
      info("Generate docs for each package");

      const docusaurusDir = path.join(generatedFilesDir, "..");
      const apiRootDir = path.join(docusaurusDir, apiDir);

      // Prepare api directory
      info(`Prepare api directory at /${apiDir}`);
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

        info(`Starting setup for ${dir} directory`);

        // Package tsconfig file
        const tsconfigPath = path.join(tsconfigDir, tsconfigName);

        // Package entry file
        const entry = path.join(dir, entryPath);

        // Package.json file
        const packageJson = getPackageJson(packageJsonDir, packageJsonName);

        // Setup
        const mainTitle = cleanFileName(title || packageJson?.name || "default");

        // Output directory
        info(`Setup directories for ${mainTitle || "default"}`);
        const packageApiDir = isMonorepo ? path.join(apiRootDir, mainTitle) : apiRootDir;
        const apiJsonDocsPath = path.join(packageApiDir, apiDocsPath);

        // Scan and parse docs to json
        info(`Parsing docs for ${mainTitle || "default"}`);
        await parseToJson(apiJsonDocsPath, entry, tsconfigPath);

        // Generate docs files
        info(`Generate docs files for ${mainTitle || "default"}`);
      });

      // For development to not close logs
      const sleep = () => new Promise((r) => setTimeout(r, 100000));

      await sleep();
    },
  };
};

export default plugin;
