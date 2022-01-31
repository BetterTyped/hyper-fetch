import * as TypeDoc from "typedoc";
import { PluginOptions } from "../types/package.types";
import { getPackageJson } from "../utils/package.utils";
import { trace } from "../utils/log.utils";

export const parseToJson = async (
  apiDocsPath: string,
  entryPath: string,
  tsconfig: string,
  pluginOptions: PluginOptions,
) => {
  // 1. Prepare typedoc application to render
  const app = new TypeDoc.Application();

  // 2. Prepare parser readers
  app.options.addReader(new TypeDoc.TSConfigReader());
  app.options.addReader(new TypeDoc.TypeDocReader());

  const excludedPackages: string[] = pluginOptions.packages
    .map((pkg) => {
      const packageJson = getPackageJson(pkg.dir, "package.json");
      return packageJson ? (packageJson.name as string) : "";
    })
    .filter(Boolean);

  trace(`Exclude packages: ${excludedPackages.join(", ")}`, "Parser");

  // 3. Parser options to bootstrap project
  app.bootstrap({
    excludeExternals: true,
    excludeInternal: true,
    excludePrivate: true,
    excludeProtected: true,
    exclude: [...excludedPackages, "node_modules"],
    logLevel: "Error",
    entryPointStrategy: "packages",
    ...pluginOptions.typeDocOptions,
    tsconfig,
    entryPoints: [entryPath],
  });

  // 4. Generate json output
  const project = app.convert();
  if (project) {
    await app.generateJson(project, apiDocsPath);
  } else {
    throw new Error("Cannot generate project for dir: " + apiDocsPath);
  }
};
