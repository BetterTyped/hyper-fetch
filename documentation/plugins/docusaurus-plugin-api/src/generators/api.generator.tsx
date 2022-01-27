import * as path from "path";
import { JSONOutput } from "typedoc";
import { trace, error } from "../utils/log.utils";
import { createFile } from "../utils/file.utils";
import { apiFormatter } from "../formatters/api.formatter";
import { PluginOptions } from "../types/package.types";

const docsExtension = ".mdx";

export const apiGenerator = (
  jsonFile: JSONOutput.ProjectReflection,
  options: PluginOptions,
  packageRoute: string,
  docsRoot: string,
) => {
  jsonFile.children?.forEach((child) => {
    const name = child.name;
    const kind = child.kindString;

    if (!kind) {
      return trace(`Module ${kind} not parsed. Missing type specification.`);
    }

    const data = apiFormatter(child, options, jsonFile.name);

    try {
      const routePath = path.join(docsRoot, packageRoute, kind, name + docsExtension);
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
