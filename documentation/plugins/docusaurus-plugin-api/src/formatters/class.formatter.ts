import json2md from "json2md";

import { MdTransformer } from "../md/md.transformer";
import { FormatterPropsType } from "./api.formatter";

export const classFormatter = (props: FormatterPropsType): string => {
  const { reflection, pluginOptions, npmName, packageName, reflectionTree } = props;
  const transformer = new MdTransformer(reflection, pluginOptions, npmName, packageName, reflectionTree);

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
    ...transformer.getMethods(),
    ...transformer.getTypeReferences(),
    ...transformer.getAdditionalLinks(),
    ...transformer.getMainLine(),
  ]);
};
