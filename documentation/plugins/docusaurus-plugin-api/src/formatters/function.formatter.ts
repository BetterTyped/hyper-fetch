import json2md from "json2md";
import { JSONOutput } from "typedoc";

import { PluginOptions } from "../types/package.types";
import { MdTransformer } from "../md/md.transformer";

export const functionFormatter = (
  value: JSONOutput.DeclarationReflection,
  options: PluginOptions,
  pkg: string,
): string => {
  const transformer = new MdTransformer(value, options, pkg);

  return json2md([
    ...transformer.getName(),
    ...transformer.getBadges(),
    ...transformer.getMainLine(),
    ...transformer.getAdmonitionsByType("deprecated"),
    ...transformer.getAdmonitionsByType("danger"),
    ...transformer.getPreview(),
    ...transformer.getDescription(),
    ...transformer.getAdmonitionsByType("info"),
    ...transformer.getAdmonitionsByType("tip"),
    ...transformer.getAdmonitionsByType("note"),
    ...transformer.getAdmonitionsByType("caution"),
    ...transformer.getExample(),
    ...transformer.getImport(),
    ...transformer.getParameters(),
  ]);
};
