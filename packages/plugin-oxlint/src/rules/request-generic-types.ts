import type { CreateOnceRule } from "@oxlint/plugins";

import { checkGenericTypeArguments, messages } from "./rules.utils";

/** Keys accepted by the `createRequest` generic, mirrors `RequestGenericType` in `@hyper-fetch/core`. */
const allowedKeys: ReadonlySet<string> = new Set(["response", "payload", "error", "queryParams", "endpoint", "params"]);

/** Only a call with a generic can be wrong, so every other file skips AST deserialization. */
const genericCallPattern = /createRequest\s*</;

/**
 * Reports typos and unknown keys in the generic passed to `client.createRequest<{ ... }>()`.
 *
 * Files without a `createRequest<` call are skipped before oxlint deserializes their AST, which is
 * where nearly all of the rule's cost would go.
 */
export const requestGenericTypes: CreateOnceRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Validate the generic type passed to createRequest",
      url: "https://hyperfetch.bettertyped.com/docs/integrations/plugin-oxlint/rules#request-generic-types",
    },
    messages,
    schema: [],
  },
  createOnce(context) {
    return {
      before: () => genericCallPattern.test(context.sourceCode.text),
      CallExpression(node) {
        if (!node.typeArguments) {
          return;
        }

        const { callee } = node;
        if (
          callee.type !== "MemberExpression" ||
          callee.computed ||
          callee.property.type !== "Identifier" ||
          callee.property.name !== "createRequest"
        ) {
          return;
        }

        checkGenericTypeArguments({ context, node, method: "createRequest", allowedKeys });
      },
    };
  },
};
