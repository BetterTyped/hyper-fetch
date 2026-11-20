import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { requestGenericTypes } from "request-generic-types";

const ruleTester = new RuleTester({
  languageOptions: { parser: tsParser },
});

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
    {
      code: `
        type RequestType = {queryParams?: {search?: string; page?: number} | undefined}
        const someRequest = myClient.createRequest<RequestType>();
      `,
      options: [],
    },
    {
      code: `
        type RequestType = {
          response: { id: string };
          payload: { name: string };
          queryParams: { page: number };
          error: { message: string };
          endpoint: "/users/:id";
        }
        const someRequest = myClient.createRequest<RequestType>();
      `,
      options: [],
    },
    // RequestGenericType accepts params.
    "const someRequest = myClient.createRequest<{params: { id: number }}>();",
    "const someRequest = myClient.createRequest<{response: any, params: { id: number }}>();",
    // Quoted keys count the same as identifiers.
    `const someRequest = myClient.createRequest<{"response": any, 'error': any}>();`,
    // Intersections are checked part by part, references inside them are trusted.
    "const someRequest = myClient.createRequest<GqlResponse<{ user: User }> & { payload: { id: string } }>();",
    "const someRequest = myClient.createRequest<{ response: User } & { error: ApiError } & Extra>();",
    // A computed member is not the createRequest method.
    "const someRequest = myClient[createRequest]<{ nonExisting: any }>();",
  ],
  invalid: [
    {
      // unknown quoted key
      code: `const someRequest = myClient.createRequest<{"rsponse": any}>();`,
      errors: [{ messageId: "unexpectedGenerics", data: { items: "rsponse" } }],
    },
    {
      // unknown keys inside an intersection
      code: "const someRequest = myClient.createRequest<GqlResponse<User> & { rsponse: any } & { payload: any; eror: any }>();",
      errors: [{ messageId: "unexpectedGenerics", data: { items: "rsponse, eror" } }],
    },
    {
      // keyword type inside an intersection
      code: "const someRequest = myClient.createRequest<{ response: any } & string>();",
      errors: [{ messageId: "notMatchingGenerics" }],
    },
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
