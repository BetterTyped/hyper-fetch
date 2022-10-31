import { JSONOutput, ReflectionKind } from "typedoc";

import { getReference, getSignature } from "./parsing.utils";

function parens(element: string, needsParens?: boolean) {
  if (!needsParens) {
    return element;
  }

  return `(${element})`;
}

type StringType = string | Record<string, string | StringType>;

export const getType = (
  reflection: JSONOutput.DeclarationReflection | JSONOutput.SomeType,
  reflectionsTree: JSONOutput.DeclarationReflection[],
  options?: { needsParens?: boolean; deepScan?: boolean },
): StringType => {
  const { needsParens, deepScan } = options || {};
  if (!reflection) {
    return "";
  }

  switch (String(reflection.type)) {
    case "array": {
      const type = reflection as unknown as JSONOutput.ArrayType;

      return `${getType(type.elementType, reflectionsTree, { needsParens: true, deepScan })}[]`;
    }

    case "conditional": {
      const type = reflection as unknown as JSONOutput.ConditionalType;

      const checkType = getType(type.checkType, reflectionsTree, { needsParens: true, deepScan });
      const extendsType = getType(type.extendsType, reflectionsTree, {
        needsParens: true,
        deepScan,
      });
      const trueType = getType(type.trueType, reflectionsTree, { needsParens: true, deepScan });
      const falseType = getType(type.falseType, reflectionsTree, { needsParens: true, deepScan });

      return parens(
        `${checkType} extends ${extendsType} ? ${trueType} : ${falseType}`,
        needsParens,
      );
    }

    case "indexedAccess": {
      const type = reflection as unknown as JSONOutput.IndexedAccessType;

      const objectType = getType(type.objectType, reflectionsTree, { needsParens: true, deepScan });
      const indexType = getType(type.indexType, reflectionsTree, { needsParens: true, deepScan });

      return `${objectType}[${indexType}]`;
    }

    case "inferred": {
      const type = reflection as unknown as JSONOutput.InferredType;

      return `infer ${type.name}`;
    }

    case "intersection": {
      const type = reflection as unknown as JSONOutput.IntersectionType;

      let newType: Record<string, string> = {};
      type.types.forEach((t) => {
        const parsed = getType(t, reflectionsTree, { deepScan }) as Record<string, string>;
        newType = { ...newType, ...parsed };
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
      const reference = type.id ? getReference(type.id, reflectionsTree) : null;

      if (!reference) return type.name;

      const isDeepScanType = [ReflectionKind.TypeAlias, ReflectionKind.Interface].includes(
        reference.kind,
      );

      if (deepScan && reference.type && isDeepScanType) {
        return getType(reference.type, reflectionsTree, { deepScan });
      }

      return type.name;
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
        return `${getType(decl.signatures[0], reflectionsTree)}`;
      }

      if (decl?.signatures && decl.signatures.length > 0) {
        let newType: Record<string, string> = {};
        decl.signatures.forEach((t) => {
          const parsed = getType(t, reflectionsTree, { deepScan }) as Record<string, string>;
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
      return `[${type.elements?.map((t) => getType(t, reflectionsTree, { deepScan }))}]`;
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
      const tail = type.tail.map((t) => `$\{${t[0]}}${t[1]}`);

      return `\`${head}${tail}\``;
    }

    default: {
      return `void`;
    }
  }
};

const getTypeValue = (
  reflection: JSONOutput.DeclarationReflection,
): JSONOutput.DeclarationReflection => {
  const signature = getSignature(reflection);
  if (reflection.type && typeof reflection.type === "string") return reflection;
  if (reflection.type?.type && typeof reflection.type?.type === "string")
    return reflection.type as unknown as JSONOutput.DeclarationReflection;
  if (signature?.type && typeof signature.type === "string") return signature;
  if (reflection.type)
    return getTypeValue(reflection.type as unknown as JSONOutput.DeclarationReflection);
  if (signature?.type)
    return getTypeValue(signature.type as unknown as JSONOutput.DeclarationReflection);
  return reflection;
};

export const getTypePresentation = (
  reflection: JSONOutput.DeclarationReflection,
  reflectionsTree: JSONOutput.DeclarationReflection[],
) => {
  const typeValue = getTypeValue(reflection);

  const type = getType(typeValue, reflectionsTree, { deepScan: true });

  if (typeof type === "string") return type;

  const template = JSON.stringify(type, null, 4);

  return template;
};
