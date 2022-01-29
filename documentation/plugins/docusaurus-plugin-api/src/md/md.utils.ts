import { JSONOutput } from "typedoc";

export const sanitizeHtml = (htmlString: string) => {
  return htmlString
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const flattenText = (value: string) => {
  return value.trim().replace(/(\r\n|\n|\r)/gm, "");
};

export const getStatusIcon = (tags: string[]) => {
  if (tags?.includes("alpha") || tags?.includes("beta")) {
    return "🚧 ";
  }
  if (tags?.includes("experimental")) {
    return "🧪 ";
  }

  return ``;
};

export const getMdBoldText = (value: string) => {
  return `<b>${value}</b>`;
};

export const getMdQuoteText = (value: string) => {
  return `<code>${sanitizeHtml(value)}</code>`;
};

export const getTypeName = (
  type:
    | JSONOutput.ParameterReflection["type"]
    | JSONOutput.ReflectionType
    | JSONOutput.SomeType
    | JSONOutput.DeclarationReflection
    | undefined,
  showGenerics = false,
): string => {
  let params = "";
  const infer = type?.type === "inferred" ? "infer" : "";
  const operator = (type && "operator" in type && type?.operator) || "";

  const preValue = infer || operator;
  const prefix = preValue ? preValue + " " : "";

  if (showGenerics && type && "typeParameter" in type && type.typeParameter) {
    params = `<${type.typeParameter.map((arg) => getTypeName(arg)).join(", ")}>`;
  }

  if (type && "target" in type) {
    return String(prefix + getTypeName(type.target) + params);
  }
  if (type && "value" in type) {
    return String(prefix + type.value + params);
  }
  if (type && "name" in type) {
    return String(prefix + type.name + params);
  }
  if (type && "type" in type) {
    return String(prefix + type.type + params);
  }
  return "void";
};

export const getType = (
  type:
    | JSONOutput.ParameterReflection["type"]
    | JSONOutput.ReflectionType
    | JSONOutput.SomeType
    | JSONOutput.SignatureReflection
    | undefined,
): string => {
  if (type && "checkType" in type && type.checkType && "objectType" in type.checkType && type.checkType.objectType) {
    return getTypeName(type.checkType.objectType);
  }
  if (type && "objectType" in type && type.objectType) {
    return getTypeName(type.objectType);
  }
  if (type && "elementType" in type && type.elementType) {
    // Something[]
    if (type.type === "array") {
      return `${getTypeName(type.elementType)}[]`;
    }
    return getTypeName(type.elementType);
  }
  // [string, string, number]
  if (type && "elements" in type && type.elements && type.type === "tuple") {
    return `[${type.elements.map((element) => getType(element)).join(", ")}]`;
  }
  // (some: number, thing: string) => void
  if (type && "kindString" in type && type.kindString === "Call signature") {
    const params = type.parameters || [];
    return `(${params.map((param) => getParamName(param)).join(", ")}) => ${getType(type.type)}`;
  }
  // Some | Thing | void
  if (type && "types" in type && type.types) {
    // @ts-ignore compatibility issues (during build)
    return type.types.map((arg) => getType(arg)).join(" | ") || "";
  }
  if (type && "declaration" in type && type.declaration) {
    const declaration = type.declaration;
    // (some: Thing) => void
    if (declaration.signatures && declaration.signatures[0]) {
      const signature = declaration.signatures[0];
      return getType(signature);
    }
    // { some, thing }
    return `{ ${declaration.children
      ?.map((arg) => {
        const signature = arg.signatures?.[0];
        // { some: (thing: number) => void }
        if (signature) {
          return `${getTypeName(arg)}: ${getType(signature)}`;
        }
        return `${getTypeName(arg)}: ${getType(arg.type)}`;
      })
      .join(", ")} }`;
  }
  // Something<Some, Thing>
  if (type && "typeArguments" in type && type.typeArguments?.length) {
    return `${getTypeName(type)}<${type.typeArguments.map((arg) => getType(arg)).join(", ")}>`;
  }
  // T extends Something ? T : never
  if (type?.type === "conditional") {
    return `${getTypeName(type.checkType)} extends ${getType(type.extendsType)} ? ${getType(type.trueType)} : ${getType(
      type.falseType,
    )}`;
  }
  // `${string}:${infer Param}/${infer Rest}`
  if (type?.type === "template-literal") {
    const template = type.tail.map((t) => "${" + getTypeName(t[0]) + "}" + t[1]).join("");
    return "`" + template + "`";
  }
  //  { [k in Param | keyof ExtractRouteParams<Rest>]: ParamType }
  if (type?.type === "mapped") {
    return `[${type.parameter} in ${getType(type.parameterType)}]`;
  }
  return getTypeName(type);
};

// {
//   "id": 350,
//   "name": "CacheStorageAsyncType",
//   "kind": 4194304,
//   "kindString": "Type alias",
//   "flags": {},
//   "sources": [
//     {
//       "fileName": "cache/cache.types.ts",
//       "line": 42,
//       "character": 12
//     }
//   ],
//   "type": {
//     "type": "reflection",
//     "declaration": {
//       "id": 351,
//       "name": "__type",
//       "kind": 65536,
//       "kindString": "Type literal",
//       "flags": {},
//       "children": [
//         {
//           "id": 364,
//           "name": "clear",
//           "kind": 2048,
//           "kindString": "Method",
//           "flags": {},
//           "sources": [
//             {
//               "fileName": "cache/cache.types.ts",
//               "line": 46,
//               "character": 2
//             }
//           ],
//           "signatures": [
//             {
//               "id": 365,
//               "name": "clear",
//               "kind": 4096,
//               "kindString": "Call signature",
//               "flags": {},
//               "type": {
//                 "type": "reference",
//                 "typeArguments": [
//                   {
//                     "type": "intrinsic",
//                     "name": "void"
//                   }
//                 ],
//                 "qualifiedName": "Promise",
//                 "package": "typescript",
//                 "name": "Promise"
//               }
//             }
//           ]
//         },
//       ]

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
