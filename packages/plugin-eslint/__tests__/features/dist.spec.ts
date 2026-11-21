import tsParser from "@typescript-eslint/parser";
import { Linter } from "eslint";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Loads the published entry the way ESLint does, so packaging mistakes fail here and not in users' editors.
const require = createRequire(import.meta.url);
const packageRoot = path.resolve(__dirname, "../..");
const pluginPath = path.join(packageRoot, "dist/index.js");

// Older majors are installed under aliases. They have no bundled types, so describe only what the spec calls.
type LegacyLintResult = { messages: Linter.LintMessage[] };
type LegacyESLint = new (options: {
  useEslintrc: false;
  plugins: Record<string, unknown>;
  overrideConfig: Record<string, unknown>;
}) => { lintText: (code: string, options: { filePath: string }) => Promise<LegacyLintResult[]> };
const { ESLint: ESLint8 } = require("eslint-v8") as { ESLint: LegacyESLint };

const code = `
  import { createClient } from "@hyper-fetch/core";
  const client = createClient<{ eror: Error }>({ url: "/" });
  const getUser = client.createRequest<{ rsponse: User }>()({ endpoint: "/users" });
`;

const expectedMessages = [
  { ruleId: "hyper-fetch/client-generic-types", message: "Unexpected generic type(s) found: eror" },
  { ruleId: "hyper-fetch/request-generic-types", message: "Unexpected generic type(s) found: rsponse" },
];

const recommendedRules: Linter.RulesRecord = {
  "hyper-fetch/request-generic-types": "error",
  "hyper-fetch/client-generic-types": "error",
};

const toReports = (messages: Linter.LintMessage[]) => messages.map(({ ruleId, message }) => ({ ruleId, message }));

const lintWithLegacyConfig = async (parser: string) => {
  const eslint = new ESLint8({
    useEslintrc: false,
    plugins: { "hyper-fetch": require(pluginPath) },
    overrideConfig: {
      parser: require.resolve(parser),
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      extends: ["plugin:hyper-fetch/recommended-legacy"],
    },
  });
  const [result] = await eslint.lintText(code, { filePath: path.join(packageRoot, "check.ts") });
  return toReports(result.messages);
};

describe("Built plugin", () => {
  it("should report through ESLint 10 with the flat recommended config", () => {
    const plugin = require(pluginPath);
    const linter = new Linter();

    const messages = linter.verify(
      code,
      [{ files: ["**/*.ts"], languageOptions: { parser: tsParser } }, plugin.configs.recommended],
      "check.ts",
    );

    expect(toReports(messages)).toStrictEqual(expectedMessages);
  });

  it("should report through ESLint 10 with the rules registered by hand", () => {
    const plugin = require(pluginPath);
    const linter = new Linter();

    const messages = linter.verify(
      code,
      [
        {
          files: ["**/*.ts"],
          languageOptions: { parser: tsParser },
          plugins: { "hyper-fetch": plugin },
          rules: recommendedRules,
        },
      ],
      "check.ts",
    );

    expect(toReports(messages)).toStrictEqual(expectedMessages);
  });

  it("should accept the recommended preset next to a block that registers the plugin again", () => {
    const plugin = require(pluginPath);
    const linter = new Linter();

    const messages = linter.verify(
      code,
      [
        { files: ["**/*.ts"], languageOptions: { parser: tsParser } },
        plugin.configs.recommended,
        { plugins: { "hyper-fetch": plugin }, rules: { "hyper-fetch/client-generic-types": "warn" } },
      ],
      "check.ts",
    );

    expect(messages.map(({ ruleId, severity }) => ({ ruleId, severity }))).toStrictEqual([
      { ruleId: "hyper-fetch/client-generic-types", severity: 1 },
      { ruleId: "hyper-fetch/request-generic-types", severity: 2 },
    ]);
  });

  it("should export one plugin object to require and the recommended preset", () => {
    const plugin = require(pluginPath);

    expect(plugin.default).toBe(plugin);
    expect(plugin.configs.recommended.plugins["hyper-fetch"]).toBe(plugin);
    expect(plugin.meta).toStrictEqual({ name: "eslint-plugin-hyper-fetch", namespace: "hyper-fetch" });
    expect(plugin.configs.recommended.rules).toStrictEqual(recommendedRules);
    expect(plugin.configs["recommended-legacy"]).toStrictEqual({
      plugins: ["hyper-fetch"],
      rules: recommendedRules,
    });
  });

  it("should give Node's ESM import the same plugin as require, with named exports", () => {
    // Vitest transforms imports itself, so ask Node directly how an `eslint.config.mjs` sees the file.
    const script = `
      import plugin, { configs, meta, rules } from ${JSON.stringify(pathToFileURL(pluginPath).href)};
      import { createRequire } from "node:module";
      const required = createRequire(import.meta.url)(${JSON.stringify(pluginPath)});
      console.log(JSON.stringify({
        defaultIsRequired: plugin === required,
        presetHoldsPlugin: configs.recommended.plugins["hyper-fetch"] === plugin,
        namedMatch: rules === plugin.rules && configs === plugin.configs && meta === plugin.meta,
      }));
    `;
    const output = execFileSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf8" });

    expect(JSON.parse(output)).toStrictEqual({ defaultIsRequired: true, presetHoldsPlugin: true, namedMatch: true });
  });

  it("should report through ESLint 8 eslintrc with typescript-eslint 8", async () => {
    await expect(lintWithLegacyConfig("@typescript-eslint/parser")).resolves.toStrictEqual(expectedMessages);
  });

  it("should report through ESLint 8 eslintrc with typescript-eslint 7", async () => {
    await expect(lintWithLegacyConfig("typescript-eslint-parser-v7")).resolves.toStrictEqual(expectedMessages);
  });
});
