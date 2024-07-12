import { RuleTester } from "@typescript-eslint/rule-tester";

import { requestGenericTypes } from "request-generic-types";

const ruleTester = new RuleTester({
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2015 },
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
ruleTester.run("client-generics-types", requestGenericTypes, {
  valid: [
    {
      code: "const someClient = createClient<{adapter: any}>();",
      options: [],
    },
    {
      code: "const someClient = createClient<{error: any}>();",
      options: [],
    },
    {
      code: "const someClient = createClient<{endpointMapper: any}>();",
      options: [],
    },
    {
      code: "const someClient = createClient<{error: any, adapter: any}>();",
      options: [],
    },
    {
      code: "const someClient = createClient<{adapter: any, endpointMapper: any}>();",
      options: [],
    },
    {
      code: "const someClient = createClient<{error: any, adapter: any}>();",
      options: [],
    },
    {
      code: "const someClient = createClient<{error: any, adapter: any, endpointMapper: any}>();",
      options: [],
    },
  ],
  invalid: [
    {
      // typo check
      code: "const someClient = createClient<{adapt: any}>();",
      options: [],
      errors: [{ messageId: "unexpectedGenerics", data: { items: "adapt" } }],
    },
    {
      // extending check
      code: "const someClient = createClient<{nonExisting: any}>();",
      errors: [{ messageId: "unexpectedGenerics", data: { items: "nonExisting" } }],
    },
    {
      // mixed check
      code: "const someClient = createClient<{adapter: any, nonExisting: any, error: any}>();",
      errors: [{ messageId: "unexpectedGenerics", data: { items: "nonExisting" } }],
    },
    {
      // empty check
      code: "const someClient = createClient<{}>();",
      errors: [{ messageId: "emptyGeneric" }],
    },
    {
      // not matching check
      code: "const someClient = createClient<string>();",
      errors: [{ messageId: "notMatchingGenerics" }],
    },
  ],
});
