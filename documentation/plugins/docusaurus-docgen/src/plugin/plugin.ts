/* eslint-disable global-require */
import pluginBase, { LoadedContent } from "@docusaurus/plugin-content-docs";
import { Plugin, LoadContext } from "@docusaurus/types";
import * as path from "path";
import mermaid from "mdx-mermaid";
import admonitions from "remark-admonitions";

import { copyLibFiles, prepareApiDirectory } from "../docs/generator/utils/file.utils";
import { PluginOptions } from "../types/package.types";
import { trace, info } from "../utils/log.utils";
import { libraryDir } from "../constants/paths.constants";
import { buildDocs } from "../docs/docs";
import { name } from "../constants/name.constants";

export async function plugin(
  context: LoadContext,
  options: PluginOptions,
): Promise<Plugin<LoadedContent>> {
  const { generatedFilesDir } = context;

  const docsGenerationDir = path.join("./", libraryDir, options.contentDocsOptions.routeBasePath);

  // Prepare api directory to exist
  prepareApiDirectory(docsGenerationDir);

  // Prepare dependencies
  copyLibFiles();
  // eslint-disable-next-line @typescript-eslint/no-var-requires, import/extensions, import/no-dynamic-require
  const { DEFAULT_OPTIONS } = require(`.bin/${name}/options`);

  trace("Initializing plugin...");
  const instance = (await pluginBase(context as any, {
    ...DEFAULT_OPTIONS,
    ...options.contentDocsOptions,
    path: path.join(libraryDir, options.contentDocsOptions.routeBasePath),
    id: options.id,
    remarkPlugins: [...(options?.contentDocsOptions?.remarkPlugins || []), mermaid, admonitions],
  })) as any;
  info("Successfully initialized plugin.");

  return {
    ...instance,
    loadContent: async function loadContent() {
      if (options.packages.length) {
        await buildDocs(docsGenerationDir, generatedFilesDir, options);
        trace("Loading generated docs.");
      } else {
        trace("No packages found.");
      }
      // eslint-disable-next-line no-console
      console.log("\n");
      return instance.loadContent?.();
    } as any,
  };
}
