import type { TSESLint } from "@typescript-eslint/utils";
import type { ESLint, Linter } from "eslint";
import { defineConfig } from "eslint/config";

import hyperFetch, { configs } from "../../src";

// Assignments fail typecheck when a preset stops fitting the config types users write.
describe("Plugin types", () => {
  it("should fit ESLint's own plugin and config types", () => {
    const plugin: ESLint.Plugin = hyperFetch;
    const flatConfig: Linter.Config[] = [{ plugins: { "hyper-fetch": hyperFetch } }, configs.recommended];
    const legacyConfig: Linter.LegacyConfig = configs["recommended-legacy"];
    const defined = defineConfig(configs.recommended, { plugins: { "hyper-fetch": hyperFetch } });

    expect([plugin, flatConfig, legacyConfig, defined]).toHaveLength(4);
  });

  it("should fit typescript-eslint's plugin and config types", () => {
    const plugin: TSESLint.FlatConfig.Plugin = { meta: hyperFetch.meta, rules: hyperFetch.rules };
    const flatConfig: TSESLint.FlatConfig.ConfigArray = [
      { plugins: { "hyper-fetch": hyperFetch } },
      configs.recommended,
    ];
    const legacyConfig: TSESLint.ClassicConfig.Config = configs["recommended-legacy"];

    expect([plugin, flatConfig, legacyConfig]).toHaveLength(3);
  });
});
