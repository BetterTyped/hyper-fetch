import { JSONOutput } from "typedoc";

import { getType } from "./types.utils";

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

export const getSignatureType = (
  reflection: JSONOutput.SignatureReflection,
  reflectionsTree: JSONOutput.ProjectReflection[],
  { useArrow }: { useArrow?: boolean },
) => {
  const params =
    reflection.parameters?.map((param) => {
      const paramName = param.name;
      const rest = param.flags?.isRest ? "..." : "";
      const optional = param.flags?.isOptional ? "?" : "";

      return `${rest}${paramName}${optional}: ${getType(param.type, reflectionsTree, {
        deepScan: false,
      })}`;
    }) || [];

  const sign = useArrow ? " => " : ": ";

  return `(${params.join(", ")})${sign}${getType(reflection.type, reflectionsTree, {
    deepScan: false,
  })}`;
};
