import { NewExpression } from "@typescript-eslint/types/dist/generated/ast-spec";

export function getUnexpectedGenerics({
  typeParameters,
  allowedGenerics,
}: {
  typeParameters: NewExpression["typeParameters"] | undefined;
  allowedGenerics: string[];
}) {
  /**
   * This is valid: doSomething({ endpoint: "/ping" });
   */
  if (!typeParameters) {
    return [];
  }

  // <{ ... }>
  const mainGenericParam = typeParameters.params[0];

  if (mainGenericParam && "members" in mainGenericParam) {
    return mainGenericParam.members
      .map((member) => {
        if ("key" in member) {
          if ("name" in member.key) {
            return member.key.name;
          }
          return member.type;
        }
        return member.type;
      })
      .filter((key) => !allowedGenerics.includes(key));
  }
  return [mainGenericParam.type];
}

export function getEmptyGenerics({ typeParameters }: { typeParameters: NewExpression["typeParameters"] | undefined }) {
  /**
   * This is valid: doSomething({ endpoint: "/ping" });
   */
  if (!typeParameters) {
    return false;
  }

  // <{ ... }>
  const mainGenericParam = typeParameters.params[0];

  if (mainGenericParam && "members" in mainGenericParam) {
    return !mainGenericParam.members.length;
  }
  return false;
}

export function getNotMatchingGeneric({
  typeParameters,
}: {
  typeParameters: NewExpression["typeParameters"] | undefined;
}) {
  /**
   * This is valid: doSomething({ endpoint: "/ping" });
   */
  if (!typeParameters) {
    return false;
  }

  // <{ ... }>
  const mainGenericParam = typeParameters.params[0];

  // doSomething<{ ... }> is a TSTypeLiteral, which is the valid case.
  if (mainGenericParam.type === "TSTypeLiteral") {
    return false;
  }

  // type RequestType = { queryParams: string }
  // doSomething<RequestType> are considered matching.
  if (mainGenericParam.type === "TSTypeReference") {
    return false;
  }

  // All other types, such as `doSomething<string>` (TSStringKeyword)  are considered not matching.
  return true;
}
