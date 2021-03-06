import pluginBase, { LoadedContent } from "@docusaurus/plugin-content-docs";
import { Plugin, LoadContext } from "@docusaurus/types";
import * as path from "path";

import builder from "./builder/builder";
import { prepareApiDirectory } from "./utils/file.utils";
import { PluginOptions } from "./types/package.types";
import { trace, info } from "./utils/log.utils";
import { apiDir } from "./constants/paths.constants";

const { DEFAULT_OPTIONS } = require("./lib/options");

let generated = false;

async function plugin(context: LoadContext, options: PluginOptions): Promise<Plugin<LoadedContent>> {
  const { generatedFilesDir } = context;

  const apiRootDir = path.join(generatedFilesDir, "..", apiDir, options.docs.routeBasePath);

  // Prepare api directory to exist
  if (!generated) prepareApiDirectory(apiRootDir);

  trace("Initializing content docs plugin");
  // @ts-ignore
  const pluginInstance = pluginBase(context, {
    ...DEFAULT_OPTIONS,
    ...options.docs,
    path: path.join(apiDir, options.docs.routeBasePath),
    id: options.id,
    remarkPlugins: [
      ...options.docs.remarkPlugins,
      require("mdx-mermaid"),
      require("remark-admonitions"),
      require("mdx-mermaid"),
    ],
  });
  info("Successfully initialized plugin base");

  const instance = await pluginInstance;

  return {
    ...instance,
    loadContent: async function () {
      if (!generated) {
        await builder(apiRootDir, options, generatedFilesDir);
        generated = true;
      } else {
        trace("Using cached api files. If you want to see changes, please restart the command.");
      }

      trace("Loading generated docs");
      console.log("\n");
      return instance.loadContent?.();
    } as any,
  };
}

export default plugin;
