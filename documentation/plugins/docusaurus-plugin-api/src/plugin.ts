import pluginBase from "@docusaurus/plugin-content-docs";
import { DEFAULT_OPTIONS } from "@docusaurus/plugin-content-docs/lib/options";
import { LoadContext } from "@docusaurus/types";
import * as path from "path";

import builder from "./builder/builder";
import { prepareApiDirectory } from "./utils/file.utils";
import { PluginOptions } from "./types/package.types";
import { trace, info } from "./utils/log.utils";
import { apiDir } from "./constants/paths.constants";

function plugin(context: LoadContext, options: PluginOptions) {
  const { generatedFilesDir } = context;

  const apiRootDir = path.join(generatedFilesDir, "..", apiDir, options.docs.routeBasePath);

  // Prepare api directory to exist
  prepareApiDirectory(apiRootDir);

  trace("Initializing content docs plugin");
  // @ts-ignore
  const pluginInstance = pluginBase(context, {
    ...DEFAULT_OPTIONS,
    ...options.docs,
    path: path.join(apiDir, options.docs.routeBasePath),
    id: options.id,
  });
  info("Successfully initialized plugin base");

  return {
    ...pluginInstance,
    loadContent: async function () {
      await builder(apiRootDir, options);

      trace("Loading generated docs");
      console.log("\n");
      const response = await pluginInstance.loadContent();
      return response;
    },
  };
}

export default plugin;
