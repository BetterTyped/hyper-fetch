import type {
  ExtractListenerHasPayloadType,
  ExtractListenerPayloadType,
  ExtractListenerResponseType,
  ExtractListenerTopicType,
} from "@hyper-fetch/sockets";
import { createSocketSdk, Socket } from "@hyper-fetch/sockets";
import { eventIterator, oc } from "@orpc/contract";
import type { ContractRouterClient } from "@orpc/contract";
import { os, withEventMeta } from "@orpc/server";
import type { RouterClient } from "@orpc/server";
import { expectTypeOf } from "vitest";
import { z } from "zod";

import type { OrpcSchema, OrpcSocketSchema } from "../../../src/adapter";
import type { OrpcSocketExtraType } from "../../../src/socket";
import { OrpcStreamAdapter } from "../../../src/stream-adapter";
import type { AppRouter } from "../../e2e/e2e.orpc-server";

type Planet = { id: number; name: string };

const router = {
  planet: {
    find: os.input(z.object({ id: z.number() })).handler(({ input }): Planet => ({ id: input.id, name: "Earth" })),
    onUpdate: os.input(z.object({ id: z.number() })).handler(async function* onUpdate({ input }) {
      yield withEventMeta({ id: input.id, name: "Earth" } as Planet, { id: "1" });
      return "finished" as const;
    }),
  },
  ticks: os.handler(async function* ticks() {
    yield 1;
  }),
  feed: os.input(z.object({ limit: z.number() }).optional()).handler(async function* feed() {
    yield "item";
  }),
  prices: os.output(eventIterator(z.object({ value: z.bigint(), at: z.date() }))).handler(async function* prices() {
    yield { value: 1n, at: new Date() };
  }),
  chat: {
    rooms: {
      onMessage: os.input(z.object({ roomId: z.string() })).handler(async function* onMessage() {
        yield { text: "hi" };
      }),
      list: os.handler(() => ["general"]),
    },
  },
  queries: {
    health: os.handler(() => "ok" as const),
    nested: { version: os.handler(() => 1) },
  },
  crash: os.handler((): never => {
    throw new Error("crash");
  }),
};

const contract = {
  planet: {
    onUpdate: oc.input(z.object({ id: z.number() })).output(eventIterator(z.object({ name: z.string() }))),
    find: oc.input(z.object({ id: z.number() })).output(z.object({ name: z.string() })),
  },
};

type Schema = OrpcSocketSchema<typeof router>;

describe("Orpc Socket Schema [ Types ]", () => {
  const socket = new Socket({
    url: "http://localhost:3000/rpc",
    adapter: OrpcStreamAdapter(),
    adapterOptions: { autoConnect: false },
  });
  const sdk = createSocketSdk<typeof socket, Schema>(socket, { camelCaseToKebabCase: false });

  it("should keep only the event iterator procedures", () => {
    expectTypeOf<keyof Schema>().toEqualTypeOf<"planet" | "ticks" | "feed" | "prices" | "chat">();
    expectTypeOf<keyof Schema["planet"]>().toEqualTypeOf<"onUpdate">();
    expectTypeOf<keyof Schema["chat"]>().toEqualTypeOf<"rooms">();
    expectTypeOf<keyof Schema["chat"]["rooms"]>().toEqualTypeOf<"onMessage">();

    const check = () => {
      // @ts-expect-error regular procedures are called with OrpcSchema
      sdk.planet.find.$listener.listen(() => {});
      // @ts-expect-error routers without event iterators are not a part of the schema
      sdk.queries.health.$listener.listen(() => {});
      // @ts-expect-error procedures that only throw have no events
      sdk.crash.$listener.listen(() => {});
    };
    expect(check).toBeFunction();
  });

  it("should infer the yielded value as the response", () => {
    expectTypeOf<ExtractListenerResponseType<Schema["planet"]["onUpdate"]["$listener"]>>().toEqualTypeOf<Planet>();
    expectTypeOf<ExtractListenerResponseType<Schema["ticks"]["$listener"]>>().toEqualTypeOf<number>();
    expectTypeOf<ExtractListenerResponseType<Schema["prices"]["$listener"]>>().toEqualTypeOf<{
      value: bigint;
      at: Date;
    }>();
    expectTypeOf<ExtractListenerResponseType<Schema["chat"]["rooms"]["onMessage"]["$listener"]>>().toEqualTypeOf<{
      text: string;
    }>();
  });

  it("should infer the input as the payload", () => {
    expectTypeOf<ExtractListenerPayloadType<Schema["planet"]["onUpdate"]["$listener"]>>().toEqualTypeOf<{
      id: number;
    }>();
    expectTypeOf<ExtractListenerPayloadType<Schema["ticks"]["$listener"]>>().toEqualTypeOf<undefined>();
    expectTypeOf<ExtractListenerPayloadType<Schema["feed"]["$listener"]>>().toEqualTypeOf<{ limit: number }>();
    expectTypeOf<ExtractListenerHasPayloadType<Schema["planet"]["onUpdate"]["$listener"]>>().toEqualTypeOf<false>();
    expectTypeOf<ExtractListenerHasPayloadType<Schema["feed"]["$listener"]>>().toEqualTypeOf<true>();
  });

  it("should use the procedure path as the topic", () => {
    expectTypeOf<
      ExtractListenerTopicType<Schema["planet"]["onUpdate"]["$listener"]>
    >().toEqualTypeOf<"planet/onUpdate">();
    expectTypeOf<ExtractListenerTopicType<Schema["ticks"]["$listener"]>>().toEqualTypeOf<"ticks">();
    expectTypeOf<
      ExtractListenerTopicType<Schema["chat"]["rooms"]["onMessage"]["$listener"]>
    >().toEqualTypeOf<"chat/rooms/onMessage">();

    expect(sdk.planet.onUpdate.$listener.topic).toBe("planet/onUpdate");
    expect(sdk.chat.rooms.onMessage.$listener.topic).toBe("chat/rooms/onMessage");
  });

  it("should require the payload only when the procedure needs it", () => {
    const check = () => {
      sdk.planet.onUpdate.$listener.setPayload({ id: 1 }).listen(() => {});
      sdk.planet.onUpdate.$listener.listen(() => {}, { payload: { id: 1 } });
      sdk.ticks.$listener.listen(() => {});
      sdk.feed.$listener.listen(() => {});
      sdk.feed.$listener.setPayload({ limit: 1 }).listen(() => {});

      // @ts-expect-error the input of the procedure is required
      sdk.planet.onUpdate.$listener.listen(() => {});
      // @ts-expect-error the payload has to match the input
      sdk.planet.onUpdate.$listener.setPayload({ id: "1" });
      // @ts-expect-error the payload passed to listen has to match the input
      sdk.planet.onUpdate.$listener.listen(() => {}, { payload: { name: "Earth" } });
    };
    expect(check).toBeFunction();
  });

  it("should type the data and the event meta of the callbacks", () => {
    const check = () => {
      sdk.planet.onUpdate.$listener.setPayload({ id: 1 }).listen(({ data, extra }) => {
        expectTypeOf(data).toEqualTypeOf<Planet>();
        expectTypeOf(extra).toEqualTypeOf<OrpcSocketExtraType>();
        expectTypeOf(extra.id).toEqualTypeOf<string | undefined>();
        expectTypeOf(extra.retry).toEqualTypeOf<number | undefined>();
      });
    };
    expect(check).toBeFunction();
  });

  it("should accept the client types of routers and contracts", () => {
    type FromClient = OrpcSocketSchema<RouterClient<typeof router>>;
    type FromContract = OrpcSocketSchema<ContractRouterClient<typeof contract>>;

    expectTypeOf<FromClient>().toEqualTypeOf<Schema>();
    expectTypeOf<keyof FromContract["planet"]>().toEqualTypeOf<"onUpdate">();
    expectTypeOf<ExtractListenerResponseType<FromContract["planet"]["onUpdate"]["$listener"]>>().toEqualTypeOf<{
      name: string;
    }>();
    expectTypeOf<ExtractListenerPayloadType<FromContract["planet"]["onUpdate"]["$listener"]>>().toEqualTypeOf<{
      id: number;
    }>();
  });

  it("should keep the event iterators out of OrpcSchema and the regular procedures out of OrpcSocketSchema", () => {
    expectTypeOf<keyof OrpcSchema<typeof router>["planet"]>().toEqualTypeOf<"find">();
    expectTypeOf<keyof OrpcSocketSchema<AppRouter>>().toEqualTypeOf<"ticks">();
  });

  it("should reject types that are not routers", () => {
    // @ts-expect-error a plain object is not a router
    expectTypeOf<OrpcSocketSchema<{ planet: string }>>().not.toBeNever();
    expect(true).toBeTrue();
  });
});
