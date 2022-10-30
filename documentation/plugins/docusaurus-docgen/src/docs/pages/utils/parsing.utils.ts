import { JSONOutput } from "typedoc";

export const getSignature = (reflection: JSONOutput.DeclarationReflection) => {
  const parametersKinds = ["Call", "Constructor"];

  // Methods
  if (reflection.signatures) {
    return reflection.signatures?.find((signature) => !!signature);
  }

  // Class / Function
  if (reflection.children) {
    return reflection.children
      ?.find((child) => parametersKinds.includes(child.kindString || ""))
      ?.signatures?.find((signature) => !!signature);
  }
  return reflection as JSONOutput.SignatureReflection;
};

export const getCallPreview = (signature: JSONOutput.SignatureReflection) => {
  const { name } = signature;

  const typeSignatures =
    signature.typeParameter?.length && signature.typeParameter.map((param) => param.name);
  const typeSignature = typeSignatures ? `<${typeSignatures.join(", ")}>` : "";

  const callSignatures =
    signature.parameters?.length &&
    signature.parameters.map((param) => (param.flags?.isRest ? `...${param.name}` : param.name));
  const callSignature = callSignatures ? callSignatures.join(", ") : "";

  return [name, typeSignature, callSignature];
};

const getReference = (id: number, tree: JSONOutput.DeclarationReflection[]) => {
  return tree.find((element) => element.id === id);
};

const isFunctionType = (
  reflection: any,
  reflectionsTree: JSONOutput.DeclarationReflection[],
): boolean => {
  const element = reflection as unknown as JSONOutput.DeclarationReflection;

  if (typeof element.type === "object" && element.type && "id" in element.type && element.type.id) {
    const referenceType = getReference(element.type.id, reflectionsTree);

    if (referenceType?.type?.type === "conditional") {
      if (
        referenceType.type?.trueType &&
        isFunctionType(referenceType.type.trueType, reflectionsTree)
      ) {
        return true;
      }
      if (
        referenceType.type?.falseType &&
        isFunctionType(referenceType.type.falseType, reflectionsTree)
      ) {
        return true;
      }
      if (
        referenceType.type?.checkType &&
        isFunctionType(referenceType.type.trueType, reflectionsTree)
      ) {
        return true;
      }
    }
    if (referenceType) {
      return isFunctionType(referenceType, reflectionsTree);
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

const isMethod = (
  reflection: JSONOutput.DeclarationReflection,
  reflectionsTree: JSONOutput.DeclarationReflection[],
) => {
  if (reflection.kindString === "Method") {
    return true;
  }
  return isFunctionType(reflection, reflectionsTree);
};

export const getProperties = (
  reflection: JSONOutput.DeclarationReflection,
  reflectionsTree: JSONOutput.DeclarationReflection[],
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

export const getMethods = (
  reflection: JSONOutput.DeclarationReflection,
  reflectionsTree: JSONOutput.DeclarationReflection[],
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

// Comments

export const getTag = (
  comment: JSONOutput.DeclarationReflection["comment"],
  name: `@${string}`,
) => {
  return comment?.blockTags?.find((blockTag) => blockTag.tag === name);
};
