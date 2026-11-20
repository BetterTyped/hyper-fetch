import type {
  ExtractAdapterMethodType,
  ExtractEndpointType,
  ExtractLocalErrorType,
  ExtractPayloadType,
  ExtractResponseType,
} from "@hyper-fetch/core";
import { createClient, createSdk } from "@hyper-fetch/core";
import { useFetch, useSubmit } from "@hyper-fetch/react";
import { oc } from "@orpc/contract";
import type { ContractRouterClient } from "@orpc/contract";
import { implement, os } from "@orpc/server";
import type { RouterClient } from "@orpc/server";
import { expectTypeOf } from "vitest";
import { z } from "zod";

import type {
  OrpcAdapterOptionsType,
  OrpcAdapterType,
  OrpcErrorType,
  OrpcMethod,
  OrpcSchema,
} from "../../../src/adapter";
import { OrpcAdapter } from "../../../src/adapter";
import type { AppRouter, User } from "../../e2e/e2e.orpc-server";

describe("Orpc Adapter [ Schema ]", () => {
  const client = createClient({ url: "http://localhost:3000/rpc" }).setAdapter(OrpcAdapter());
  const api = createSdk<typeof client, OrpcSchema<AppRouter>>(client, { camelCaseToKebabCase: false });

  type Api = typeof api;
  type ById = Api["user"]["byId"]["$query"];
  type List = Api["user"]["list"]["$query"];
  type Create = Api["user"]["create"]["$mutation"];
  type Health = Api["health"]["$query"];

  it("should expose QUERY and MUTATION as the adapter methods", () => {
    expectTypeOf<ExtractAdapterMethodType<OrpcAdapterType>>().toEqualTypeOf<OrpcMethod>();
    expectTypeOf<OrpcMethod>().toEqualTypeOf<"QUERY" | "MUTATION">();

    client.createRequest()({ endpoint: "health", method: "QUERY" });
    client.createRequest()({ endpoint: "user/create", method: "MUTATION" });
    // @ts-expect-error POST is the wire method, not a method of this adapter
    client.createRequest()({ endpoint: "health", method: "POST" });
  });

  it("should infer the output of the procedures", () => {
    expectTypeOf<ExtractResponseType<ById>>().toEqualTypeOf<User>();
    expectTypeOf<ExtractResponseType<List>>().toEqualTypeOf<User[]>();
    expectTypeOf<ExtractResponseType<Create>>().toEqualTypeOf<User>();
    expectTypeOf<ExtractResponseType<Health>>().toEqualTypeOf<"ok">();
  });

  it("should keep the special output types", () => {
    type NextDay = Api["types"]["nextDay"]["$query"];

    expectTypeOf<ExtractPayloadType<NextDay>>().toEqualTypeOf<{ date: Date; total: bigint }>();
    expectTypeOf<ExtractResponseType<NextDay>["date"]>().toEqualTypeOf<Date>();
    expectTypeOf<ExtractResponseType<NextDay>["total"]>().toEqualTypeOf<bigint>();
    expectTypeOf<ExtractResponseType<NextDay>["tags"]>().toEqualTypeOf<Set<string>>();
    expectTypeOf<ExtractResponseType<Api["types"]["download"]["$query"]>["file"]>().toEqualTypeOf<File>();
    expectTypeOf<ExtractPayloadType<Api["types"]["upload"]["$mutation"]>>().toEqualTypeOf<{
      name: string;
      file: Blob;
    }>();
  });

  it("should infer the input of the procedures", () => {
    expectTypeOf<ExtractPayloadType<ById>>().toEqualTypeOf<{ id: number }>();
    expectTypeOf<ExtractPayloadType<Create>>().toEqualTypeOf<{ name: string }>();
    expectTypeOf<ExtractPayloadType<List>>().toEqualTypeOf<{ limit?: number | undefined }>();
    expectTypeOf<ExtractPayloadType<Health>>().toEqualTypeOf<undefined>();
    expectTypeOf<ExtractPayloadType<Api["double"]["$query"]>>().toEqualTypeOf<number>();
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

  it("should infer the defined errors of the procedure", () => {
    type Error = ExtractLocalErrorType<ById>;
    type Defined = Extract<Error, { defined: true }>;

    expectTypeOf<Defined>().toEqualTypeOf<OrpcErrorType<"NOT_FOUND", { id: number }> & { defined: true }>();
    expectTypeOf<Extract<Error, { defined: false }>>().toEqualTypeOf<OrpcErrorType & { defined: false }>();
  });

  it("should narrow the error by the defined flag and the code", () => {
    const read = (error: ExtractLocalErrorType<ById>) => {
      if (error.defined && error.code === "NOT_FOUND") {
        expectTypeOf(error.data).toEqualTypeOf<{ id: number }>();
        return error.data.id;
      }
      expectTypeOf(error.data).toEqualTypeOf<unknown>();
      return null;
    };

    expectTypeOf(read).toBeFunction();
  });

  it("should narrow the error of send, which includes the global error of the client", () => {
    // The example of the docs - the client has the default global error, so `error` is a union with `Error`
    const read = async () => {
      const { error } = await api.user.byId.$query.setPayload({ id: 999 }).send();

      if (error && "defined" in error) {
        expectTypeOf(error.defined).toEqualTypeOf<boolean>();
        expectTypeOf(error.status).toEqualTypeOf<number>();
        if (error.defined && error.code === "NOT_FOUND") {
          expectTypeOf(error.data).toEqualTypeOf<{ id: number }>();
        }
      }
      // @ts-expect-error the global error of the client has no `defined` flag
      return error?.defined;
    };

    expectTypeOf(read).toBeFunction();
  });

  it("should type procedures without defined errors", () => {
    expectTypeOf<ExtractLocalErrorType<Health>>().toEqualTypeOf<OrpcErrorType & { defined: false }>();
    expectTypeOf<OrpcErrorType["status"]>().toEqualTypeOf<number>();
  });

  it("should use the procedure path as the endpoint", () => {
    expectTypeOf<ExtractEndpointType<ById>>().toEqualTypeOf<"/user/byId">();
    expectTypeOf<ExtractEndpointType<Health>>().toEqualTypeOf<"/health">();
  });

  it("should expose every procedure as a query and a mutation", () => {
    expectTypeOf<Api["user"]["byId"]>().toHaveProperty("$query");
    expectTypeOf<Api["user"]["byId"]>().toHaveProperty("$mutation");
    expectTypeOf<ExtractResponseType<Api["user"]["byId"]["$mutation"]>>().toEqualTypeOf<User>();
  });

  it("should skip the event iterators and keep the procedures that only throw", () => {
    expectTypeOf<OrpcSchema<AppRouter>>().not.toHaveProperty("ticks");
    expectTypeOf<OrpcSchema<AppRouter>>().toHaveProperty("crash");
    expectTypeOf<OrpcSchema<AppRouter>>().toHaveProperty("fail");
    expectTypeOf<Api["crash"]>().toHaveProperty("$query");
  });

  it("should accept the client type of the router", () => {
    expectTypeOf<OrpcSchema<RouterClient<AppRouter>>>().toEqualTypeOf<OrpcSchema<AppRouter>>();
  });

  it("should reject types that are not a router", () => {
    // @ts-expect-error a string is not a router
    expectTypeOf<OrpcSchema<string>>().toBeObject();
  });

  describe("when the router is composed", () => {
    const nested = { count: os.handler(() => 1) };
    const composedRouter = {
      lazyRouter: os.lazy(async () => ({ default: nested })),
      a: { b: { c: { leaf: os.handler(() => "deep" as const) } } },
      camelCaseName: os.handler(() => true),
      nothing: os.handler(() => {}),
      union: os
        .input(
          z.discriminatedUnion("kind", [
            z.object({ kind: z.literal("a") }),
            z.object({ kind: z.literal("b"), id: z.number() }),
          ]),
        )
        .handler(() => 1),
      nullable: os.input(z.string().nullable()).handler(() => 1),
      list: os.input(z.array(z.number())).handler(({ input }) => input.length),
      transformed: os.input(z.string().transform((value) => value.length)).handler(({ input }) => input),
    };
    const composedClient = createClient({ url: "http://localhost:3000/rpc" }).setAdapter(OrpcAdapter());
    const composed = createSdk<typeof composedClient, OrpcSchema<typeof composedRouter>>(composedClient, {
      camelCaseToKebabCase: false,
    });
    type Composed = typeof composed;

    it("should infer the lazy and deep procedures", () => {
      expectTypeOf<ExtractResponseType<Composed["lazyRouter"]["count"]["$query"]>>().toEqualTypeOf<number>();
      expectTypeOf<ExtractResponseType<Composed["a"]["b"]["c"]["leaf"]["$query"]>>().toEqualTypeOf<"deep">();
      expectTypeOf<ExtractEndpointType<Composed["a"]["b"]["c"]["leaf"]["$query"]>>().toEqualTypeOf<"/a/b/c/leaf">();
    });

    it("should keep the procedure names as written", () => {
      expectTypeOf<ExtractEndpointType<Composed["camelCaseName"]["$query"]>>().toEqualTypeOf<"/camelCaseName">();
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

    it("should use the schema input before the transformation", () => {
      expectTypeOf<ExtractPayloadType<Composed["transformed"]["$query"]>>().toEqualTypeOf<string>();
      expectTypeOf<ExtractResponseType<Composed["transformed"]["$query"]>>().toEqualTypeOf<number>();
    });

    it("should validate the SDK configuration keys", () => {
      composed.$configure({ "*": { retry: 1 }, "camelCaseName.$query": { cache: false } });

      expectTypeOf(composed.$configure).toBeFunction();
    });
  });

  describe("when the API is contract-first", () => {
    const contract = {
      planet: {
        find: oc
          .input(z.object({ id: z.number() }))
          .output(z.object({ name: z.string() }))
          .errors({ NOT_FOUND: { data: z.object({ id: z.number() }) } }),
      },
    };
    const contractClient = createClient({ url: "http://localhost:3000/rpc" }).setAdapter(OrpcAdapter());

    it("should infer the procedures from the contract client type", () => {
      const planets = createSdk<typeof contractClient, OrpcSchema<ContractRouterClient<typeof contract>>>(
        contractClient,
        { camelCaseToKebabCase: false },
      );
      type Find = (typeof planets)["planet"]["find"]["$query"];

      expectTypeOf<ExtractPayloadType<Find>>().toEqualTypeOf<{ id: number }>();
      expectTypeOf<ExtractResponseType<Find>>().toEqualTypeOf<{ name: string }>();
      expectTypeOf<Extract<ExtractLocalErrorType<Find>, { defined: true }>["data"]>().toEqualTypeOf<{ id: number }>();
    });

    it("should infer the procedures from the implemented router", () => {
      const router = implement(contract).router({
        planet: { find: implement(contract).planet.find.handler(({ input }) => ({ name: `${input.id}` })) },
      });
      const planets = createSdk<typeof contractClient, OrpcSchema<typeof router>>(contractClient, {
        camelCaseToKebabCase: false,
      });

      expectTypeOf<ExtractResponseType<(typeof planets)["planet"]["find"]["$query"]>>().toEqualTypeOf<{
        name: string;
      }>();
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

  it("should validate the adapter options", () => {
    OrpcAdapter({ queryMethod: "GET" });
    OrpcAdapter({ queryMethod: "POST", customJsonSerializers: [] });
    // @ts-expect-error mutations always use POST, other methods are not supported
    OrpcAdapter({ queryMethod: "PUT" });
    expectTypeOf<NonNullable<OrpcAdapterOptionsType["queryMethod"]>>().toEqualTypeOf<"POST" | "GET">();

    client.createRequest()({ endpoint: "health" }).setOptions({ queryMethod: "GET", timeout: 1 });
    // @ts-expect-error unknown method
    client.createRequest()({ endpoint: "health" }).setOptions({ queryMethod: "DELETE" });
  });
});
