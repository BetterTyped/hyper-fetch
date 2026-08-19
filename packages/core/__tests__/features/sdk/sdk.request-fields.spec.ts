import type { Client } from "client";
import { createClient } from "client";
import type { HttpAdapterType } from "http-adapter";
import type { RequestModel } from "request";
import { createSdk } from "sdk";

type TestClient = Client<Error, HttpAdapterType>;

type TestSchema = {
  users: {
    $get: RequestModel<{
      response: { id: string; name: string }[];
      endpoint: "/users";
    }>;
  };
};

/**
 * The SDK proxy decides between "this key is a request property" and "this key is a deeper
 * API path" with an `in` check on the request instance. Optional class fields like
 * `unstable_responseMapper` are declared without initializers, and some transpilers drop
 * uninitialized class fields entirely - Metro (React Native) compiles class properties in
 * loose mode, so a bundled Request instance never owns them. The `in` check then fails and
 * the proxy hands back a nested path proxy: a truthy object. Anything that does
 * `request.unstable_responseMapper?.(response)` crashes with "Object is not a function",
 * and every `if (request.retryOnError)`-style feature check silently misfires.
 */
describe("SDK [ Request fields ]", () => {
  // Every field the runtime feature-detects with a truthiness check. If one of these leaks
  // a path proxy instead of undefined, requests break in ways that don't throw at the source.
  const optionalFields = [
    "unstable_mock",
    "unstable_payloadMapper",
    "unstable_requestMapper",
    "unstable_responseMapper",
    "retryOnError",
    "optimistic",
  ] as const;

  let client: TestClient;

  beforeEach(() => {
    client = createClient<{ error: Error }>({ url: "http://localhost:3000" });
  });

  it("should expose optional request fields as own properties of a fresh request", () => {
    const request = client.createRequest()({ endpoint: "/users", method: "GET" });
    const ownProperties = Object.getOwnPropertyNames(request);

    optionalFields.forEach((field) => {
      expect(ownProperties).toContain(field);
    });
  });

  it("should return undefined for unset optional fields on SDK leaves", () => {
    const sdk = createSdk<TestClient, TestSchema>(client);

    optionalFields.forEach((field) => {
      expect(sdk.users.$get[field]).toBeUndefined();
    });
  });

  it("should not leak a path proxy when a transpiler drops uninitialized class fields", () => {
    // Simulate Metro's loose class-property transform: the instance no longer owns the field.
    const originalCreateRequest = client.createRequest.bind(client);
    client.createRequest = (() => (options: { endpoint: string; method?: string }) => {
      const request = originalCreateRequest()(options as never);
      optionalFields.forEach((field) => {
        delete (request as unknown as Record<string, unknown>)[field];
      });
      return request;
    }) as typeof client.createRequest;

    const sdk = createSdk<TestClient, TestSchema>(client);

    optionalFields.forEach((field) => {
      expect(sdk.users.$get[field]).toBeUndefined();
    });
  });
});
