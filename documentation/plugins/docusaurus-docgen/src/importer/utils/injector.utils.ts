import { promises } from "fs";
import { JSONOutput } from "typedoc";

import { PkgMeta } from "types/package.types";

export const isDocsJSONGenerated = async (packageConfig: PkgMeta): Promise<void> => {
  const notFoundDocs: string[] = [];

  try {
    await promises.access(packageConfig.packageDocsJsonPath);
  } catch {
    notFoundDocs.push(packageConfig.title);
  }

  if (notFoundDocs.length > 0) {
    throw Error(`Could not find docs for the following packages: ${notFoundDocs.join(", ")}`);
  }
};

export const getMatchingElement = (parsedDocsJson: JSONOutput.ProjectReflection, name: string) => {
  const element = parsedDocsJson.children?.find((reflection) => {
    return reflection.name === name;
  });
  if (!element) throw new Error(`Cannot find matching reflection for ${name}`);
  return element;
};
