import * as path from "path";
import { JSONOutput } from "typedoc";

import { trace, error } from "../../utils/log.utils";
import { createFile, getKindName } from "../../utils/file.utils";
import { pageGenerator } from "./page-generator";
import { PackageOptions, PluginOptions } from "../../types/package.types";

const docsExtension = ".md";

type ApiGeneratorProps = {
  packageName: string;
  parsedApiJsons: JSONOutput.ProjectReflection[];
  packageDocsDir: string;
  docsGenerationDir: string;
  pluginOptions: PluginOptions;
  packageOptions: PackageOptions;
};

export const apiGenerator = ({
  packageName,
  parsedApiJsons,
  packageDocsDir,
  pluginOptions,
  packageOptions,
}: ApiGeneratorProps) => {
  const parsedApiJson = parsedApiJsons[0];

  parsedApiJson.children?.forEach((reflection) => {
    const { name } = reflection;
    const kind = getKindName(reflection.kindString || "", name);

    if (!kind) {
      return trace(`Module ${kind} not parsed. Missing type specification.`);
    }

    const data = pageGenerator({
      reflection,
      reflectionsTree: parsedApiJsons,
      pluginOptions,
      packageOptions,
      npmName: parsedApiJson.name,
      packageName,
    });

    try {
      const pagePath = path.join(packageDocsDir, kind, name + docsExtension);
      createFile(pagePath, data);
    } catch (err) {
      error(`Cannot create file for ${name}`);
      error(err);
    }
  });
};
