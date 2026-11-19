import { Linter } from "eslint";
import { createRequire } from "node:module";
import path from "node:path";

// Loads the published entry the way ESLint does, so packaging mistakes fail here and not in users' editors.
const require = createRequire(import.meta.url);
const packageRoot = path.resolve(__dirname, "../..");

describe("Built plugin", () => {
  it("should load from dist and report through ESLint", () => {
    const plugin = require(path.join(packageRoot, "dist/index.js"));
    const linter = new Linter();
    linter.defineParser("typescript", require("@typescript-eslint/parser"));
    linter.defineRules({
      "hyper-fetch/client-generic-types": plugin.rules["client-generic-types"],
      "hyper-fetch/request-generic-types": plugin.rules["request-generic-types"],
    });

    const messages = linter.verify(
      `
        import { createClient } from "@hyper-fetch/core";
        const client = createClient<{ eror: Error }>({ url: "/" });
        const getUser = client.createRequest<{ rsponse: User }>()({ endpoint: "/users" });
      `,
      {
        parser: "typescript",
        parserOptions: { ecmaVersion: "latest", sourceType: "module" },
        rules: { "hyper-fetch/client-generic-types": "error", "hyper-fetch/request-generic-types": "error" },
      },
    );

    expect(messages.map(({ ruleId, message }) => ({ ruleId, message }))).toStrictEqual([
      { ruleId: "hyper-fetch/client-generic-types", message: "Unexpected generic type(s) found: eror" },
      { ruleId: "hyper-fetch/request-generic-types", message: "Unexpected generic type(s) found: rsponse" },
    ]);
    expect(plugin.configs.recommended.rules).toStrictEqual({
      "hyper-fetch/request-generic-types": "error",
      "hyper-fetch/client-generic-types": "error",
    });
  });
});
