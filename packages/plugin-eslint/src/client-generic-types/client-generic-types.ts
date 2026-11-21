/* eslint-disable @typescript-eslint/no-use-before-define */
import { ESLintUtils } from "@typescript-eslint/utils";
import {
  getEmptyGenerics,
  getNotMatchingGeneric,
  getTypeArguments,
  getUnexpectedGenerics,
} from "utils/generic-utilities.types";
import { getIsHyperFetchDeclaration } from "utils/is-hf-declaration.types";

// The Rule creator returns a function that is used to create a well-typed ESLint rule
// The parameter passed into RuleCreator is a URL generator function.
export const createRule = ESLintUtils.RuleCreator(
  (name) => `https://hyperfetch.bettertyped.com/docs/integrations/plugin-eslint/rules#${name}`,
);

/**
 * Rule for extending typescript possibilities for generic types with HyperFetch
 * @test https://astexplorer.net/
 */
export const clientGenericTypes = createRule({
  name: "client-generic-types",
  meta: {
    docs: {
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
          const typeArguments = getTypeArguments(node);
          const notMatchingGeneric = getNotMatchingGeneric({ typeArguments });

          if (notMatchingGeneric) {
            // skip other checks if format is incorrect
            return context.report({
              node,
              messageId: "notMatchingGenerics",
            });
          }

          if (typeArguments?.params[0].type === "TSTypeReference") {
            // doSomething<RequestType> are considered matching.
            // Do not check for unexpected generics in this case.
            return;
          }

          const unexpectedGenericElements = getUnexpectedGenerics({
            typeArguments,
            allowedGenerics: ["error"],
          });
          const isEmpty = getEmptyGenerics({ typeArguments });

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
