/* eslint-disable global-require */
import { LoadedContent } from "@docusaurus/plugin-content-docs";
import { Plugin, LoadContext } from "@docusaurus/types";
import * as path from "path";

import { prepareApiDirectory } from "../docs/generator/utils/file.utils";
import { PluginOptions } from "../types/package.types";
import { trace, info } from "../utils/log.utils";
import { buildDocs } from "../docs/docs";

export async function plugin(
  context: LoadContext,
  options: PluginOptions,
): Promise<Plugin<LoadedContent>> {
  const { generatedFilesDir } = context;
  const { outDir } = options;
  const docsGenerationDir = path.join(generatedFilesDir, "..", outDir);

  prepareApiDirectory(docsGenerationDir);

  trace("Initializing plugin...");

  // if (generated) {
  //   info("Skipping, plugin already initialized.");
  //   return instance;
  // }

  info("Successfully initialized plugin.");
  if (options.packages.length) {
    await buildDocs(docsGenerationDir, generatedFilesDir, options);
    trace("Loading generated docs.");
  } else {
    trace("No packages found.");
  }
  // eslint-disable-next-line no-console
  console.log("\n");

  return {
    name: "docusaurus-docgen",
  };
}
