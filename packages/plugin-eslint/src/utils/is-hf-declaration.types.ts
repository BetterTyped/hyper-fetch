import type { TSESTree } from "@typescript-eslint/utils";

const importsToLookFor = new Set(["@hyper-fetch/core"]);

export const getIsHyperFetchDeclaration = () => {
  const defaultImports = new Set<string>();
  const clientImports = new Set<string>();

  return {
    hooks: {
      // Imports are hoisted, so read them all before any call is visited.
      Program: (program: TSESTree.Program) => {
        defaultImports.clear();
        clientImports.clear();

        program.body.forEach((node) => {
          if (node.type !== "ImportDeclaration" || !importsToLookFor.has(node.source.value)) {
            return;
          }

          node.specifiers.forEach((specifier) => {
            if (specifier.type === "ImportDefaultSpecifier" || specifier.type === "ImportNamespaceSpecifier") {
              defaultImports.add(specifier.local.name);
            }

            if (specifier.type !== "ImportSpecifier") {
              return;
            }

            // `import { "createClient" as make }` names the import with a string.
            const importedName =
              specifier.imported.type === "Identifier" ? specifier.imported.name : specifier.imported.value;

            if (importedName === "createClient") {
              clientImports.add(specifier.local.name);
            }
          });
        });
      },
    },
    isClientDeclaration: (node: TSESTree.CallExpression["callee"]) => {
      /**
       * import * as HF from "@hyper-fetch/core";
       *
       * const client = HF.createClient();
       */
      const isAccessedViaDefaultImport =
        node.type === "MemberExpression" &&
        node.object.type === "Identifier" &&
        defaultImports.has(node.object.name) &&
        !node.computed &&
        node.property.type === "Identifier" &&
        node.property.name === "createClient";

      /**
       * import { createClient } HF from "@hyper-fetch/core";
       *
       * const client = createClient();
       */
      const isDirectlyImported = node.type === "Identifier" && clientImports.has(node.name);

      return isAccessedViaDefaultImport || isDirectlyImported;
    },
  };
};
