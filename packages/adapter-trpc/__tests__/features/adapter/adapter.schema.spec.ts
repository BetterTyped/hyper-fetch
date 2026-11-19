import type {
  ExtractAdapterMethodType,
  ExtractEndpointType,
  ExtractLocalErrorType,
  ExtractPayloadType,
  ExtractResponseType,
} from "@hyper-fetch/core";
import { createClient, createSdk } from "@hyper-fetch/core";
import { useFetch, useSubmit } from "@hyper-fetch/react";
import { initTRPC, lazy } from "@trpc/server";
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

  describe("when the router is composed", () => {
    const t = initTRPC.create({
      errorFormatter: ({ shape }) => ({ ...shape, data: { ...shape.data, requestId: "id" } }),
    });
    const nested = t.router({ count: t.procedure.query(() => 1) });
    const composedRouter = t.mergeRouters(
      t.router({
        lazyRouter: lazy(async () => nested),
        a: t.router({ b: t.router({ c: t.router({ leaf: t.procedure.query(() => "deep" as const) }) }) }),
        camelCaseName: t.procedure.query(() => true),
        nothing: t.procedure.mutation(() => {}),
        union: t.procedure.input((value) => value as { kind: "a" } | { kind: "b"; id: number }).query(() => 1),
        nullable: t.procedure.input((value) => value as string | null).query(() => 1),
        list: t.procedure.input((value) => value as number[]).mutation(({ input }) => input.length),
      }),
      t.router({ merged: t.procedure.query(() => "merged" as const) }),
    );
    const composedClient = createClient({ url: "http://localhost:3000/trpc" }).setAdapter(TrpcAdapter());
    const composed = createSdk<typeof composedClient, TrpcSchema<typeof composedRouter>>(composedClient, {
      camelCaseToKebabCase: false,
    });
    type Composed = typeof composed;

    it("should infer the merged, lazy and deep procedures", () => {
      expectTypeOf<ExtractResponseType<Composed["merged"]["$query"]>>().toEqualTypeOf<"merged">();
      expectTypeOf<ExtractResponseType<Composed["lazyRouter"]["count"]["$query"]>>().toEqualTypeOf<number>();
      expectTypeOf<ExtractResponseType<Composed["a"]["b"]["c"]["leaf"]["$query"]>>().toEqualTypeOf<"deep">();
      expectTypeOf<ExtractEndpointType<Composed["a"]["b"]["c"]["leaf"]["$query"]>>().toEqualTypeOf<"/a/b/c/leaf">();
    });

    it("should keep the procedure names as written", () => {
      expectTypeOf<ExtractEndpointType<Composed["camelCaseName"]["$query"]>>().toEqualTypeOf<"/camelCaseName">();
    });

    it("should infer the fields added by the error formatter", () => {
      expectTypeOf<ExtractLocalErrorType<Composed["merged"]["$query"]>["data"]["requestId"]>().toEqualTypeOf<string>();
    });

    it("should infer a procedure without an output", () => {
      expectTypeOf<ExtractResponseType<Composed["nothing"]["$mutation"]>>().toEqualTypeOf<unknown>();
      expectTypeOf<ExtractPayloadType<Composed["nothing"]["$mutation"]>>().toEqualTypeOf<undefined>();
    });

    it("should infer union, nullable and array inputs", () => {
      expectTypeOf<ExtractPayloadType<Composed["union"]["$query"]>>().toEqualTypeOf<
        { kind: "a" } | { kind: "b"; id: number }
      >();
      expectTypeOf<ExtractPayloadType<Composed["nullable"]["$query"]>>().toEqualTypeOf<string | null>();
      expectTypeOf<ExtractPayloadType<Composed["list"]["$mutation"]>>().toEqualTypeOf<number[]>();
    });

    it("should validate the SDK configuration keys", () => {
      composed.$configure({ "*": { retry: 1 }, "merged.$query": { cache: false } });

      expectTypeOf(composed.$configure).toBeFunction();
    });
  });

  it("should type the React hooks", () => {
    const useTypedHooks = () => {
      const fetchHook = useFetch(api.user.byId.$query.setPayload({ id: 1 }));
      const submitHook = useSubmit(api.user.create.$mutation);

      expectTypeOf(fetchHook.data).toEqualTypeOf<User | null>();
      expectTypeOf(submitHook.data).toEqualTypeOf<User | null>();
      submitHook.submit({ payload: { name: "John" } });
      // @ts-expect-error wrong input type
      submitHook.submit({ payload: { id: 1 } });
    };

    expectTypeOf(useTypedHooks).toBeFunction();
  });

  it("should validate the transformer option", () => {
    TrpcAdapter({ transformer: { serialize: (value) => value, deserialize: (value) => value } });
    // @ts-expect-error both directions are required
    TrpcAdapter({ transformer: { serialize: (value: unknown) => value } });
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
