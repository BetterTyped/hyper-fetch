/* eslint-disable @typescript-eslint/no-use-before-define */
import { ESLintUtils } from "@typescript-eslint/utils";
import { NewExpression } from "@typescript-eslint/types/dist/generated/ast-spec";

// The Rule creator returns a function that is used to create a well-typed ESLint rule
// The parameter passed into RuleCreator is a URL generator function.
export const createRule = ESLintUtils.RuleCreator((name) => `https://my-website.io/eslint/${name}`);

/**
 * Rule for extending typescript possibilities for generic types with HyperFetch
 * @test https://astexplorer.net/
 */
export const clientGenericTypes = createRule({
  name: "client-generic-types",
  meta: {
    docs: {
      recommended: "error",
      description: "Rules extending HyperFetch possibilities for generic types",
    },
    type: "problem",
    messages: {
      emptyGeneric: "Generic type provided to createClient is empty",
      unexpectedGenerics: "Unexpected generic type(s) found: {{ items }}",
      notMatchingGenerics: "Generic type provided to createClient is not matching the expected object-like format",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee &&
          "property" in node.callee &&
          "name" in node.callee.property &&
          node.callee.property.name === "createRequest"
        ) {
          const typeParameters = "typeParameters" in node ? node.typeParameters : undefined;
          const notMatchingGeneric = getNotMatchingGeneric({ typeParameters });

          if (notMatchingGeneric) {
            // skip other checks if format is incorrect
            return context.report({
              node,
              messageId: "notMatchingGenerics",
            });
          }

          const unexpectedGenericElements = getUnexpectedGenerics({ typeParameters });
          const isEmpty = getEmptyGenerics({ typeParameters });

          if (unexpectedGenericElements.length) {
            context.report({
              node,
              messageId: "unexpectedGenerics",
              data: {
                items: unexpectedGenericElements.join(", "),
              },
            });
          }

          if (isEmpty) {
            context.report({
              node,
              messageId: "emptyGeneric",
            });
          }
        }
      },
    };
  },
});

/* -------------------------------------------------------------------------------------------------
 * Utilities
 * -----------------------------------------------------------------------------------------------*/

function getUnexpectedGenerics({ typeParameters }: { typeParameters: NewExpression["typeParameters"] | undefined }) {
  const allowedGenerics = ["adapter", "error", "endpointMapper"];

  if (!typeParameters) {
    /**
     * This is valid: createClient();
     */
    return [];
  }

  // createClient<{ ... }>
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

function getEmptyGenerics({ typeParameters }: { typeParameters: NewExpression["typeParameters"] | undefined }) {
  if (!typeParameters) {
    /**
     * This is valid: createClient();
     */
    return false;
  }

  // createClient<{ ... }>
  const mainGenericParam = typeParameters.params[0];

  if (mainGenericParam && "members" in mainGenericParam) {
    // createClient<{}> is invalid
    return !mainGenericParam.members.length;
  }
  return false;
}

function getNotMatchingGeneric({ typeParameters }: { typeParameters: NewExpression["typeParameters"] | undefined }) {
  if (!typeParameters) {
    /**
     * This is valid: createClient();
     */
    return false;
  }

  // createClient<{ ... }>
  const mainGenericParam = typeParameters.params[0];

  // createClient<{}> is valid
  if (mainGenericParam && "members" in mainGenericParam) {
    return false;
  }
  // createClient<string> is invalid
  return true;
}
