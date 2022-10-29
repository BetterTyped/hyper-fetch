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

export const getProperties = (reflection: JSONOutput.DeclarationReflection) => {
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
    .filter((property) => ["Property"].includes(property.kindString || ""));
};
export const getMethods = (reflection: JSONOutput.DeclarationReflection) => {
  const disabledNames = ["constructor"];
  const disabledKinds = ["Property"];

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
    .filter(
      (method) =>
        !disabledNames.includes(method.name) && !disabledKinds.includes(method.kindString || ""),
    );
};

// Comments

export const getTag = (
  comment: JSONOutput.DeclarationReflection["comment"],
  name: `@${string}`,
) => {
  return comment?.blockTags?.find((blockTag) => blockTag.tag === name);
};
