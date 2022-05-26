import json2md from "json2md";

import { MdTransformer } from "../md/md.transformer";
import { FormatterPropsType } from "./api.formatter";

export const typeFormatter = (props: FormatterPropsType): string => {
  const { reflection, pluginOptions, npmName, packageName, reflectionTree } = props;
  const transformer = new MdTransformer(reflection, pluginOptions, npmName, packageName, reflectionTree);

  return json2md([
    ...transformer.getName(),
    ...transformer.getBadges(),
    ...transformer.getMainLine(),
    ...transformer.getAdmonitionsByType("deprecated"),
    ...transformer.getAdmonitionsByType("danger"),
    ...transformer.getImport(),
    ...transformer.getDescription(),
    ...transformer.getPreview(),
    ...transformer.getAdmonitionsByType("info"),
    ...transformer.getAdmonitionsByType("tip"),
    ...transformer.getAdmonitionsByType("note"),
    ...transformer.getAdmonitionsByType("caution"),
    ...transformer.getExample(),
    ...transformer.getReturns(),
    ...transformer.getTypeReferences(),
    ...transformer.getAdditionalLinks(),
    ...transformer.getMainLine(),
  ]);
};
