import { JSONOutput, ReflectionKind } from "typedoc";

import { getReference, getSignature } from "./parsing.utils";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
type StringType = string | Record<string, string | StringType>;

function parens(element: string, needsParens?: boolean) {
  if (!needsParens) {
    return element;
  }

  return `(${element})`;
}

const getSignatureType = (
  reflection: JSONOutput.SignatureReflection,
  reflectionsTree: JSONOutput.ProjectReflection[],
  { useArrow }: { useArrow?: boolean },
) => {
  const params =
    reflection.parameters?.map((param) => {
      const paramName = param.name;
      const rest = param.flags?.isRest ? "..." : "";
      const optional = param.flags?.isOptional ? "?" : "";

      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return `${rest}${paramName}${optional}: ${objectToString(
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        getType(param.type, reflectionsTree, {
          deepScan: false,
        }),
        2,
      )}`;
    }) || [];

  const sign = useArrow ? " => " : ": ";

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return `(${params.join(", ")})${sign}${objectToString(
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getType(reflection.type, reflectionsTree, {
      deepScan: false,
    }),
    2,
  )}`;
};

const getTypeValue = (
  reflection: JSONOutput.DeclarationReflection,
): JSONOutput.DeclarationReflection => {
  const signature = getSignature(reflection);
  if (reflection.type && typeof reflection.type === "string") return reflection;
  if (reflection.type?.type && typeof reflection.type?.type === "string")
    return reflection.type as unknown as JSONOutput.DeclarationReflection;
  if (signature?.type && typeof signature.type === "string") return signature;
  if (signature?.type?.type && typeof signature?.type?.type === "string")
    return signature?.type as unknown as JSONOutput.DeclarationReflection;
  if (reflection.type)
    return getTypeValue(reflection.type as unknown as JSONOutput.DeclarationReflection);
  if (signature?.type)
    return getTypeValue(signature.type as unknown as JSONOutput.DeclarationReflection);
  return reflection;
};

const objectToString = (value: Record<string, StringType> | string, level = 0) => {
  if (typeof value === "string") return value;
  const addIndent = (spaces: number) => {
    let strOutput = "";
    for (let i = 0; i < spaces; i += 1) {
      strOutput += "  ";
    }
    return strOutput;
  };
  let strOutput = "";

  Object.keys(value).forEach((key) => {
    if (typeof value[key] === "object") {
      strOutput += `${addIndent(level + 1) + key}: `;
      strOutput += `${objectToString(value[key], level + 2)};\n`;
    } else {
      strOutput += `${addIndent(level + 1) + key}: ${value[key]};\n`;
    }
  });

  return `{\n${strOutput}${addIndent(level - 1)}}`.replace(/"/g, "");
};

export const getType = (
  reflection: JSONOutput.DeclarationReflection | JSONOutput.SomeType | undefined,
  reflectionsTree: JSONOutput.ProjectReflection[],
  options?: { needsParens?: boolean; deepScan?: boolean },
): StringType => {
  const { needsParens = false, deepScan = false } = options || {};
  if (!reflection) {
    return "";
  }

  switch (String(reflection.type)) {
    case "array": {
      const type = reflection as unknown as JSONOutput.ArrayType;
      const value = getType(type.elementType, reflectionsTree, { needsParens: true, deepScan });

      if (typeof value === "string") {
        return `${value}[]`;
      }

      return `${objectToString(value, 2)}[]`;
    }

    case "conditional": {
      const type = reflection as unknown as JSONOutput.ConditionalType;

      const checkType = getType(type.checkType, reflectionsTree, {
        needsParens: true,
        deepScan: false,
      });
      const extendsType = getType(type.extendsType, reflectionsTree, {
        needsParens: true,
        deepScan: false,
      });
      const trueType = getType(type.trueType, reflectionsTree, {
        needsParens: true,
        deepScan,
      });
      const falseType = getType(type.falseType, reflectionsTree, {
        needsParens: true,
        deepScan,
      });

      return parens(
        `${checkType} extends ${extendsType} ? ${objectToString(trueType, 2)} : ${objectToString(
          falseType,
          2,
        )}`,
        needsParens,
      );
    }

    case "indexedAccess": {
      const type = reflection as unknown as JSONOutput.IndexedAccessType;

      const objectType = getType(type.objectType, reflectionsTree, { needsParens: true, deepScan });
      const indexType = getType(type.indexType, reflectionsTree, {
        needsParens: true,
        deepScan: false,
      });

      if (objectType[indexType] && typeof objectType[indexType] === "string") {
        return `${objectType[indexType]}`;
      }

      return `${objectToString(objectType[indexType] || objectType, 2)}[${indexType}]`;
    }

    case "inferred": {
      const type = reflection as unknown as JSONOutput.InferredType;

      return `infer ${type.name}`;
    }

    case "intersection": {
      const type = reflection as unknown as JSONOutput.IntersectionType;

      let newType: Record<string, string> = {};
      type.types.forEach((t, index) => {
        const parsed = getType(t, reflectionsTree, { deepScan });
        if (typeof parsed === "string") {
          newType[`...params${index + 1}`] = parsed;
        } else {
          newType = { ...newType, ...parsed };
        }
      });
      return newType;
    }

    case "intrinsic": {
      const type = reflection as unknown as JSONOutput.IntrinsicType;

      return `${type.name}`;
    }

    case "literal": {
      const type = reflection as unknown as JSONOutput.LiteralType;

      return `${type.value}`;
    }

    case "mapped": {
      const type = reflection as unknown as unknown as JSONOutput.MappedType;

      const parameterType = getType(type.parameterType, reflectionsTree);
      const templateType = getType(type.templateType, reflectionsTree);
      const nameType = type.nameType
        ? ` as ${getType(type.nameType, reflectionsTree, { deepScan })}`
        : "";

      const optionalSymbol = type.optionalModifier === "+" ? "?:" : "";
      const minusSymbol = type.optionalModifier === "-" ? "-?:" : "";
      const requiredSymbol = !type.optionalModifier ? ":" : "";

      const symbol = optionalSymbol || minusSymbol || requiredSymbol;

      return `[${type.parameter} in ${parameterType}${nameType}]${symbol} ${templateType}`;
    }

    case "optional": {
      const type = reflection as unknown as JSONOutput.OptionalType;

      const elementType = getType(type.elementType, reflectionsTree, { deepScan });

      return `${elementType}?`;
    }

    case "predicate": {
      const type = reflection as unknown as JSONOutput.PredicateType;

      const targetType = type.targetType
        ? ` is ${getType(type.targetType, reflectionsTree, { deepScan })}`
        : "";
      const asserts = type.asserts ? "asserts " : "";

      return `${asserts} ${type.name}${targetType}`;
    }

    case "query": {
      const type = reflection as unknown as JSONOutput.QueryType;
      const queryType = getType(type.queryType, reflectionsTree, { deepScan });

      return `typeof ${queryType}`;
    }

    case "reference": {
      const type = reflection as unknown as JSONOutput.ReferenceType;
      const reference = getReference(reflectionsTree, type.id, type.name);

      const isDeepScanType =
        reference && [ReflectionKind.TypeAlias, ReflectionKind.Interface].includes(reference.kind);

      if (deepScan && reference && reference.type && isDeepScanType) {
        return getType(reference.type, reflectionsTree, { deepScan });
      }

      if (deepScan && type.typeArguments && type.name === "Omit") {
        const [baseType, ...args] = type.typeArguments;

        const types = getType(
          baseType.type as unknown as JSONOutput.ReferenceType,
          reflectionsTree,
          { deepScan },
        ) as Record<string, string>;

        args.forEach((arg) => {
          if ("value" in arg && arg.value && types[String(arg.value)]) {
            delete types[String(arg.value)];
          }
        });

        return types;
      }

      if (deepScan && type.typeArguments && type.name === "Pick") {
        const [baseType, ...args] = type.typeArguments;

        const types = getType(
          baseType.type as unknown as JSONOutput.ReferenceType,
          reflectionsTree,
          { deepScan },
        ) as Record<string, string>;

        Object.keys(types).forEach((key) => {
          const found = args.some((arg) => {
            if ("value" in arg && arg.value && arg.value === key) return true;
            return false;
          });
          if (found) {
            delete types[key];
          }
        });

        return types;
      }

      const typeArgs =
        type.typeArguments && type.typeArguments.length
          ? `<${type.typeArguments
              .map((t) =>
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                getTypePresentation(
                  t as unknown as JSONOutput.DeclarationReflection,
                  reflectionsTree,
                ),
              )
              .join(", ")}>`
          : "";

      return `${type.name}${typeArgs}`;
    }

    case "reflection": {
      const type = reflection as unknown as JSONOutput.ReflectionType;
      const decl = type.declaration;

      // object literal
      if (decl?.children && decl.children.length > 0) {
        let newType: Record<string, string> = {};
        decl.children.forEach((t) => {
          const parsed = t.type
            ? (getType(t.type, reflectionsTree, { deepScan }) as string)
            : "any";
          newType = { ...newType, [t.name]: parsed };
        });
        return newType;
      }

      if (decl?.signatures && decl.signatures.length === 1) {
        return getSignatureType(decl.signatures[0], reflectionsTree, { useArrow: true });
      }

      if (decl?.signatures && decl.signatures.length > 0) {
        let newType: Record<string, string> = {};
        decl.signatures.forEach((t, index) => {
          const parsed = getType(t, reflectionsTree, { deepScan });
          if (typeof parsed === "string") {
            newType[`...params${index + 1}`] = parsed;
          }
          newType = { ...newType, ...parsed };
        });
        return newType;
      }

      return "{}";
    }

    case "rest": {
      const type = reflection as unknown as JSONOutput.RestType;

      return `... ${getType(type.elementType, reflectionsTree, { deepScan })}`;
    }

    case "tuple": {
      const type = reflection as unknown as JSONOutput.TupleType;
      return `[${type.elements
        ?.map((t) => {
          const value = getType(t, reflectionsTree, { deepScan: false });
          return objectToString(value, 2);
        })
        .join(", ")}]`;
    }

    case "typeOperator": {
      const type = reflection as unknown as JSONOutput.TypeOperatorType;
      return `${type.operator} ${getType(type.target, reflectionsTree, { deepScan })}`;
    }

    case "union": {
      const type = reflection as unknown as JSONOutput.UnionType;

      return `${type.types
        .map((t) => JSON.stringify(getType(t, reflectionsTree, { deepScan })))
        .join(" | ")}`;
    }

    case "unknown": {
      const type = reflection as unknown as JSONOutput.UnknownType;

      return type.name;
    }

    case "named-tuple-member": {
      const type = reflection as unknown as unknown as JSONOutput.NamedTupleMemberType;

      return `${type.name}${type.isOptional ? "?:" : ":"} ${getType(type.element, reflectionsTree, {
        deepScan,
      })}`;
    }

    case "template-literal": {
      const type = reflection as unknown as unknown as JSONOutput.TemplateLiteralType;

      const head = type.head || "";
      const tail = type.tail.map(
        (t) => `$\{${getType(t[0], reflectionsTree, { deepScan: false })}}${t[1]}`,
      );

      return `\`${head}${tail}\``;
    }

    default: {
      return `void`;
    }
  }
};

export const getTypePresentation = (
  reflection: JSONOutput.DeclarationReflection,
  reflectionsTree: JSONOutput.ProjectReflection[],
) => {
  const typeValue = getTypeValue(reflection);

  const type = getType(typeValue, reflectionsTree, { deepScan: true });

  if (typeof type === "string") return type.replace(/"/g, "");

  const template = objectToString(type);

  return template;
};
