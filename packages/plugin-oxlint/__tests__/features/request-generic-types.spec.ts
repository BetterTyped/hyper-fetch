import { RuleTester } from "oxlint/plugins-dev";

import { requestGenericTypes } from "../../src";

const ruleTester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

const request = (generic: string) => `const someRequest = myClient.createRequest<${generic}>();`;

ruleTester.run("request-generic-types", requestGenericTypes, {
  valid: [
    request("{response: any}"),
    request("{payload: any}"),
    request("{queryParams: any}"),
    request("{error: any}"),
    request("{endpoint: '/users/:id'}"),
    request("{params: { id: number }}"),
    request("{payload: any, response: any, queryParams: any, error: any, endpoint: '/users', params: {}}"),
    request(`{"response": any, 'error': any}`),
    request("{response?: any; readonly payload: any}"),
    // A type reference is checked by TypeScript against the constraint.
    `
      type RequestType = { response: { id: string }; nonExisting: number };
      const someRequest = myClient.createRequest<RequestType>();
    `,
    request("Namespace.RequestType"),
    // Intersections are checked part by part.
    request("GqlResponse<{ user: User }> & { payload: { id: string } }"),
    request("{ response: User } & { error: ApiError } & Extra"),
    // No generic at all.
    "const someRequest = myClient.createRequest()({ endpoint: '/ping' });",
    // Other methods and plain function calls are not HyperFetch factories.
    "const someRequest = myClient.createSomething<{ nonExisting: any }>();",
    "const someRequest = createRequest<{ nonExisting: any }>();",
    "const someRequest = myClient[createRequest]<{ nonExisting: any }>();",
    // Files that never mention createRequest are skipped.
    "const value = foo<{ nonExisting: any }>();",
  ],
  invalid: [
    {
      name: "typo",
      code: request("{respse: any}"),
      errors: [
        { messageId: "unexpectedGenerics", data: { items: "respse" }, line: 1, column: 20, endLine: 1, endColumn: 59 },
      ],
    },
    {
      name: "unknown key",
      code: request("{nonExisting: any}"),
      errors: [{ messageId: "unexpectedGenerics", data: { items: "nonExisting" } }],
    },
    {
      name: "unknown key among valid ones",
      code: request("{response: any, nonExisting: any, queryParams: any}"),
      errors: [{ messageId: "unexpectedGenerics", data: { items: "nonExisting" } }],
    },
    {
      name: "every unknown key in one report",
      code: request("{rsponse: any, eror: any}"),
      errors: [{ messageId: "unexpectedGenerics", data: { items: "rsponse, eror" } }],
    },
    {
      name: "string literal key",
      code: request(`{"rsponse": any}`),
      errors: [{ messageId: "unexpectedGenerics", data: { items: "rsponse" } }],
    },
    {
      name: "method signature",
      code: request("{rsponse(): void}"),
      errors: [{ messageId: "unexpectedGenerics", data: { items: "rsponse" } }],
    },
    {
      name: "index signature",
      code: request("{[key: string]: any}"),
      errors: [{ messageId: "unexpectedGenerics", data: { items: "[key: string]: any" } }],
    },
    {
      name: "empty object",
      code: request("{}"),
      errors: [{ messageId: "emptyGeneric", data: { method: "createRequest" } }],
    },
    {
      name: "keyword type",
      code: request("string"),
      errors: [{ messageId: "notMatchingGenerics", data: { method: "createRequest" } }],
    },
    {
      name: "union type",
      code: request("{response: any} | {error: any}"),
      errors: [{ messageId: "notMatchingGenerics" }],
    },
    {
      name: "unknown key in an intersection",
      code: request("GqlResponse<User> & { rsponse: any } & { payload: any; eror: any }"),
      errors: [{ messageId: "unexpectedGenerics", data: { items: "rsponse, eror" } }],
    },
    {
      name: "keyword type in an intersection",
      code: request("{ response: any } & string"),
      errors: [{ messageId: "notMatchingGenerics" }],
    },
    {
      name: "generic on the next line",
      code: "const someRequest = myClient.createRequest\n  <{respse: any}>();",
      errors: [{ messageId: "unexpectedGenerics", data: { items: "respse" } }],
    },
    {
      name: "optional call",
      code: "const someRequest = myClient?.createRequest<{respse: any}>();",
      errors: [{ messageId: "unexpectedGenerics", data: { items: "respse" } }],
    },
    {
      name: "chained client",
      code: "const someRequest = sdk.clients.main.createRequest<{respse: any}>()({ endpoint: '/' });",
      errors: [{ messageId: "unexpectedGenerics", data: { items: "respse" } }],
    },
  ],
});
