import { JSONOutput } from "typedoc";

import { isMethod } from "./methods.utils";

export const getProperties = (
  reflection: JSONOutput.DeclarationReflection,
  reflectionsTree: JSONOutput.ProjectReflection[],
) => {
  return (reflection.children || [])
    .sort((a, b) => {
      const nameA = a.name.startsWith("_");
      const nameB = b.name.startsWith("_");

      if (nameA && nameB) {
        return 0;
      }
      if (nameA) {
        return 1;
      }
      return -1;
    })
    .filter((element) => element.name !== "constructor")
    .filter((element) => {
      return !isMethod(element, reflectionsTree);
    });
};
