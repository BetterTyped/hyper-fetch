import { RuleTester } from "@typescript-eslint/rule-tester";

import { requestGenericTypes } from "request-generic-types";

const ruleTester = new RuleTester({
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2015 },
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
ruleTester.run("request-generics-types", requestGenericTypes, {
  valid: [
    {
      code: "const someRequest = myClient.createRequest<{response: any}>();",
      options: [],
    },
    {
      code: "const someRequest = myClient.createRequest<{payload: any}>();",
      options: [],
    },
    {
      code: "const someRequest = myClient.createRequest<{queryParams: any}>();",
      options: [],
    },
    {
      code: "const someRequest = myClient.createRequest<{error: any}>();",
      options: [],
    },
    {
      code: "const someRequest = myClient.createRequest<{payload: any,response: any}>();",
      options: [],
    },
    {
      code: "const someRequest = myClient.createRequest<{response: any, queryParams: any}>();",
      options: [],
    },
    {
      code: "const someRequest = myClient.createRequest<{error: any, response: any}>();",
      options: [],
    },
    {
      code: "const someRequest = myClient.createRequest<{payload: any, response: any, queryParams: any, error: any}>();",
      options: [],
    },
  ],
  invalid: [
    {
      // typo check
      code: "const someRequest = myClient.createRequest<{respse: any}>();",
      options: [],
      errors: [{ messageId: "unexpectedGenerics", data: { items: "respse" } }],
    },
    {
      // extending check
      code: "const someRequest = myClient.createRequest<{nonExisting: any}>();",
      errors: [{ messageId: "unexpectedGenerics", data: { items: "nonExisting" } }],
    },
    {
      // mixed check
      code: "const someRequest = myClient.createRequest<{response: any, nonExisting: any, queryParams: any}>();",
      errors: [{ messageId: "unexpectedGenerics", data: { items: "nonExisting" } }],
    },
    {
      // empty check
      code: "const someRequest = myClient.createRequest<{}>();",
      errors: [{ messageId: "emptyGeneric" }],
    },
    {
      // not matching check
      code: "const someRequest = myClient.createRequest<string>();",
      errors: [{ messageId: "notMatchingGenerics" }],
    },
  ],
});
