import type {
  ExtractAdapterExtraType,
  ExtractListenerHasPayloadType,
  ExtractListenerPayloadType,
  ExtractListenerResponseType,
  ExtractListenerTopicType,
} from "@hyper-fetch/sockets";
import { Socket, createSocketSdk } from "@hyper-fetch/sockets";
import { initTRPC, lazy, tracked } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import superjson from "superjson";
import { expectTypeOf } from "vitest";

import type { TrpcSocketExtraType, TrpcSocketSchema, TrpcSseAdapterType, TrpcWebsocketAdapterType } from "../../../src";
import { TrpcSseAdapter, TrpcWebsocketAdapter } from "../../../src";
import type {
  Message,
  SubscriptionsRouter,
  SubscriptionsTransformerRouter,
} from "../../e2e/e2e.trpc-subscriptions-server";

const t = initTRPC.create();

const nestedRouter = t.router({
  admin: t.router({
    audit: t.router({
      onEntry: t.procedure.subscription(async function* onEntry() {
        yield { action: "login" as const, at: new Date() };
      }),
      list: t.procedure.query(() => []),
    }),
  }),
  onlyQueries: t.router({ list: t.procedure.query(() => []) }),
  lazyRouter: lazy(async () =>
    t.router({
      onPing: t.procedure.subscription(async function* onPing() {
        yield 1;
      }),
    }),
  ),
  onPlain: t.procedure.subscription(async function* onPlain() {
    yield { id: "1", data: 2, extra: true };
  }),
});

describe("Trpc Socket Schema [ Types ]", () => {
  const socket = new Socket({
    url: "ws://localhost",
    adapter: TrpcWebsocketAdapter(),
    adapterOptions: { autoConnect: false },
  });
  const api = createSocketSdk<typeof socket, TrpcSocketSchema<SubscriptionsRouter>>(socket, {
    camelCaseToKebabCase: false,
  });

  type Api = typeof api;
  type OnMessage = Api["chat"]["onMessage"]["$listener"];
  type OnAny = Api["chat"]["onAny"]["$listener"];
  type OnIdle = Api["onIdle"]["$listener"];
  type OnCount = Api["onCount"]["$listener"];

  afterAll(async () => {
    await socket.disconnect();
  });

  it("should map subscriptions to listeners with the slash path as the topic", () => {
    expectTypeOf<ExtractListenerTopicType<OnMessage>>().toEqualTypeOf<"chat/onMessage">();
    expectTypeOf<ExtractListenerTopicType<OnIdle>>().toEqualTypeOf<"onIdle">();

    expect(api.chat.onMessage.$listener.topic).toBe("chat/onMessage");
    expect(api.onIdle.$listener.topic).toBe("onIdle");
  });

  it("should leave queries and mutations out", () => {
    expectTypeOf<keyof Api["chat"]>().toEqualTypeOf<"onMessage" | "onAny">();
    // @ts-expect-error queries are sent with the TrpcAdapter
    expectTypeOf<Api["health"]>().toBeObject();
    // @ts-expect-error mutations are sent with the TrpcAdapter
    expectTypeOf<Api["chat"]["send"]>().toBeObject();
  });

  it("should take the procedure input as the payload", () => {
    expectTypeOf<ExtractListenerPayloadType<OnMessage>>().toEqualTypeOf<{ room: string; lastEventId?: string }>();
    expectTypeOf<ExtractListenerPayloadType<OnCount>>().toEqualTypeOf<{ to: number }>();
    expectTypeOf<ExtractListenerPayloadType<OnAny>>().toEqualTypeOf<{ room?: string }>();
    expectTypeOf<ExtractListenerPayloadType<OnIdle>>().toEqualTypeOf<undefined>();
  });

  it("should require the payload only when the input is required", () => {
    expectTypeOf<ExtractListenerHasPayloadType<OnCount>>().toEqualTypeOf<false>();
    expectTypeOf<ExtractListenerHasPayloadType<OnAny>>().toEqualTypeOf<true>();
    expectTypeOf<ExtractListenerHasPayloadType<OnIdle>>().toEqualTypeOf<false>();

    const check = () => {
      api.onCount.$listener.setPayload({ to: 3 }).listen(() => {});
      api.onCount.$listener.listen(() => {}, { payload: { to: 3 } });
      api.chat.onAny.$listener.listen(() => {});
      api.chat.onAny.$listener.setPayload({ room: "a" }).listen(() => {});
      api.onIdle.$listener.listen(() => {});

      // @ts-expect-error the input is required
      api.onCount.$listener.listen(() => {});
      // @ts-expect-error the input has the wrong shape
      api.onCount.$listener.setPayload({ to: "3" });
      // @ts-expect-error the input is required in listen options too
      api.onCount.$listener.listen(() => {}, {});
    };
    expect(check).toBeFunction();
  });

  it("should unwrap tracked events", () => {
    expectTypeOf<ExtractListenerResponseType<OnMessage>>().toEqualTypeOf<{ room: string; text: string }>();
    expectTypeOf<ExtractListenerResponseType<OnCount>>().toEqualTypeOf<number>();
    expectTypeOf<ExtractListenerResponseType<OnAny>>().toEqualTypeOf<Message>();
    expectTypeOf<ExtractListenerResponseType<OnIdle>>().toEqualTypeOf<"ready">();
  });

  it("should type the callback data and extra", () => {
    const check = () => {
      api.chat.onMessage.$listener.setPayload({ room: "a" }).listen(({ data, extra }) => {
        expectTypeOf(data).toEqualTypeOf<{ room: string; text: string }>();
        expectTypeOf(extra).toEqualTypeOf<TrpcSocketExtraType>();
        expectTypeOf(extra.eventId).toEqualTypeOf<string | null>();
      });
    };
    expect(check).toBeFunction();
    expectTypeOf<ExtractAdapterExtraType<TrpcWebsocketAdapterType>>().toEqualTypeOf<TrpcSocketExtraType>();
    expectTypeOf<ExtractAdapterExtraType<TrpcSseAdapterType>>().toEqualTypeOf<TrpcSocketExtraType>();
  });

  it("should map nested and lazy routers", () => {
    type Nested = TrpcSocketSchema<typeof nestedRouter>;
    type OnEntry = Nested["admin"]["audit"]["onEntry"]["$listener"];
    type OnPing = Nested["lazyRouter"]["onPing"]["$listener"];

    expectTypeOf<ExtractListenerTopicType<OnEntry>>().toEqualTypeOf<"admin/audit/onEntry">();
    expectTypeOf<keyof Nested["admin"]["audit"]>().toEqualTypeOf<"onEntry">();
    expectTypeOf<keyof Nested["onlyQueries"]>().toEqualTypeOf<never>();
    expectTypeOf<ExtractListenerTopicType<OnPing>>().toEqualTypeOf<"lazyRouter/onPing">();
    expectTypeOf<ExtractListenerResponseType<OnPing>>().toEqualTypeOf<number>();
  });

  it("should serialize the output without a transformer", () => {
    type OnEntry = TrpcSocketSchema<typeof nestedRouter>["admin"]["audit"]["onEntry"]["$listener"];

    expectTypeOf<ExtractListenerResponseType<OnEntry>>().toEqualTypeOf<{ action: "login"; at: string }>();
  });

  it("should keep the output types with a transformer", () => {
    type OnDate = TrpcSocketSchema<SubscriptionsTransformerRouter>["onDate"]["$listener"];

    expectTypeOf<ExtractListenerResponseType<OnDate>>().toEqualTypeOf<{ at: Date; tags: Set<string> }>();
    expectTypeOf<ExtractListenerPayloadType<OnDate>>().toEqualTypeOf<{ since: Date }>();
  });

  it("should not unwrap events that only look tracked", () => {
    type OnPlain = TrpcSocketSchema<typeof nestedRouter>["onPlain"]["$listener"];

    expectTypeOf<ExtractListenerResponseType<OnPlain>>().toEqualTypeOf<{ id: string; data: number; extra: boolean }>();
  });

  it("should unwrap tracked events with a transformer", () => {
    const transformerT = initTRPC.create({ transformer: superjson });
    const router = transformerT.router({
      onTracked: transformerT.procedure.subscription(async function* onTracked() {
        yield tracked("1", { at: new Date() });
      }),
    });
    type OnTracked = TrpcSocketSchema<typeof router>["onTracked"]["$listener"];

    expectTypeOf<ExtractListenerResponseType<OnTracked>>().toEqualTypeOf<{ at: Date }>();
  });

  it("should map observable subscriptions", () => {
    const router = t.router({
      onValue: t.procedure.subscription(() => observable<{ value: number }>(() => () => {})),
    });
    type OnValue = TrpcSocketSchema<typeof router>["onValue"]["$listener"];

    expectTypeOf<ExtractListenerResponseType<OnValue>>().toEqualTypeOf<{ value: number }>();
  });

  it("should work with the SSE adapter", () => {
    const sseSocket = new Socket({
      url: "http://localhost",
      adapter: TrpcSseAdapter(),
      adapterOptions: { autoConnect: false },
    });
    const sseApi = createSocketSdk<typeof sseSocket, TrpcSocketSchema<SubscriptionsRouter>>(sseSocket, {
      camelCaseToKebabCase: false,
    });

    expectTypeOf<ExtractListenerResponseType<typeof sseApi.onCount.$listener>>().toEqualTypeOf<number>();
    expect(sseApi.onCount.$listener.topic).toBe("onCount");
  });
});
