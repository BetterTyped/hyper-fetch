import * as path from "path";
import { JSONOutput } from "typedoc";

import { trace, error } from "../../utils/log.utils";
import { createFile, getKindName } from "../../utils/file.utils";
import { pageGenerator } from "./page-generator";
import { PluginOptions } from "../../types/package.types";

const docsExtension = ".md";

type ApiGeneratorProps = {
  packageName: string;
  parsedApiJson: JSONOutput.ProjectReflection;
  packageDocsDir: string;
  docsGenerationDir: string;
  options: PluginOptions;
};

export const apiGenerator = ({
  packageName,
  parsedApiJson,
  packageDocsDir,
  options,
}: ApiGeneratorProps) => {
  const reflectionTree = (parsedApiJson.children || []).map((child) => ({
    ...child,
    kindString: getKindName(child.kindString || "", child.name),
  }));

  parsedApiJson.children?.forEach((reflection) => {
    const { name } = reflection;
    const kind = getKindName(reflection.kindString || "", name);

    if (!kind) {
      return trace(`Module ${kind} not parsed. Missing type specification.`);
    }

    const data = pageGenerator({
      reflection,
      reflectionTree,
      pluginOptions: options,
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
