import json2md from "json2md";
import { JSONOutput } from "typedoc";

import { MdTransformer } from "../md/md.transformer";
import { PluginOptions } from "../types/package.types";

export const typeFormatter = (value: JSONOutput.DeclarationReflection, options: PluginOptions, pkg: string): string => {
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
  ]);
};
