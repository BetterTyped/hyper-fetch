import json2md from "json2md";
import { JSONOutput } from "typedoc";
import { MdTransformer } from "../md/md.transformer";
import { PluginOptions } from "../types/package.types";

export const classFormatter = (
  value: JSONOutput.DeclarationReflection,
  options: PluginOptions,
  pkg: string,
): string => {
  const transformer = new MdTransformer(value, options, pkg);

  return json2md([
    ...transformer.getName(),
    ...transformer.getBadges(),
    ...transformer.getDescription(true),
    ...transformer.getImport(),
    ...transformer.getParams(),
    ...transformer.getMethods(),
  ]);
};
