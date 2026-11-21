import type { TSESTree } from "@typescript-eslint/utils";

type TypeArguments = TSESTree.TSTypeParameterInstantiation;
type GenericType = TypeArguments["params"][number];
type GenericMember = TSESTree.TSTypeLiteral["members"][number];

/**
 * Object parts of a generic: the literal itself, or each literal of an intersection
 * such as `GqlResponse<User> & { payload: Input }`. Type references are left to TypeScript.
 */
const getObjectParts = (generic: GenericType): TSESTree.TSTypeLiteral[] => {
  if (generic.type === "TSTypeLiteral") {
    return [generic];
  }
  if (generic.type === "TSIntersectionType") {
    return generic.types.filter((part): part is TSESTree.TSTypeLiteral => part.type === "TSTypeLiteral");
  }
  return [];
};

/**
 * Generics passed to a call, as in `createRequest<{ response: User }>()`.
 * typescript-eslint 6 and newer put them on `typeArguments`. Older parsers set only `typeParameters`,
 * which typescript-eslint 8 removed, so both are read.
 */
export const getTypeArguments = (node: TSESTree.CallExpression): TypeArguments | undefined => {
  if (node.typeArguments) {
    return node.typeArguments;
  }
  const legacyNode: TSESTree.CallExpression & { typeParameters?: TypeArguments } = node;
  return legacyNode.typeParameters;
};

const getMemberName = (member: GenericMember) => {
  if ("key" in member) {
    if (!member.computed && member.key.type === "Identifier") {
      return member.key.name;
    }
    if (member.key.type === "Literal") {
      return String(member.key.value);
    }
  }
  return member.type;
};

export function getUnexpectedGenerics({
  typeArguments,
  allowedGenerics,
}: {
  typeArguments: TypeArguments | undefined;
  allowedGenerics: string[];
}) {
  /**
   * This is valid: doSomething({ endpoint: "/ping" });
   */
  if (!typeArguments) {
    return [];
  }

  // <{ ... }>
  const mainGenericParam = typeArguments.params[0];

  if (mainGenericParam.type !== "TSTypeLiteral" && mainGenericParam.type !== "TSIntersectionType") {
    return [mainGenericParam.type];
  }

  return getObjectParts(mainGenericParam)
    .flatMap((part) => part.members.map(getMemberName))
    .filter((key) => !allowedGenerics.includes(key));
}

export function getEmptyGenerics({ typeArguments }: { typeArguments: TypeArguments | undefined }) {
  /**
   * This is valid: doSomething({ endpoint: "/ping" });
   */
  if (!typeArguments) {
    return false;
  }

  // <{ ... }>
  const mainGenericParam = typeArguments.params[0];

  if (mainGenericParam && "members" in mainGenericParam) {
    return mainGenericParam.members.length === 0;
  }
  return false;
}

export function getNotMatchingGeneric({ typeArguments }: { typeArguments: TypeArguments | undefined }) {
  /**
   * This is valid: doSomething({ endpoint: "/ping" });
   */
  if (!typeArguments) {
    return false;
  }

  // <{ ... }>
  const mainGenericParam = typeArguments.params[0];

  // doSomething<{ ... }> is a TSTypeLiteral, which is the valid case.
  if (mainGenericParam.type === "TSTypeLiteral") {
    return false;
  }

  // type RequestType = { queryParams: string }
  // doSomething<RequestType> are considered matching.
  if (mainGenericParam.type === "TSTypeReference") {
    return false;
  }

  // doSomething<Base & { ... }> matches when every part is an object literal or a reference.
  if (mainGenericParam.type === "TSIntersectionType") {
    return mainGenericParam.types.some((part) => part.type !== "TSTypeLiteral" && part.type !== "TSTypeReference");
  }

  // All other types, such as `doSomething<string>` (TSStringKeyword)  are considered not matching.
  return true;
}
