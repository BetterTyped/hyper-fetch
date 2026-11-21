import { createClient, createSdk } from "@hyper-fetch/core";
import type {
  Client,
  ClientInstance,
  ExtractClientType,
  ExtractEndpointType,
  ExtractGlobalErrorType,
  ExtractLocalErrorType,
  ExtractPayloadType,
  ExtractQueryParamsType,
  ExtractResponseType,
  HttpAdapterType,
} from "@hyper-fetch/core";
import { Elysia } from "elysia";
import { expectTypeOf } from "vitest";

import type { ElysiaSchema } from "../../../src";
import type { User, apiApp, app, groupApp } from "../../utils/app";

type Schema = ElysiaSchema<typeof app>;

type ValidationError = { type: "validation" };

describe("ElysiaSchema [ Schema shape ]", () => {
  it("should nest plugin routes under their path segments", () => {
    expectTypeOf<keyof Schema["users"]>().toEqualTypeOf<"$get" | "$post" | "$userId">();
    expectTypeOf<keyof Schema["users"]["$userId"]>().toEqualTypeOf<"$get" | "posts">();
    expectTypeOf<keyof Schema["auth"]>().toEqualTypeOf<"googleLogin" | "session">();
    expect(true).toBe(true);
  });

  it("should leave out WebSocket, .all() and wildcard routes", () => {
    expectTypeOf<keyof Schema>().toEqualTypeOf<"$get" | "users" | "auth" | "files" | "maintenance" | "dav">();
    expect(true).toBe(true);
  });

  it("should turn :param segments into $param keys and keep the Elysia path as the endpoint", () => {
    expectTypeOf<ExtractEndpointType<Schema["users"]["$userId"]["$get"]>>().toEqualTypeOf<"/users/:userId">();
    expectTypeOf<
      ExtractEndpointType<Schema["users"]["$userId"]["posts"]["$get"]>
    >().toEqualTypeOf<"/users/:userId/posts">();
    expect(true).toBe(true);
  });

  it("should add routes below an optional param both without and with the param", () => {
    expectTypeOf<keyof Schema["files"]>().toEqualTypeOf<"$get" | "$fileId">();
    expectTypeOf<ExtractEndpointType<Schema["files"]["$get"]>>().toEqualTypeOf<"/files">();
    expectTypeOf<ExtractEndpointType<Schema["files"]["$fileId"]["$get"]>>().toEqualTypeOf<"/files/:fileId">();
    expectTypeOf<ExtractResponseType<Schema["files"]["$get"]>>().toEqualTypeOf<{ fileId: string | null }>();
    expect(true).toBe(true);
  });

  it("should camelCase kebab-case segments and keep the kebab-case endpoint", () => {
    expectTypeOf<ExtractEndpointType<Schema["auth"]["googleLogin"]["$get"]>>().toEqualTypeOf<"/auth/google-login">();
    expect(true).toBe(true);
  });

  it("should put a route registered on / at the top level", () => {
    expectTypeOf<ExtractEndpointType<Schema["$get"]>>().toEqualTypeOf<"/">();
    expectTypeOf<ExtractResponseType<Schema["$get"]>>().toEqualTypeOf<{ ok: true }>();
    expect(true).toBe(true);
  });

  it("should prefix endpoints with the plugin prefix", () => {
    type ApiSchema = ElysiaSchema<typeof apiApp>;

    expectTypeOf<keyof ApiSchema>().toEqualTypeOf<"api">();
    expectTypeOf<ExtractEndpointType<ApiSchema["api"]["users"]["$get"]>>().toEqualTypeOf<"/api/users">();
    expect(true).toBe(true);
  });

  it("should prefix endpoints with the group prefix", () => {
    type GroupSchema = ElysiaSchema<typeof groupApp>;

    expectTypeOf<keyof GroupSchema>().toEqualTypeOf<"v1">();
    expectTypeOf<
      ExtractEndpointType<GroupSchema["v1"]["users"]["$userId"]["$get"]>
    >().toEqualTypeOf<"/v1/users/:userId">();
    expect(true).toBe(true);
  });

  it("should lowercase the method keys", () => {
    expectTypeOf<keyof Schema["dav"]>().toEqualTypeOf<"$propfind">();
    expectTypeOf<keyof Schema["auth"]["session"]>().toEqualTypeOf<"$delete">();
    expect(true).toBe(true);
  });

  it("should keep a path segment named like a method", () => {
    const methodNamed = new Elysia().get("/get/delete", () => ({ nested: true as const }));
    type MethodNamedSchema = ElysiaSchema<typeof methodNamed>;

    expectTypeOf<ExtractEndpointType<MethodNamedSchema["get"]["delete"]["$get"]>>().toEqualTypeOf<"/get/delete">();
    expect(true).toBe(true);
  });

  it("should resolve to an empty schema for anything that is not an Elysia app", () => {
    expectTypeOf<ElysiaSchema<{ routes: [] }>>().toEqualTypeOf<{}>();
    expectTypeOf<ElysiaSchema<typeof Elysia>>().toEqualTypeOf<{}>();
    expect(true).toBe(true);
  });

  it("should reject routes the app does not define", () => {
    // @ts-expect-error - no DELETE handler on /users
    type MissingMethod = Schema["users"]["$delete"];
    // @ts-expect-error - no /posts plugin is used
    type MissingRoute = Schema["posts"];

    expectTypeOf<MissingMethod>().toBeAny();
    expectTypeOf<MissingRoute>().toBeAny();
    expect(true).toBe(true);
  });
});

describe("ElysiaSchema [ Request types ]", () => {
  it("should take the response from the 2xx statuses of the handler", () => {
    expectTypeOf<ExtractResponseType<Schema["users"]["$get"]>>().toEqualTypeOf<User[]>();
    expectTypeOf<ExtractResponseType<Schema["users"]["$post"]>>().toEqualTypeOf<User>();
    expectTypeOf<ExtractResponseType<Schema["auth"]["session"]["$delete"]>>().toEqualTypeOf<{ loggedOut: true }>();
    expect(true).toBe(true);
  });

  it("should take the local error from every other status", () => {
    type UserError = ExtractLocalErrorType<Schema["users"]["$userId"]["$get"]>;

    expectTypeOf<ExtractResponseType<Schema["users"]["$userId"]["$get"]>>().toEqualTypeOf<User>();
    expectTypeOf<Exclude<UserError, ValidationError>>().toEqualTypeOf<{ readonly message: "User not found" }>();
    expect(true).toBe(true);
  });

  it("should type the validation error of routes with a schema", () => {
    type PostError = ExtractLocalErrorType<Schema["users"]["$post"]>;

    expectTypeOf<Extract<PostError, ValidationError>>().not.toBeNever();
    expectTypeOf<Extract<PostError, ValidationError>["on"]>().toEqualTypeOf<string>();
    expect(true).toBe(true);
  });

  it("should leave the local error undefined when every status is a success", () => {
    expectTypeOf<ExtractLocalErrorType<Schema["users"]["$get"]>>().toEqualTypeOf<undefined>();
    expectTypeOf<ExtractLocalErrorType<Schema["auth"]["googleLogin"]["$get"]>>().toEqualTypeOf<undefined>();
    expect(true).toBe(true);
  });

  it("should type the response of a route without a 2xx status as undefined", () => {
    expectTypeOf<ExtractResponseType<Schema["maintenance"]["$get"]>>().toEqualTypeOf<undefined>();
    expectTypeOf<ExtractLocalErrorType<Schema["maintenance"]["$get"]>>().toEqualTypeOf<{ readonly retryAfter: 60 }>();
    expect(true).toBe(true);
  });

  it("should take the payload from the body schema", () => {
    expectTypeOf<ExtractPayloadType<Schema["users"]["$post"]>>().toEqualTypeOf<{ name: string }>();
    expectTypeOf<ExtractPayloadType<Schema["users"]["$get"]>>().toEqualTypeOf<undefined>();
    expect(true).toBe(true);
  });

  it("should take the query params from the query schema", () => {
    expectTypeOf<ExtractQueryParamsType<Schema["users"]["$userId"]["posts"]["$get"]>>().toEqualTypeOf<{
      page: string;
    }>();
    expectTypeOf<ExtractQueryParamsType<Schema["users"]["$get"]>>().toEqualTypeOf<undefined>();
    expect(true).toBe(true);
  });

  it("should default the client to ClientInstance and accept a custom one", () => {
    type AppClient = Client<{ code: string }, HttpAdapterType>;
    type TypedSchema = ElysiaSchema<typeof app, AppClient>;

    expectTypeOf<ExtractClientType<Schema["users"]["$get"]>>().toEqualTypeOf<ClientInstance>();
    expectTypeOf<ExtractClientType<TypedSchema["users"]["$get"]>>().toEqualTypeOf<AppClient>();
    expect(true).toBe(true);
  });
});

describe("ElysiaSchema [ createSdk ]", () => {
  const client = createClient({ url: "http://localhost" });
  const sdk = createSdk<typeof client, Schema>(client);

  it("should inject the SDK client into every request", () => {
    expectTypeOf<ExtractClientType<typeof sdk.users.$get>>().toEqualTypeOf<typeof client>();
    expect(true).toBe(true);
  });

  it("should apply the client's global error to every route", () => {
    type ApiError = { message: string; code: string };
    const errorClient = createClient<{ error: ApiError }>({ url: "http://localhost" });
    const errorSdk = createSdk<typeof errorClient, Schema>(errorClient);

    expectTypeOf<ExtractGlobalErrorType<typeof errorSdk.users.$get>>().toEqualTypeOf<ApiError>();
    expect(true).toBe(true);
  });

  it("should type params from the Elysia path", () => {
    sdk.users.$userId.$get.setParams({ userId: "1" });
    sdk.files.$fileId.$get.setParams({ fileId: "1" });
    // @ts-expect-error - the Elysia path names the param userId
    sdk.users.$userId.$get.setParams({ id: "1" });
    expect(true).toBe(true);
  });

  it("should type the payload from the body schema", () => {
    sdk.users.$post.setPayload({ name: "Ann" });
    // @ts-expect-error - the schema requires a string name
    sdk.users.$post.setPayload({ name: 1 });
    expect(true).toBe(true);
  });

  it("should type the query params from the query schema", () => {
    sdk.users.$userId.posts.$get.setQueryParams({ page: "2" });
    // @ts-expect-error - the schema reads page, not limit
    sdk.users.$userId.posts.$get.setQueryParams({ limit: "2" });
    expect(true).toBe(true);
  });
});
