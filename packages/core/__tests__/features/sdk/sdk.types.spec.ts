import { describe, it, expect, expectTypeOf } from "vitest";

import { createClient } from "client";
import type { ClientInstance, Client } from "client";
import type { Request, RequestInstance, RequestModel } from "request";
import type { HttpAdapterType } from "http-adapter";
import { createSdk } from "sdk";
import type { InjectClient } from "sdk";

/**
 * Type-only tests for the SDK type surface.
 *
 * These tests do not exercise runtime behaviour - they verify that the type system narrows,
 * defaults, and propagates types as designed. Each `it` block contains a static
 * `expectTypeOf` assertion plus a trivial runtime `expect(true).toBe(true)` placeholder so
 * the test shows up in the Vitest report.
 */

type TestClient = Client<Error, HttpAdapterType>;
type CustomError = { code: string; message: string };
type User = { id: string; name: string };

describe("RequestModel - defaults for omitted fields", () => {
  it("should default response to unknown", () => {
    type R = RequestModel<{ endpoint: "/users" }>;
    type Response = R extends Request<infer Resp, any, any, any, any, any, any, any, any, any> ? Resp : never;
    expectTypeOf<Response>().toEqualTypeOf<unknown>();
    expect(true).toBe(true);
  });

  it("should default payload to undefined", () => {
    type R = RequestModel<{ endpoint: "/users" }>;
    type Payload = R extends Request<any, infer P, any, any, any, any, any, any, any, any> ? P : never;
    expectTypeOf<Payload>().toEqualTypeOf<undefined>();
    expect(true).toBe(true);
  });

  it("should default queryParams to undefined", () => {
    type R = RequestModel<{ endpoint: "/users" }>;
    type Query = R extends Request<any, any, infer Q, any, any, any, any, any, any, any> ? Q : never;
    expectTypeOf<Query>().toEqualTypeOf<undefined>();
    expect(true).toBe(true);
  });

  it("should default localError to Error", () => {
    type R = RequestModel<{ endpoint: "/users" }>;
    type LocalError = R extends Request<any, any, any, infer E, any, any, any, any, any, any> ? E : never;
    expectTypeOf<LocalError>().toEqualTypeOf<Error>();
    expect(true).toBe(true);
  });

  it("should default endpoint to string when not provided", () => {
    type R = RequestModel<{ response: User }>;
    type Endpoint = R extends Request<any, any, any, any, infer E, any, any, any, any, any> ? E : never;
    expectTypeOf<Endpoint>().toEqualTypeOf<string>();
    expect(true).toBe(true);
  });

  it("should default client to ClientInstance when not provided", () => {
    type R = RequestModel<{ endpoint: "/users" }>;
    type ClientType = R extends Request<any, any, any, any, any, infer C, any, any, any, any> ? C : never;
    expectTypeOf<ClientType>().toEqualTypeOf<ClientInstance>();
    expect(true).toBe(true);
  });

  it("should default hasPayload, hasParams, hasQueryParams to false", () => {
    type R = RequestModel<{ endpoint: "/users" }>;
    type HasPayload = R extends Request<any, any, any, any, any, any, infer Hp, any, any, any> ? Hp : never;
    type HasParams = R extends Request<any, any, any, any, any, any, any, infer Hpa, any, any> ? Hpa : never;
    type HasQuery = R extends Request<any, any, any, any, any, any, any, any, infer Hq, any> ? Hq : never;
    expectTypeOf<HasPayload>().toEqualTypeOf<false>();
    expectTypeOf<HasParams>().toEqualTypeOf<false>();
    expectTypeOf<HasQuery>().toEqualTypeOf<false>();
    expect(true).toBe(true);
  });

  it("should default mutationContext to undefined", () => {
    type R = RequestModel<{ endpoint: "/users" }>;
    type Ctx = R extends Request<any, any, any, any, any, any, any, any, any, infer C> ? C : never;
    expectTypeOf<Ctx>().toEqualTypeOf<undefined>();
    expect(true).toBe(true);
  });
});

describe("RequestModel - user-provided fields override defaults", () => {
  it("should narrow response when provided", () => {
    type R = RequestModel<{ response: User; endpoint: "/users/:userId" }>;
    type Response = R extends Request<infer Resp, any, any, any, any, any, any, any, any, any> ? Resp : never;
    expectTypeOf<Response>().toEqualTypeOf<User>();
    expect(true).toBe(true);
  });

  it("should narrow payload, queryParams, error when provided", () => {
    type R = RequestModel<{
      payload: { name: string };
      queryParams: { page: number };
      error: CustomError;
      endpoint: "/users";
    }>;
    type Payload = R extends Request<any, infer P, any, any, any, any, any, any, any, any> ? P : never;
    type Query = R extends Request<any, any, infer Q, any, any, any, any, any, any, any> ? Q : never;
    type LocalError = R extends Request<any, any, any, infer E, any, any, any, any, any, any> ? E : never;

    expectTypeOf<Payload>().toEqualTypeOf<{ name: string }>();
    expectTypeOf<Query>().toEqualTypeOf<{ page: number }>();
    expectTypeOf<LocalError>().toEqualTypeOf<CustomError>();
    expect(true).toBe(true);
  });

  it("should narrow endpoint to its literal type", () => {
    type R = RequestModel<{ response: User; endpoint: "/users/:userId" }>;
    type Endpoint = R extends Request<any, any, any, any, infer E, any, any, any, any, any> ? E : never;
    expectTypeOf<Endpoint>().toEqualTypeOf<"/users/:userId">();
    expect(true).toBe(true);
  });
});

describe("RequestInstance - keeps `any` defaults (regression check for constraint use)", () => {
  it("should default every slot to any so any concrete Request is assignable", () => {
    // RequestInstance with no args must remain wide so it acts as the "any Request" constraint
    type RI = RequestInstance;
    type Response = RI extends Request<infer R, any, any, any, any, any, any, any, any, any> ? R : never;
    type Payload = RI extends Request<any, infer P, any, any, any, any, any, any, any, any> ? P : never;
    type Query = RI extends Request<any, any, infer Q, any, any, any, any, any, any, any> ? Q : never;

    expectTypeOf<Response>().toEqualTypeOf<any>();
    expectTypeOf<Payload>().toEqualTypeOf<any>();
    expectTypeOf<Query>().toEqualTypeOf<any>();
    expect(true).toBe(true);
  });

  it("should accept a concrete RequestModel as a RequestInstance via constraint", () => {
    type ConcreteRequest = RequestModel<{ response: User; endpoint: "/users" }>;
    expectTypeOf<ConcreteRequest>().toMatchTypeOf<RequestInstance>();
    expect(true).toBe(true);
  });
});

describe("InjectClient - schema-level client injection", () => {
  it("should replace the Client slot on a single Request leaf with the SDK client", () => {
    type Schema = {
      $get: RequestModel<{ response: User; endpoint: "/users" }>;
    };
    type Injected = InjectClient<Schema, TestClient>;
    type ResolvedRequest = Injected["$get"];
    type ResolvedClient =
      ResolvedRequest extends Request<any, any, any, any, any, infer C, any, any, any, any> ? C : never;
    expectTypeOf<ResolvedClient>().toEqualTypeOf<TestClient>();
    expect(true).toBe(true);
  });

  it("should walk nested schema objects and inject into every leaf", () => {
    type Schema = {
      users: {
        $get: RequestModel<{ response: User[]; endpoint: "/users" }>;
        $userId: {
          $get: RequestModel<{ response: User; endpoint: "/users/:userId" }>;
        };
      };
    };
    type Injected = InjectClient<Schema, TestClient>;

    type FlatRequest = Injected["users"]["$get"];
    type NestedRequest = Injected["users"]["$userId"]["$get"];

    type FlatClient = FlatRequest extends Request<any, any, any, any, any, infer C, any, any, any, any> ? C : never;
    type NestedClient = NestedRequest extends Request<any, any, any, any, any, infer C, any, any, any, any> ? C : never;

    expectTypeOf<FlatClient>().toEqualTypeOf<TestClient>();
    expectTypeOf<NestedClient>().toEqualTypeOf<TestClient>();
    expect(true).toBe(true);
  });

  it("should preserve response, endpoint and other fields after injection", () => {
    type Schema = {
      $get: RequestModel<{ response: User; endpoint: "/users/:userId" }>;
    };
    type Injected = InjectClient<Schema, TestClient>;
    type R = Injected["$get"];

    type Response = R extends Request<infer Resp, any, any, any, any, any, any, any, any, any> ? Resp : never;
    type Endpoint = R extends Request<any, any, any, any, infer E, any, any, any, any, any> ? E : never;

    expectTypeOf<Response>().toEqualTypeOf<User>();
    expectTypeOf<Endpoint>().toEqualTypeOf<"/users/:userId">();
    expect(true).toBe(true);
  });

  it("should override an explicitly-passed client in the schema", () => {
    // Edge case: schema declares client (e.g. a placeholder ClientInstance) - SDK still wins
    type SchemaWithExplicitClient = {
      $get: RequestModel<{ client: ClientInstance; response: User; endpoint: "/users" }>;
    };
    type Injected = InjectClient<SchemaWithExplicitClient, TestClient>;
    type R = Injected["$get"];
    type ResolvedClient = R extends Request<any, any, any, any, any, infer C, any, any, any, any> ? C : never;
    expectTypeOf<ResolvedClient>().toEqualTypeOf<TestClient>();
    expect(true).toBe(true);
  });
});

describe("createSdk - produces a fully resolved SDK type", () => {
  type Schema = {
    users: {
      $get: RequestModel<{ response: User[]; endpoint: "/users" }>;
      $userId: {
        $get: RequestModel<{ response: User; endpoint: "/users/:userId" }>;
      };
    };
  };

  it("should type sdk.users.$get with the SDK client injected", () => {
    const client = createClient<{ error: Error }>({ url: "http://localhost" });
    const sdk = createSdk<typeof client, Schema>(client);

    type UsersGet = typeof sdk.users.$get;
    type ResolvedClient = UsersGet extends Request<any, any, any, any, any, infer C, any, any, any, any> ? C : never;
    type ResolvedResponse = UsersGet extends Request<infer R, any, any, any, any, any, any, any, any, any> ? R : never;
    type ResolvedEndpoint = UsersGet extends Request<any, any, any, any, infer E, any, any, any, any, any> ? E : never;

    expectTypeOf<ResolvedClient>().toEqualTypeOf<typeof client>();
    expectTypeOf<ResolvedResponse>().toEqualTypeOf<User[]>();
    expectTypeOf<ResolvedEndpoint>().toEqualTypeOf<"/users">();
    expect(true).toBe(true);
  });

  it("should type nested sdk.users.$userId.$get with the SDK client injected", () => {
    const client = createClient<{ error: Error }>({ url: "http://localhost" });
    const sdk = createSdk<typeof client, Schema>(client);

    type NestedGet = typeof sdk.users.$userId.$get;
    type ResolvedClient = NestedGet extends Request<any, any, any, any, any, infer C, any, any, any, any> ? C : never;
    type ResolvedResponse = NestedGet extends Request<infer R, any, any, any, any, any, any, any, any, any> ? R : never;

    expectTypeOf<ResolvedClient>().toEqualTypeOf<typeof client>();
    expectTypeOf<ResolvedResponse>().toEqualTypeOf<User>();
    expect(true).toBe(true);
  });

  it("should expose $configure on the SDK type", () => {
    const client = createClient<{ error: Error }>({ url: "http://localhost" });
    const sdk = createSdk<typeof client, Schema>(client);

    expectTypeOf(sdk.$configure).toBeFunction();
    expect(true).toBe(true);
  });
});

describe("$configure - dot-path callback narrowing", () => {
  type Schema = {
    users: {
      $get: RequestModel<{ response: User[]; endpoint: "/users" }>;
    };
  };

  it("should accept a function value matching the SDK request type for a dot-path key", () => {
    const client = createClient<{ error: Error }>({ url: "http://localhost" });
    const sdk = createSdk<typeof client, Schema>(client);

    // The configure call must accept a function whose parameter is assignable from any Request.
    // Stronger narrowing happens at the configuration value level via SocketSdkConfigurationMap.
    sdk.$configure({
      "users.$get": (request) => {
        expectTypeOf(request).toMatchTypeOf<RequestInstance>();
        return request;
      },
    });

    expect(true).toBe(true);
  });

  it("should accept a plain-object value for an endpoint group key", () => {
    const client = createClient<{ error: Error }>({ url: "http://localhost" });
    const sdk = createSdk<typeof client, Schema>(client);

    // Compile-time only: just verify the call typechecks.
    sdk.$configure({
      "*": { retry: 3 },
      "/users": { cache: true, cacheTime: 30000 },
    });

    expect(true).toBe(true);
  });
});
