import type { TSESLint } from "@typescript-eslint/utils";
import { clientGenericTypes } from "client-generic-types";

import { requestGenericTypes } from "./request-generic-types/request-generic-types";

/**
 * Plugin name and the prefix of its rule ids (`hyper-fetch/<rule>`).
 */
export const meta = {
  name: "eslint-plugin-hyper-fetch",
  namespace: "hyper-fetch",
};

/**
 * Rules of the plugin. Register them under the `hyper-fetch` prefix.
 */
export const rules = {
  "request-generic-types": requestGenericTypes,
  "client-generic-types": clientGenericTypes,
};

const recommendedRules = {
  "hyper-fetch/request-generic-types": "error",
  "hyper-fetch/client-generic-types": "error",
} satisfies TSESLint.SharedConfig.RulesRecord;

type RecommendedRules = typeof recommendedRules;

/**
 * Presets of the plugin. See {@link configs}.
 */
export type HyperFetchConfigs = {
  recommended: {
    name: string;
    // Without `configs`, like typescript-eslint's `plugins` type, so the type does not refer to itself.
    plugins: { "hyper-fetch": Omit<HyperFetchPlugin, "configs"> };
    rules: RecommendedRules;
  };
  "recommended-legacy": {
    plugins: string[];
    rules: RecommendedRules;
  };
};

/**
 * A rule with its context and visitor types erased, so the plugin fits both ESLint's and typescript-eslint's config
 * types. Their rule types do not fit each other: typescript-eslint's visitors take `never`, ESLint's take `any[]`.
 */
export type HyperFetchPluginRule = {
  meta?: object;
  // A method, so its parameter is checked bivariantly against either linter's context type.
  // oxlint-disable-next-line typescript/method-signature-style, typescript/no-explicit-any
  create(context: unknown): any;
};

/**
 * The plugin object, the default export of `eslint-plugin-hyper-fetch`.
 */
export type HyperFetchPlugin = {
  meta: typeof meta;
  rules: Record<keyof typeof rules, HyperFetchPluginRule>;
  configs: HyperFetchConfigs;
};

/**
 * Presets of the plugin.
 *
 * - `recommended` is a flat config object (`eslint.config.*`, the only format of ESLint 10).
 * It registers the plugin and turns every rule on as `"error"`. Parse TypeScript files with typescript-eslint.
 * - `recommended-legacy` is the same preset for `.eslintrc.*` files, used as
 * `"extends": ["plugin:hyper-fetch/recommended-legacy"]`.
 *
 * @example
 * ```js
 * // eslint.config.mjs
 * import hyperFetch from "eslint-plugin-hyper-fetch";
 * import tseslint from "typescript-eslint";
 *
 * export default [
 *   { files: ["**\/*.{ts,tsx}"], languageOptions: { parser: tseslint.parser } },
 *   hyperFetch.configs.recommended,
 * ];
 * ```
 */
export const configs: HyperFetchConfigs = {
  recommended: {
    name: "hyper-fetch/recommended",
    plugins: {
      // Flat config throws "Cannot redefine plugin" when one name maps to two different objects. The preset returns the
      // very object users import, which the build also makes the module's `module.exports` (see vite.config.ts).
      get "hyper-fetch"() {
        return plugin;
      },
    },
    rules: recommendedRules,
  },
  "recommended-legacy": {
    plugins: ["hyper-fetch"],
    rules: recommendedRules,
  },
};

/**
 * The plugin object. Flat config takes it under `plugins: { "hyper-fetch": hyperFetch }`.
 */
const plugin: HyperFetchPlugin = { meta, rules, configs };

// Flat config users import the plugin as the default export.
// oxlint-disable-next-line import/no-default-export
export default plugin;
