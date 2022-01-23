import * as path from "path";
import { LoadContext } from "@docusaurus/types";

import { parseToJson } from "./parser/parser";
import { asyncForEach } from "./utils/loop.utils";
import { PluginOptions } from "./types/package.types";
import { getPackageJson } from "./utils/package.utils";
import { apiDocsPath } from "./constants/paths.constants";
// import { prepareApiDirectory } from "./utils/file.utils";

const plugin = function (context: LoadContext, options: PluginOptions) {
  const { generatedFilesDir } = context;
  const { apiDir = "/api", packages } = options;
  const isMonorepo = packages.length > 1;

  return {
    name: "docusaurus-plugin-api",

    async contentLoaded() {
      // Generate docs for each package
      await asyncForEach(packages, async (element) => {
        const {
          dir,
          title,
          entryPath,
          tsconfigName = "/tsconfig.json",
          tsconfigDir = dir,
          packageJsonName = "/package.json",
          packageJsonDir = dir,
        } = element;

        // Package tsconfig file
        const tsconfigPath = path.join(tsconfigDir, tsconfigName);

        // Package entry file
        const entry = path.join(dir, entryPath);

        // Package.json file
        const packageJson = getPackageJson(packageJsonDir, packageJsonName);

        // Setup
        const mainTitle = title || packageJson?.name || "-";

        // Output directory
        const docusaurusDir = path.join(generatedFilesDir, "..");
        const apiRootDir = path.join(docusaurusDir, apiDir);
        const packageApiDir = isMonorepo ? path.join(apiRootDir, mainTitle) : apiRootDir;
        const apiJsonDocsPath = path.join(packageApiDir, apiDocsPath);

        // Prepare api directory
        // await prepareApiDirectory(apiRootDir);

        // Scan and parse docs to json
        await parseToJson(apiJsonDocsPath, entry, tsconfigPath);

        // Generate docs files
      });

      const sleep = () => new Promise((r) => setTimeout(r, 100000));

      await sleep();
    },
  };
};

export default plugin;
