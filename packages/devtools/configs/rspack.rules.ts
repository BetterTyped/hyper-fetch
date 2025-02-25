import type { ModuleOptions } from "@rspack/core";

import { isDevelopment } from "./rspack.env";
import { appSrcPath } from "./utils";

const swcLoaderOptions = (syntax: "typescript" | "ecmascript") => {
  return {
    module: {
      type: "es6",
      ignoreDynamic: true,
    },
    jsc: {
      parser:
        syntax === "typescript"
          ? {
              syntax: "typescript",
              tsx: true,
              dynamicImport: true,
              decorators: true,
              baseUrl: "./src",
            }
          : {
              syntax: "ecmascript",
              jsx: true,
              numericSeparator: true,
              classPrivateProperty: true,
              privateMethod: true,
              classProperty: true,
              functionBind: true,
              decorators: true,
              decoratorsBeforeExport: true,
              exportDefaultFrom: true,
              exportNamespaceFrom: true,
              dynamicImport: true,
              nullishCoalescing: true,
              optionalChaining: true,
              importMeta: true,
              topLevelAwait: true,
              importAssertions: true,
            },
      target: "es5",
      // false:正常模式尽可能地遵循 ECMAScript 6 的语义 true:松散模式产生更简单的 ES5 代码
      loose: false,
      externalHelpers: true,
      transform: {
        legacyDecorator: true,
        react: {
          runtime: "automatic",
          pragma: "React.createElement",
          pragmaFrag: "React.Fragment",
          throwIfNamespace: true,
          development: isDevelopment,
          useBuiltins: true,
          refresh: false,
        },
      },
    },
  };
};

export const rules: Required<ModuleOptions>["rules"] = [
  // Add support for native node modules
  {
    // We're specifying native_modules in the test because the asset relocator loader generates a
    // "fake" .node file which is really a cjs file.
    test: /native_modules[/\\].+\.node$/,
    use: "node-loader",
  },
  {
    test: /\.tsx?$/,
    loader: "builtin:swc-loader",
    include: appSrcPath,
    options: swcLoaderOptions("typescript"),
  },
  {
    test: /\.(js|mjs|jsx)$/,
    loader: "builtin:swc-loader",
    include: appSrcPath,
    options: swcLoaderOptions("ecmascript"),
  },
];
