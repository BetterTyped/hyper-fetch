import { CallExpression, ImportDeclaration } from "@typescript-eslint/types/dist/generated/ast-spec";

const importsToLookFor: string[] = ["@hyper-fetch/core"];

export const getIsHyperFetchDeclaration = () => {
  const defaultImports = new Set<string>();
  const clientImports = new Set<string>();

  return {
    isClientDeclaration: (node: CallExpression["callee"]) => {
      /**
       * import * as HF from "@hyper-fetch/core";
       *
       * const client = HF.createClient();
       */
      const isAccessedViaDefaultImport =
        node.type === "MemberExpression" &&
        node.object.type === "Identifier" &&
        defaultImports.has(node.object.name) &&
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
    hooks: {
      ImportDeclaration: (node: ImportDeclaration) => {
        if (node.source.type !== "Literal" || typeof node.source.value !== "string") {
          return;
        }

        if (!importsToLookFor.includes(node.source.value)) {
          return;
        }

        node.specifiers.forEach((specifier) => {
          if (specifier.type === "ImportDefaultSpecifier" || specifier.type === "ImportNamespaceSpecifier") {
            defaultImports.add(specifier.local.name);
          }

          if (specifier.type === "ImportSpecifier" && specifier.imported.name === "createClient") {
            clientImports.add(specifier.local.name);
          }
        });
      },
      "Program:exit": () => {
        defaultImports.clear();
        clientImports.clear();
      },
    },
  };
};
