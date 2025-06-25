/* eslint-disable @typescript-eslint/no-use-before-define */
import { ESLintUtils } from "@typescript-eslint/utils";

import { getIsHyperFetchDeclaration } from "utils/is-hf-declaration.types";
import { getEmptyGenerics, getNotMatchingGeneric, getUnexpectedGenerics } from "utils/generic-utilities.types";

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
    const { isClientDeclaration, hooks } = getIsHyperFetchDeclaration();

    return {
      ...hooks,
      CallExpression(node) {
        if (isClientDeclaration(node.callee)) {
          const typeParameters = "typeParameters" in node ? node.typeParameters : undefined;
          const notMatchingGeneric = getNotMatchingGeneric({ typeParameters });

          if (notMatchingGeneric) {
            // skip other checks if format is incorrect
            return context.report({
              node,
              messageId: "notMatchingGenerics",
            });
          }

          if (typeParameters?.params[0].type === "TSTypeReference") {
            // doSomething<RequestType> are considered matching.
            // Do not check for unexpected generics in this case.
            return;
          }

          const unexpectedGenericElements = getUnexpectedGenerics({
            typeParameters,
            allowedGenerics: ["error"],
          });
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
