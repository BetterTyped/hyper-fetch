import * as TypeDoc from "typedoc";
// import { load } from "typedoc-plugin-markdown";

import { PluginOptions } from "../../types/package.types";

export const parseTypescriptToJson = async (
  packageDocsDir: string,
  packageDocsPath: string,
  entryPoints: string[],
  tsconfig: string,
  pluginOptions: PluginOptions,
) => {
  // 1. Prepare typedoc application to render
  const app = new TypeDoc.Application();

  // 2. Prepare parser readers
  app.options.addReader(new TypeDoc.TSConfigReader());
  app.options.addReader(new TypeDoc.TypeDocReader());

  // 3. Parser options to bootstrap project
  app.bootstrap({
    excludeExternals: true,
    excludeInternal: true,
    excludePrivate: true,
    excludeProtected: true,
    exclude: ["node_modules", "tests", "__tests__", "*.spec.ts", "*.test.ts"],
    logLevel: "Error",
    entryPointStrategy: "expand",
    ...pluginOptions.typeDocOptions,
    plugin: ["typedoc-plugin-markdown", ...(pluginOptions.typeDocOptions?.plugin || [])],
    tsconfig,
    entryPoints,
  });

  // load(app);

  // 4. Generate json output
  const project = app.convert();
  if (project) {
    await app.generateJson(project, packageDocsPath);
    await app.generateDocs(project, packageDocsDir);
  } else {
    throw new Error(`Cannot generate docs for dir: ${packageDocsPath}.`);
  }
};
