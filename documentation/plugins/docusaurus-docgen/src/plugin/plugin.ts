/* eslint-disable global-require */
import pluginBase, { LoadedContent } from "@docusaurus/plugin-content-docs";
import { Plugin, LoadContext } from "@docusaurus/types";
import * as path from "path";
import mermaid from "mdx-mermaid";
import admonitions from "remark-admonitions";

import { getLibFiles, prepareApiDirectory } from "../docs/generator/utils/file.utils";
import { PluginOptions } from "../types/package.types";
import { trace, info } from "../utils/log.utils";
import { libraryDir } from "../constants/paths.constants";
import { buildDocs } from "../docs/docs";

export async function plugin(
  context: LoadContext,
  options: PluginOptions,
): Promise<Plugin<LoadedContent>> {
  const { DEFAULT_OPTIONS } = getLibFiles();
  const { generatedFilesDir } = context;
  const docsGenerationDir = path.join(libraryDir, options.contentDocsOptions.routeBasePath);
  const apiDocsDir = path.join(".docusaurus", libraryDir, options.contentDocsOptions.routeBasePath);

  prepareApiDirectory(path.join(generatedFilesDir, docsGenerationDir));

  trace("Initializing plugin...");
  const instance = await pluginBase(context, {
    ...DEFAULT_OPTIONS,
    ...options.contentDocsOptions,
    path: apiDocsDir,
    id: options.id,
    remarkPlugins: [...(options?.contentDocsOptions?.remarkPlugins || []), mermaid, admonitions],
  });

  // if (generated) {
  //   info("Skipping, plugin already initialized.");
  //   return instance;
  // }

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
