import { createNodeWebSocket } from "@hono/node-ws";
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
import { Hono } from "hono";
import { expectTypeOf } from "vitest";

import type { HonoSchema } from "../../../src";
import type { User, apiApp, app } from "../../utils/app";
import type { RealtimeApp } from "../../utils/realtime-server";

type Schema = HonoSchema<typeof app>;

describe("HonoSchema [ Schema shape ]", () => {
  it("should nest mounted routes under their path segments", () => {
    expectTypeOf<keyof Schema>().toEqualTypeOf<"$get" | "users" | "auth">();
    expectTypeOf<keyof Schema["users"]>().toEqualTypeOf<"$get" | "$post" | "$userId">();
    expectTypeOf<keyof Schema["users"]["$userId"]>().toEqualTypeOf<"$get" | "posts">();
    expectTypeOf<keyof Schema["auth"]>().toEqualTypeOf<"googleLogin" | "session">();
    expect(true).toBe(true);
  });

  it("should turn :param segments into $param keys and keep the Hono path as the endpoint", () => {
    expectTypeOf<ExtractEndpointType<Schema["users"]["$userId"]["$get"]>>().toEqualTypeOf<"/users/:userId">();
    expectTypeOf<
      ExtractEndpointType<Schema["users"]["$userId"]["posts"]["$get"]>
    >().toEqualTypeOf<"/users/:userId/posts">();
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

  it("should prefix endpoints with the app basePath", () => {
    type ApiSchema = HonoSchema<typeof apiApp>;

    expectTypeOf<keyof ApiSchema>().toEqualTypeOf<"api">();
    expectTypeOf<ExtractEndpointType<ApiSchema["api"]["users"]["$get"]>>().toEqualTypeOf<"/api/users">();
    expect(true).toBe(true);
  });

  it("should lowercase the method keys", () => {
    const methods = new Hono().on("PATCH", "/users", (c) => c.json({ patched: true }));
    type MethodsSchema = HonoSchema<typeof methods>;

    expectTypeOf<keyof MethodsSchema["users"]>().toEqualTypeOf<"$patch">();
    expect(true).toBe(true);
  });

  it("should resolve to an empty schema for anything that is not a Hono app", () => {
    expectTypeOf<HonoSchema<{ routes: [] }>>().toEqualTypeOf<{}>();
    expectTypeOf<HonoSchema<new () => Hono>>().toEqualTypeOf<{}>();
    expect(true).toBe(true);
  });

  it("should reject routes the app does not define", () => {
    // @ts-expect-error - no DELETE handler on /users
    type MissingMethod = Schema["users"]["$delete"];
    // @ts-expect-error - no /posts router is mounted
    type MissingRoute = Schema["posts"];

    expectTypeOf<MissingMethod>().toBeAny();
    expectTypeOf<MissingRoute>().toBeAny();
    expect(true).toBe(true);
  });
});

describe("HonoSchema [ Request types ]", () => {
  it("should take the response from the handler output", () => {
    expectTypeOf<ExtractResponseType<Schema["users"]["$get"]>>().toEqualTypeOf<User[]>();
    expectTypeOf<ExtractResponseType<Schema["auth"]["session"]["$delete"]>>().toEqualTypeOf<{ loggedOut: true }>();
    expect(true).toBe(true);
  });

  it("should union the outputs of every status a handler returns", () => {
    expectTypeOf<ExtractResponseType<Schema["users"]["$userId"]["$get"]>>().toEqualTypeOf<User | { message: string }>();
    expect(true).toBe(true);
  });

  it("should take the payload from the json validator", () => {
    expectTypeOf<ExtractPayloadType<Schema["users"]["$post"]>>().toEqualTypeOf<{ name: string }>();
    expectTypeOf<ExtractPayloadType<Schema["users"]["$get"]>>().toEqualTypeOf<undefined>();
    expect(true).toBe(true);
  });

  it("should take the query params from the query validator", () => {
    expectTypeOf<ExtractQueryParamsType<Schema["users"]["$userId"]["posts"]["$get"]>>().toEqualTypeOf<{
      page: string | string[];
    }>();
    expectTypeOf<ExtractQueryParamsType<Schema["users"]["$get"]>>().toEqualTypeOf<undefined>();
    expect(true).toBe(true);
  });

  it("should leave the local error undefined", () => {
    expectTypeOf<ExtractLocalErrorType<Schema["users"]["$get"]>>().toEqualTypeOf<undefined>();
    expect(true).toBe(true);
  });

  it("should default the client to ClientInstance and accept a custom one", () => {
    type AppClient = Client<{ code: string }, HttpAdapterType>;
    type TypedSchema = HonoSchema<typeof app, AppClient>;

    expectTypeOf<ExtractClientType<Schema["users"]["$get"]>>().toEqualTypeOf<ClientInstance>();
    expectTypeOf<ExtractClientType<TypedSchema["users"]["$get"]>>().toEqualTypeOf<AppClient>();
    expect(true).toBe(true);
  });
});

describe("HonoSchema [ createSdk ]", () => {
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

  it("should type params from the Hono path", () => {
    sdk.users.$userId.$get.setParams({ userId: "1" });
    // @ts-expect-error - the Hono path names the param userId
    sdk.users.$userId.$get.setParams({ id: "1" });
    expect(true).toBe(true);
  });

  it("should type the payload from the json validator", () => {
    sdk.users.$post.setPayload({ name: "Ann" });
    // @ts-expect-error - the validator requires a string name
    sdk.users.$post.setPayload({ name: 1 });
    expect(true).toBe(true);
  });

  it("should type the query params from the query validator", () => {
    sdk.users.$userId.posts.$get.setQueryParams({ page: "2" });
    // @ts-expect-error - the validator reads page, not limit
    sdk.users.$userId.posts.$get.setQueryParams({ limit: "2" });
    expect(true).toBe(true);
  });
});

describe("HonoSchema [ Realtime routes ]", () => {
  type RealtimeSchema = HonoSchema<RealtimeApp>;

  it("should leave WebSocket routes out of the schema", () => {
    // /ws, /chat/:roomId, /notifications and /legacy are upgradeWebSocket() routes
    expectTypeOf<keyof RealtimeSchema>().toEqualTypeOf<"health" | "events">();
    expect(true).toBe(true);
  });

  it("should keep the HTTP methods of a path that also upgrades GET to a WebSocket", () => {
    const { upgradeWebSocket } = createNodeWebSocket({ app: new Hono() });
    const mixed = new Hono()
      .get(
        "/live",
        upgradeWebSocket(() => ({})),
      )
      .post("/live", (c) => c.json({ posted: true }));
    type MixedSchema = HonoSchema<typeof mixed>;

    expectTypeOf<keyof MixedSchema>().toEqualTypeOf<"live">();
    expectTypeOf<keyof MixedSchema["live"]>().toEqualTypeOf<"$post">();
    expectTypeOf<ExtractResponseType<MixedSchema["live"]["$post"]>>().toEqualTypeOf<{ posted: true }>();
    expect(true).toBe(true);
  });

  it("should keep a Server-Sent Events route as a GET with an untyped response", () => {
    expectTypeOf<ExtractEndpointType<RealtimeSchema["events"]["$get"]>>().toEqualTypeOf<"/events">();
    expectTypeOf<ExtractResponseType<RealtimeSchema["events"]["$get"]>>().toEqualTypeOf<{}>();
    expect(true).toBe(true);
  });

  it("should reject a WebSocket route used as a request", () => {
    // @ts-expect-error - /ws is a WebSocket route
    type WebSocketRoute = RealtimeSchema["ws"];

    expectTypeOf<WebSocketRoute>().toBeAny();
    expect(true).toBe(true);
  });
});
