import type {
  ExtractAdapterMethodType,
  ExtractEndpointType,
  ExtractLocalErrorType,
  ExtractPayloadType,
  ExtractResponseType,
} from "@hyper-fetch/core";
import { createClient, createSdk } from "@hyper-fetch/core";
import { expectTypeOf } from "vitest";

import type { TrpcAdapterType, TrpcErrorType, TrpcMethod, TrpcSchema } from "../../../src/adapter";
import { TrpcAdapter } from "../../../src/adapter";
import type { AppRouter, TransformerRouter, User } from "../../e2e/e2e.trpc-server";

describe("Trpc Adapter [ Schema ]", () => {
  const client = createClient({ url: "http://localhost:3000/trpc" }).setAdapter(TrpcAdapter());
  const api = createSdk<typeof client, TrpcSchema<AppRouter>>(client, { camelCaseToKebabCase: false });

  type Api = typeof api;
  type ById = Api["user"]["byId"]["$query"];
  type List = Api["user"]["list"]["$query"];
  type Create = Api["user"]["create"]["$mutation"];
  type Health = Api["health"]["$query"];

  it("should expose QUERY and MUTATION as the adapter methods", () => {
    expectTypeOf<ExtractAdapterMethodType<TrpcAdapterType>>().toEqualTypeOf<TrpcMethod>();
    expectTypeOf<TrpcMethod>().toEqualTypeOf<"QUERY" | "MUTATION">();

    client.createRequest()({ endpoint: "health", method: "QUERY" });
    client.createRequest()({ endpoint: "user.create", method: "MUTATION" });
    // @ts-expect-error GET is not a method of this adapter
    client.createRequest()({ endpoint: "health", method: "GET" });
  });

  it("should infer the response of the procedures", () => {
    expectTypeOf<ExtractResponseType<ById>>().toEqualTypeOf<User>();
    expectTypeOf<ExtractResponseType<List>>().toEqualTypeOf<User[]>();
    expectTypeOf<ExtractResponseType<Create>>().toEqualTypeOf<User>();
    expectTypeOf<ExtractResponseType<Health>>().toEqualTypeOf<"ok">();
  });

  it("should infer the input of the procedures", () => {
    expectTypeOf<ExtractPayloadType<ById>>().toEqualTypeOf<{ id: number }>();
    expectTypeOf<ExtractPayloadType<Create>>().toEqualTypeOf<{ name: string }>();
    expectTypeOf<ExtractPayloadType<List>>().toEqualTypeOf<{ limit?: number }>();
    expectTypeOf<ExtractPayloadType<Health>>().toEqualTypeOf<undefined>();
  });

  it("should require the input only when the procedure needs it", () => {
    const check = () => {
      api.health.$query.send();
      api.user.list.$query.send();
      api.user.list.$query.setPayload({ limit: 1 }).send();
      api.user.byId.$query.setPayload({ id: 1 }).send();
      api.user.byId.$query.send({ payload: { id: 1 } });

      // @ts-expect-error the input is required
      api.user.byId.$query.send();
      // @ts-expect-error wrong input type
      api.user.byId.$query.setPayload({ id: "1" });
      // @ts-expect-error wrong input type
      api.user.create.$mutation.setPayload({ id: 1 });
    };

    expectTypeOf(check).toBeFunction();
  });

  it("should infer the error shape of the router", () => {
    expectTypeOf<ExtractLocalErrorType<ById>["message"]>().toEqualTypeOf<string>();
    expectTypeOf<ExtractLocalErrorType<ById>["code"]>().toBeNumber();
    expectTypeOf<ExtractLocalErrorType<ById>["data"]["httpStatus"]>().toEqualTypeOf<number>();
    expectTypeOf<ExtractLocalErrorType<ById>["data"]["path"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TrpcErrorType["data"]["httpStatus"]>().toEqualTypeOf<number>();
  });

  it("should use the procedure path as the endpoint", () => {
    expectTypeOf<ExtractEndpointType<ById>>().toEqualTypeOf<"/user/byId">();
    expectTypeOf<ExtractEndpointType<Health>>().toEqualTypeOf<"/health">();
  });

  it("should expose only the leaf matching the procedure type", () => {
    expectTypeOf<Api["user"]["byId"]>().toHaveProperty("$query");
    expectTypeOf<Api["user"]["byId"]>().not.toHaveProperty("$mutation");
    expectTypeOf<Api["user"]["create"]>().toHaveProperty("$mutation");
    expectTypeOf<Api["user"]["create"]>().not.toHaveProperty("$query");
  });

  it("should skip subscriptions", () => {
    expectTypeOf<TrpcSchema<AppRouter>>().toHaveProperty("health");
    expectTypeOf<TrpcSchema<AppRouter>>().not.toHaveProperty("onUser");
  });

  it("should serialize the output without a transformer", () => {
    expectTypeOf<ExtractResponseType<Api["createdAt"]["$query"]>>().toEqualTypeOf<string>();
  });

  it("should keep the rich output types with a transformer", () => {
    const transformerClient = createClient({ url: "http://localhost:3000/trpc" }).setAdapter(TrpcAdapter());
    const transformerApi = createSdk<typeof transformerClient, TrpcSchema<TransformerRouter>>(transformerClient, {
      camelCaseToKebabCase: false,
    });

    type NextDay = (typeof transformerApi)["nextDay"]["$query"];

    expectTypeOf<ExtractResponseType<NextDay>>().toEqualTypeOf<{ date: Date; tags: Set<string> }>();
    expectTypeOf<ExtractPayloadType<NextDay>>().toEqualTypeOf<{ date: Date }>();
  });
});
