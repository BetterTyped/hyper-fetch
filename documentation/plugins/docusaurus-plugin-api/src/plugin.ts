import pluginBase, { LoadedContent } from "@docusaurus/plugin-content-docs";
import { Plugin, LoadContext } from "@docusaurus/types";
import * as path from "path";

import builder from "./builder/builder";
import { cleanFileName, prepareApiDirectory } from "./utils/file.utils";
import { PluginOptions } from "./types/package.types";
import { trace, info } from "./utils/log.utils";
import { apiDir } from "./constants/paths.constants";
import { assignPluginOpts } from "./globals";
import injector from "./injector";

const { DEFAULT_OPTIONS } = require("./lib/options");

let generated = false;

async function plugin(context: LoadContext, options: PluginOptions): Promise<Plugin<LoadedContent>> {
  const { generatedFilesDir } = context;
  assignPluginOpts(options);

  const apiRootDir = path.join(generatedFilesDir, "..", apiDir, options.docs.routeBasePath);

  // Prepare api directory to exist
  if (!generated) prepareApiDirectory(apiRootDir);

  const injectorPackages = options.packages.map((pkg) => {
    const isMonorepo = options.packages.length > 1;
    const packageName = cleanFileName(pkg.title);
    const packageApiDir = isMonorepo ? path.join(apiRootDir, packageName) : apiRootDir; // -> /api/Hyper-Fetch(if monorepo) or /api

    return { name: packageName, docDir: packageApiDir };
  });

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
      [
        injector,
        {
          packages: injectorPackages,
        },
      ],
    ],
  });
  info("Successfully initialized plugin base");

  const instance = await pluginInstance;

  return {
    ...instance,
    loadContent: async function () {
      if (!generated) {
        await builder(apiRootDir, options);
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
