import { JSONOutput, ReflectionKind } from "typedoc";

import { getReference } from "./reference.utils";

const isFunctionReflection = (
  reflection: any,
  reflectionsTree: JSONOutput.ProjectReflection[],
): boolean => {
  const element = reflection as unknown as JSONOutput.DeclarationReflection;

  if (typeof element.type === "object" && element.type && "id" in element.type && element.type.id) {
    const referenceType = getReference(reflectionsTree, element.type.id, element.type.name);

    if (referenceType?.type?.type === "conditional") {
      if (
        referenceType.type?.trueType &&
        isFunctionReflection(referenceType.type.trueType, reflectionsTree)
      ) {
        return true;
      }
      if (
        referenceType.type?.falseType &&
        isFunctionReflection(referenceType.type.falseType, reflectionsTree)
      ) {
        return true;
      }
      if (
        referenceType.type?.checkType &&
        isFunctionReflection(referenceType.type.trueType, reflectionsTree)
      ) {
        return true;
      }
    }
    if (referenceType) {
      return isFunctionReflection(referenceType, reflectionsTree);
    }
  }
  if (
    typeof element.type === "object" &&
    element?.type &&
    "declaration" in element.type &&
    element.type.declaration
  ) {
    return !!element.type.declaration.signatures;
  }
  if ((element as any)?.declaration) {
    return !!(element as any).declaration?.signatures;
  }
  return false;
};

export const isMethod = (
  reflection: JSONOutput.DeclarationReflection,
  reflectionsTree: JSONOutput.ProjectReflection[],
) => {
  if (reflection.kind === ReflectionKind.Method) {
    return true;
  }
  return isFunctionReflection(reflection, reflectionsTree);
};

export const getMethods = (
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
      return isMethod(element, reflectionsTree);
    });
};
