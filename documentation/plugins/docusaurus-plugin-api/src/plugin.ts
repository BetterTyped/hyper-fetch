import pluginBase from "@docusaurus/plugin-content-docs";
import { DEFAULT_OPTIONS } from "@docusaurus/plugin-content-docs/lib/options";
import { LoadContext } from "@docusaurus/types";
import * as path from "path";

import builder from "./builder/builder";
import { prepareApiDirectory } from "./utils/file.utils";
import { PluginOptions } from "./types/package.types";
import { trace, info } from "./utils/log.utils";
import { apiDir } from "./constants/paths.constants";
import { assignPluginOpts } from "./globals";

let generated = false;

function plugin(context: LoadContext, options: PluginOptions) {
  const { generatedFilesDir } = context;
  assignPluginOpts(options);

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
    remarkPlugins: [...options.docs.remarkPlugins, require("mdx-mermaid"), require("remark-admonitions")],
  });
  info("Successfully initialized plugin base");

  return {
    ...pluginInstance,
    loadContent: async function () {
      if (!generated) {
        await builder(apiRootDir, options);
        generated = true;
      } else {
        trace("Using cached api files. If you want to see changes, please restart the command.");
      }

      trace("Loading generated docs");
      console.log("\n");
      return pluginInstance.loadContent();
    },
  };
}

export default plugin;
