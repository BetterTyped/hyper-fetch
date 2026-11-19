import { RuleTester } from "oxlint/plugins-dev";

import { clientGenericTypes } from "../../src";

const ruleTester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" }, sourceType: "module" } });

const named = `import { createClient } from "@hyper-fetch/core";`;

ruleTester.run("client-generic-types", clientGenericTypes, {
  valid: [
    `${named} const client = createClient<{error: any}>();`,
    `${named} const client = createClient<{"error": any}>();`,
    `${named} const client = createClient<ClientType>();`,
    `${named} const client = createClient<BaseClient & { error: ApiError }>();`,
    `${named} const client = createClient({ url: "/" });`,
    // createClient from another library.
    `import { createClient } from "other-lib"; const client = createClient<{foo: any}>();`,
    `import { createClient } from "other-lib"; const client = createClient<number>();`,
    // Not imported at all.
    "const client = createClient<boolean>();",
    // Imported under an alias, the original name is someone else's.
    `import { createClient as create } from "@hyper-fetch/core"; const client = createClient<{foo: any}>();`,
    // Namespace without createClient.
    `import * as HF from "@hyper-fetch/core"; const client = HF.createSomething<{foo: any}>();`,
    // Other imports from core.
    `import { Client } from "@hyper-fetch/core"; const client = createClient<{foo: any}>();`,
  ],
  invalid: [
    {
      name: "typo",
      code: `${named} const client = createClient<{eror: any}>();`,
      errors: [{ messageId: "unexpectedGenerics", data: { items: "eror" } }],
    },
    {
      name: "unknown key",
      code: `${named} const client = createClient<{adapter: any, error: any}>();`,
      errors: [{ messageId: "unexpectedGenerics", data: { items: "adapter" } }],
    },
    {
      name: "empty object",
      code: `${named} const client = createClient<{}>();`,
      errors: [{ messageId: "emptyGeneric", data: { method: "createClient" } }],
    },
    {
      name: "keyword type",
      code: `${named} const client = createClient<string>();`,
      errors: [{ messageId: "notMatchingGenerics", data: { method: "createClient" } }],
    },
    {
      name: "unknown key in an intersection",
      code: `${named} const client = createClient<BaseClient & { eror: ApiError }>();`,
      errors: [{ messageId: "unexpectedGenerics", data: { items: "eror" } }],
    },
    {
      name: "aliased import",
      code: `import { createClient as create } from "@hyper-fetch/core"; const client = create<{eror: any}>();`,
      errors: [{ messageId: "unexpectedGenerics", data: { items: "eror" } }],
    },
    {
      name: "string import name",
      code: `import { "createClient" as create } from "@hyper-fetch/core"; const client = create<{eror: any}>();`,
      errors: [{ messageId: "unexpectedGenerics", data: { items: "eror" } }],
    },
    {
      name: "namespace import",
      code: `import * as HF from "@hyper-fetch/core"; const client = HF.createClient<{eror: any}>();`,
      errors: [{ messageId: "unexpectedGenerics", data: { items: "eror" } }],
    },
    {
      name: "default import",
      code: `import HF from "@hyper-fetch/core"; const client = HF.createClient<{eror: any}>();`,
      errors: [{ messageId: "unexpectedGenerics", data: { items: "eror" } }],
    },
    {
      name: "use before the import",
      code: `const client = createClient<{eror: any}>(); ${named}`,
      errors: [{ messageId: "unexpectedGenerics", data: { items: "eror" } }],
    },
  ],
});
