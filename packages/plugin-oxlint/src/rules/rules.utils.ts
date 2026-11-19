import type { Context, ESTree } from "@oxlint/plugins";

export const messages = {
  emptyGeneric: "Generic type provided to {{ method }} is empty",
  unexpectedGenerics: "Unexpected generic type(s) found: {{ items }}",
  notMatchingGenerics: "Generic type provided to {{ method }} is not matching the expected object-like format",
};

const getMemberName = (member: ESTree.TSSignature, context: Context) => {
  if (member.type === "TSPropertySignature" || member.type === "TSMethodSignature") {
    const { key } = member;
    if (!member.computed && key.type === "Identifier") {
      return key.name;
    }
    if (key.type === "Literal") {
      return String(key.value);
    }
  }
  return context.sourceCode.getText(member);
};

/**
 * Validates the first generic passed to a HyperFetch factory such as `createRequest<{ ... }>()`.
 *
 * - An inline object type must be non-empty and only use `allowedKeys`.
 * - A type reference (`createRequest<RequestType>()`) is trusted, TypeScript checks it against the constraint.
 * - An intersection (`createRequest<Base & { payload: Data }>()`) is checked part by part.
 * - Any other type (`createRequest<string>()`) is reported as not matching.
 */
export const checkGenericTypeArguments = ({
  context,
  node,
  method,
  allowedKeys,
}: {
  context: Context;
  node: ESTree.CallExpression;
  method: string;
  allowedKeys: ReadonlySet<string>;
}) => {
  const generic = node.typeArguments?.params[0];
  if (!generic || generic.type === "TSTypeReference") {
    return;
  }

  if (generic.type === "TSTypeLiteral" && generic.members.length === 0) {
    context.report({ node, messageId: "emptyGeneric", data: { method } });
    return;
  }

  const parts = generic.type === "TSIntersectionType" ? generic.types : [generic];
  let unexpected: string[] | undefined;

  for (const part of parts) {
    if (part.type === "TSTypeReference") {
      continue;
    }
    if (part.type !== "TSTypeLiteral") {
      context.report({ node, messageId: "notMatchingGenerics", data: { method } });
      return;
    }
    for (const member of part.members) {
      const name = getMemberName(member, context);
      if (!allowedKeys.has(name)) {
        (unexpected ??= []).push(name);
      }
    }
  }

  if (unexpected) {
    context.report({ node, messageId: "unexpectedGenerics", data: { items: unexpected.join(", ") } });
  }
};
