import { JSONOutput } from "typedoc";
import { getMdLinkedReference } from "./md.styles";

// for rework check idea: https://github.com/nlepage/typedoc-plugin-resolve-crossmodule-references/blob/main/src/index.ts

// Md
export const sanitizeHtml = (htmlString: string) => {
  return htmlString
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};
export const unSanitizeHtml = (htmlString: string) => {
  return htmlString
    .replace(/&amp;/g, `&`)
    .replace(/&lt;/g, `<`)
    .replace(/&gt;/g, `>`)
    .replace(/&quot;/g, `"`)
    .replace(/&#039;/g, `'`);
};

// Types
export const getTypeName = (
  type:
    | JSONOutput.ParameterReflection["type"]
    | JSONOutput.ReflectionType
    | JSONOutput.SomeType
    | JSONOutput.DeclarationReflection
    | undefined,
  packageLink: string,
  reflectionTree: Pick<JSONOutput.DeclarationReflection, "id" | "name" | "kind" | "kindString">[],
  showGenerics = false,
  link = true,
): string => {
  let params = "";
  let extending = "";
  const infer = type?.type === "inferred" ? "infer" : "";
  const operator = (type && "operator" in type && type?.operator) || "";

  const preValue = infer || operator;
  const prefix = preValue ? preValue + " " : "";
  const isLiteral = type?.type === "literal" && typeof type.value === "string";

  const getResponse = (value: string) => {
    const name = isLiteral ? `"${value}"` : value;
    let fullName = prefix + name + params + extending;
    const linkedType = link ? getLinkedType(fullName, type, packageLink, reflectionTree) : fullName;
    return linkedType;
  };

  if (showGenerics && type && "typeParameter" in type && type.typeParameter) {
    params = `&lt;${type.typeParameter
      .map((arg) => getType(arg, packageLink, reflectionTree, showGenerics, link))
      .join(", ")}&gt;`;
  }

  if (showGenerics && type && "typeArguments" in type && type.typeArguments) {
    params = `&lt;${type.typeArguments
      .map((arg) => getType(arg, packageLink, reflectionTree, showGenerics, link))
      .join(", ")}&gt;`;
  }

  if (type && "extendsType" in type && type.extendsType) {
    extending = ` extends ${getType(type.extendsType, packageLink, reflectionTree, showGenerics, link)}`;
  }

  if (type && "target" in type) {
    return getTypeName(type.target, packageLink, reflectionTree, showGenerics, link);
  }
  if (type && "value" in type) {
    if (type.value && typeof type.value === "object" && "value" in type.value) {
      return getResponse(type.value.value);
    }
    return getResponse(String(type.value));
  }
  if (type && "type" in type && "name" in type && type.type) {
    return getResponse(type.name);
  }
  if (type && "name" in type) {
    return getResponse(type.name);
  }
  if (type && "type" in type) {
    return getResponse(type.type);
  }
  return getResponse("void");
};

export const getLinkedType = (
  name: string,
  type:
    | JSONOutput.ParameterReflection["type"]
    | JSONOutput.ReflectionType
    | JSONOutput.SomeType
    | JSONOutput.DeclarationReflection
    | undefined,
  packageLink: string,
  reflectionTree: Pick<JSONOutput.DeclarationReflection, "id" | "name" | "kind" | "kindString">[],
) => {
  if (packageLink && type) {
    const reflectedType = reflectionTree.find(
      (reflection) => ("id" in type && reflection.id === type.id) || ("name" in type && reflection.name === type.name),
    );
    if (reflectedType) {
      return getMdLinkedReference(name, packageLink, reflectedType);
    }
  }
  return name;
};

export const getType = (
  type:
    | JSONOutput.ParameterReflection["type"]
    | JSONOutput.ReflectionType
    | JSONOutput.SomeType
    | JSONOutput.SignatureReflection
    | undefined,
  packageLink: string,
  reflectionTree: Pick<JSONOutput.DeclarationReflection, "id" | "name" | "kind" | "kindString">[],
  showGenerics?: boolean,
  link?: boolean,
): string => {
  // T extends Something ? true : false
  if (type && "checkType" in type && type.checkType) {
    // References to types => T
    if ("objectType" in type.checkType && type.checkType.objectType) {
      return getTypeName(type.checkType.objectType, packageLink, reflectionTree, showGenerics, link);
    }
    return `${getTypeName(type.checkType, packageLink, reflectionTree, showGenerics, link)} extends ${getType(
      type.extendsType,
      packageLink,
      reflectionTree,
    )} ? ${getType(type.trueType, packageLink, reflectionTree, showGenerics, link)} : ${getType(
      type.falseType,
      packageLink,
      reflectionTree,
    )}`;
  }
  // SomeType[Indexed]
  if (type && "objectType" in type && type.objectType) {
    return `${getTypeName(type.objectType, packageLink, reflectionTree, showGenerics, link)}[${getTypeName(
      type.indexType,
      packageLink,
      reflectionTree,
      showGenerics,
      link,
    )}]`;
  }
  // Array<Something>
  if (type && "elementType" in type && type.elementType) {
    return `${getTypeName(type.elementType, packageLink, reflectionTree, showGenerics, link)}[]`;
  }
  // [string, string, number]
  if (type && "elements" in type && type.elements && type.type === "tuple") {
    return `[${type.elements
      .map((element) => getType(element, packageLink, reflectionTree, showGenerics, link))
      .join(", ")}]`;
  }
  // (some: number, thing: string) => void
  if (type && "kindString" in type && (type.kindString === "Call signature" || type.kindString === "Method")) {
    const params = type.parameters || [];
    return `(${params
      .map((param) => `${getParamName(param)}: ${getType(param.type, packageLink, reflectionTree, showGenerics, link)}`)
      .join(", ")}) => ${getType(type.type, packageLink, reflectionTree, showGenerics, link)}`;
  }
  // Some | Thing | void
  if (type && "types" in type && type.types) {
    // @ts-ignore compatibility issues (during build)
    return type.types.map((arg) => getType(arg, packageLink, reflectionTree, showGenerics, link)).join(" | ") || "";
  }
  if (type && "declaration" in type && type.declaration) {
    const declaration = type.declaration;
    // (some: Thing) => void
    if (declaration.signatures && declaration.signatures[0]) {
      const signature = declaration.signatures[0];
      return getType(signature, packageLink, reflectionTree, showGenerics, link);
    }
    // { some, thing }
    return `{'{'} ${declaration.children
      ?.map((arg) => {
        const signature = arg.signatures?.[0];
        // { some: (thing: number) => void }
        if (signature) {
          return `${getTypeName(arg, packageLink, reflectionTree, showGenerics, link)}: ${getType(
            signature,
            packageLink,
            reflectionTree,
            showGenerics,
            link,
          )}`;
        }
        return `${getTypeName(arg, packageLink, reflectionTree, showGenerics, link)}: ${getType(
          arg.type,
          packageLink,
          reflectionTree,
          showGenerics,
          link,
        )}`;
      })
      .join(", ")} {'}'}`;
  }
  // Something<Some, Thing>
  if (type && "typeArguments" in type && type.typeArguments?.length) {
    return `${getTypeName(type, packageLink, reflectionTree, true)}`;
  }
  // `${string}:${infer Param}/${infer Rest}`
  if (type?.type === "template-literal") {
    const template = type.tail
      .map((t) => "${" + getTypeName(t[0], packageLink, reflectionTree, showGenerics, link) + "}" + t[1])
      .join("");
    return "`" + template + "`";
  }
  // { [k in Param | keyof ExtractRouteParams<Rest>]: ParamType }
  if (type?.type === "mapped") {
    // NonNullable<Something>???? - check
    // if (type && "templateType" in type && type.templateType) {
    //   return getTypeName(type.templateType, packageLink, reflectionTree, showGenerics, link);
    // }
    return `[${type.parameter} in ${getType(type.parameterType, packageLink, reflectionTree, showGenerics, link)}]`;
  }
  return getTypeName(type, packageLink, reflectionTree, showGenerics, link);
};

// export const getTypeTable = (
//   type:
//     | JSONOutput.ParameterReflection["type"]
//     | JSONOutput.ReflectionType
//     | JSONOutput.SomeType
//     | JSONOutput.SignatureReflection
//     | undefined,
//   packageLink: string,
//   reflectionTree: Pick<JSONOutput.DeclarationReflection, "id" | "name" | "kind" | "kindString">[],
// ): [string, string, string][] => {
//   if (type?.type === "intersection") {
//     return type.types.map((t) => getTypeTable(t, packageLink, reflectionTree)).flat();
//   }

//   if (type && "id" in type && type.id) {
//     const refType = reflectionTree.find((reflection) => reflection.id === type.id);

//     if (refType) {
//       return getTypeTable(refType., packageLink, reflectionTree);
//     }
//   }

//   return [];
// };

// Params
export const getParamName = (parameter: JSONOutput.ParameterReflection | undefined, index?: number) => {
  if (parameter) {
    const paramName = parameter.name || "-";
    const paramIndex = index ? index + 1 : "";
    return paramName === "__namedParameters" ? `param${paramIndex}` : paramName;
  }

  return "";
};

export const getParamsNames = (parameters: JSONOutput.ParameterReflection[] | undefined) => {
  if (parameters) {
    let namedParameterCount = 0;
    return parameters.map((parameter) => {
      const paramName = getParamName(parameter, namedParameterCount);
      if (parameter.name === "__namedParameters") {
        namedParameterCount++;
      }
      return paramName;
    });
  }

  return [];
};
