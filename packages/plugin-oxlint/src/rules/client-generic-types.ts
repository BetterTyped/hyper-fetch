import type { CreateOnceRule } from "@oxlint/plugins";

import { checkGenericTypeArguments, messages } from "./rules.utils";

/** Keys accepted by the `createClient` generic, mirrors `ClientGenericType` in `@hyper-fetch/core`. */
const allowedKeys: ReadonlySet<string> = new Set(["error"]);

const coreModule = "@hyper-fetch/core";

/**
 * Reports typos and unknown keys in the generic passed to `createClient<{ ... }>()`.
 *
 * Only `createClient` imported from `@hyper-fetch/core` is checked, by name, alias or namespace
 * (`import * as HF` then `HF.createClient`). Files that do not mention both `@hyper-fetch/core` and
 * `createClient` are skipped before oxlint deserializes their AST, which is where nearly all of the
 * rule's cost would go.
 */
export const clientGenericTypes: CreateOnceRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Validate the generic type passed to createClient",
      url: "https://hyperfetch.bettertyped.com/docs/integrations/plugin-oxlint/rules#client-generic-types",
    },
    messages,
    schema: [],
  },
  createOnce(context) {
    // `createOnce` runs once and is reused for every file, so per-file state is reset in `before`.
    const namespaces = new Set<string>();
    const createClientNames = new Set<string>();

    return {
      before() {
        namespaces.clear();
        createClientNames.clear();
        const { text } = context.sourceCode;
        return text.includes(coreModule) && text.includes("createClient");
      },
      // Imports are hoisted, so read them all before any call is visited.
      Program(program) {
        for (const statement of program.body) {
          if (statement.type !== "ImportDeclaration" || statement.source.value !== coreModule) {
            continue;
          }

          for (const specifier of statement.specifiers) {
            if (specifier.type === "ImportSpecifier") {
              const { imported } = specifier;
              const importedName = imported.type === "Identifier" ? imported.name : imported.value;
              if (importedName === "createClient") {
                createClientNames.add(specifier.local.name);
              }
            } else {
              namespaces.add(specifier.local.name);
            }
          }
        }
      },
      CallExpression(node) {
        if (!node.typeArguments) {
          return;
        }

        const { callee } = node;
        const isCreateClient =
          callee.type === "Identifier"
            ? createClientNames.has(callee.name)
            : callee.type === "MemberExpression" &&
              callee.object.type === "Identifier" &&
              namespaces.has(callee.object.name) &&
              !callee.computed &&
              callee.property.type === "Identifier" &&
              callee.property.name === "createClient";

        if (isCreateClient) {
          checkGenericTypeArguments({ context, node, method: "createClient", allowedKeys });
        }
      },
    };
  },
};
