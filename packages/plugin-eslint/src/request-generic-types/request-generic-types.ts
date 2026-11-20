/* eslint-disable @typescript-eslint/no-use-before-define */
import { ESLintUtils } from "@typescript-eslint/utils";
import {
  getEmptyGenerics,
  getNotMatchingGeneric,
  getTypeArguments,
  getUnexpectedGenerics,
} from "utils/generic-utilities.types";

// The Rule creator returns a function that is used to create a well-typed ESLint rule
// The parameter passed into RuleCreator is a URL generator function.
export const createRule = ESLintUtils.RuleCreator(
  (name) => `https://hyperfetch.bettertyped.com/docs/integrations/plugin-eslint/rules#${name}`,
);

/**
 * Rule for extending typescript possibilities for generic types with HyperFetch
 * @test https://astexplorer.net/
 */
export const requestGenericTypes = createRule({
  name: "request-generic-types",
  meta: {
    docs: {
      description: "Rules extending HyperFetch possibilities for generic types",
    },
    type: "problem",
    messages: {
      emptyGeneric: "Generic type provided to createRequest is empty",
      unexpectedGenerics: "Unexpected generic type(s) found: {{ items }}",
      notMatchingGenerics: "Generic type provided to createRequest is not matching the expected object-like format",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === "MemberExpression" &&
          !node.callee.computed &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "createRequest"
        ) {
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
            allowedGenerics: ["response", "queryParams", "error", "payload", "endpoint", "params"],
          });
          const isEmpty = getEmptyGenerics({ typeArguments });

          if (unexpectedGenericElements.length > 0) {
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
