import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { clientGenericTypes } from "client-generic-types";

const ruleTester = new RuleTester({
  languageOptions: { parser: tsParser },
});

ruleTester.run("client-generics-types", clientGenericTypes, {
  valid: [
    {
      code: `
      import { createClient } from "@hyper-fetch/core";
      const someClient = createClient<{error: any}>();
      `,
      options: [],
    },
    {
      code: `
      import { createClient } from "other-lib";
      const someClient = createClient<{foo: any, bar: any, baz: any}>();
      `,
      options: [],
    },
    {
      code: `
      import { createClient } from "other-lib";
      const someClient = createClient<number>();
      `,
      options: [],
    },
    {
      code: `
      const someClient = createClient<boolean>();
      `,
      options: [],
    },
    {
      code: `
      import { createClient } from "@hyper-fetch/core";
      const someClient = createClient<BaseClient & { error: ApiError }>();
      `,
      options: [],
    },
  ],
  invalid: [
    {
      // an import named with a string is the same createClient
      code: `
      import { "createClient" as makeClient } from "@hyper-fetch/core";
      const someClient = makeClient<{eror: any}>();`,
      errors: [{ messageId: "unexpectedGenerics", data: { items: "eror" } }],
    },
    {
      // imports are hoisted, a call above the import is still a HyperFetch client
      code: `
      const someClient = createClient<{eror: any}>();
      import { createClient } from "@hyper-fetch/core";`,
      errors: [{ messageId: "unexpectedGenerics", data: { items: "eror" } }],
    },
    {
      // unknown key inside an intersection
      code: `
      import { createClient } from "@hyper-fetch/core";
      const someClient = createClient<BaseClient & { eror: any }>();`,
      errors: [{ messageId: "unexpectedGenerics", data: { items: "eror" } }],
    },
    {
      // typo check
      code: `
      import { createClient } from "@hyper-fetch/core";
      const someClient = createClient<{adapt: any}>();`,
      options: [],
      errors: [{ messageId: "unexpectedGenerics", data: { items: "adapt" } }],
    },
    {
      // extending check
      code: `
      import { createClient } from "@hyper-fetch/core";
      const someClient = createClient<{nonExisting: any}>();`,
      errors: [{ messageId: "unexpectedGenerics", data: { items: "nonExisting" } }],
    },
    {
      // empty check
      code: `
      import { createClient } from "@hyper-fetch/core";
      const someClient = createClient<{}>();`,
      errors: [{ messageId: "emptyGeneric" }],
    },
    {
      // not matching check
      code: `
      import { createClient } from "@hyper-fetch/core";
      const someClient = createClient<string>();`,
      errors: [{ messageId: "notMatchingGenerics" }],
    },
  ],
});
