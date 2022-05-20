import * as path from "path";
import { JSONOutput } from "typedoc";
import { trace, error } from "../utils/log.utils";
import { createFile, getKindName } from "../utils/file.utils";
import { apiFormatter } from "../formatters/api.formatter";
import { PluginOptions } from "../types/package.types";

const docsExtension = ".mdx";

export const apiGenerator = (
  jsonFile: JSONOutput.ProjectReflection,
  options: PluginOptions,
  packageName: string,
  docsRoot: string,
) => {
  const reflectionTree: Pick<JSONOutput.DeclarationReflection, "id" | "name" | "kind" | "kindString">[] = (
    jsonFile.children || []
  ).map((child) => ({
    id: child.id,
    name: child.name,
    kind: child.kind,
    kindString: child.kindString,
  }));

  jsonFile.children?.forEach((reflection) => {
    const name = reflection.name;
    const kind = getKindName(reflection.kindString || "", name);

    if (!kind) {
      return trace(`Module ${kind} not parsed. Missing type specification.`);
    }

    const data = apiFormatter({
      reflection,
      reflectionTree,
      pluginOptions: options,
      npmName: jsonFile.name,
      packageName,
    });

    try {
      const isMonorepo = options.packages.length > 1;
      const pkgNamespace = isMonorepo ? packageName : ""; // -> /api/Hyper-Fetch(if monorepo) or /api
      const routePath = path.join(docsRoot, pkgNamespace, kind, name + docsExtension);
      createFile(routePath, data);
    } catch (err) {
      error(`Cannot create file for ${name}`);
      error(err);
    }
  });

  // Module
  // - overview (if overview.md file is present use it, if not - create own overview)
  // - classes
  // - components (if includes tsx/jsx) / functions (other)
  // - interfaces (types, interfaces)
};
