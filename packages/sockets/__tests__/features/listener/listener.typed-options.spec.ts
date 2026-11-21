import type { SocketAdapter } from "adapter";
import type { ListenerCallbackType } from "listener";
import { Socket } from "socket";
import type { ExtractListenerDeliveredType, ExtractListenerPayloadType, ExtractListenerResponseType } from "types";
import { describe, expect, expectTypeOf, it } from "vitest";

/** A source decorated the way graphql-codegen and gql.tada decorate documents */
type TypedSource<Result, Variables> = { kind: "source"; __apiType?: (variables: Variables) => Result };
type UntypedSource = { kind: "source" };

/** An adapter whose listener options can carry a typed source, like the `document` of the GraphQL adapter */
type SourceAdapterType = SocketAdapter<
  { id: string },
  undefined,
  { source?: UntypedSource | TypedSource<any, any>; label?: string }
>;

declare const socket: Socket<SourceAdapterType>;

type Price = { symbol: string; price: number };
declare const priceSource: TypedSource<Price, { symbol: string }>;
declare const tickSource: TypedSource<{ tick: number }, { [key: string]: never }>;
declare const untypedSource: UntypedSource;

// The listeners are only created in the types - the declared socket does not exist at runtime
const createPriceListener = () => socket.createListener()({ topic: "prices", options: { source: priceSource } });
const createTickListener = () => socket.createListener()({ topic: "ticks", options: { source: tickSource } });
const createUntypedListener = () => socket.createListener()({ topic: "any", options: { source: untypedSource } });
const createDeclaredListener = () =>
  socket.createListener<{ declared: true }, { id: number }>()({ topic: "prices", options: { source: priceSource } });
const createBatchedListener = () =>
  socket.createListener()({
    topic: "prices",
    options: { source: priceSource },
    delivery: { strategy: "batch", interval: 100 },
  });

describe("Listener [ Typed options ]", () => {
  describe("when a listener option is typed", () => {
    it("should take the response and the payload from it", () => {
      type PriceListener = ReturnType<typeof createPriceListener>;

      expectTypeOf<ExtractListenerResponseType<PriceListener>>().toEqualTypeOf<Price>();
      expectTypeOf<ExtractListenerPayloadType<PriceListener>>().toEqualTypeOf<{ symbol: string }>();
      expectTypeOf<Parameters<PriceListener["listen"]>[0]>().toEqualTypeOf<
        ListenerCallbackType<SourceAdapterType, Price>
      >();
      expect(true).toBeTrue();
    });

    it("should require the payload the option declares", () => {
      type PriceListener = ReturnType<typeof createPriceListener>;

      expectTypeOf<PriceListener["listen"]>().toBeCallableWith(() => null, { payload: { symbol: "BTC" } });
      // @ts-expect-error the payload is required
      expectTypeOf<PriceListener["listen"]>().toBeCallableWith(() => null);
      expect(true).toBeTrue();
    });

    it("should not need a payload when the option declares none", () => {
      type TickListener = ReturnType<typeof createTickListener>;

      expectTypeOf<ExtractListenerPayloadType<TickListener>>().toEqualTypeOf<undefined>();
      expectTypeOf<TickListener["listen"]>().toBeCallableWith(() => null);
      expect(true).toBeTrue();
    });

    it("should keep the declared generics", () => {
      type DeclaredListener = ReturnType<typeof createDeclaredListener>;

      expectTypeOf<ExtractListenerResponseType<DeclaredListener>>().toEqualTypeOf<{ declared: true }>();
      expectTypeOf<ExtractListenerPayloadType<DeclaredListener>>().toEqualTypeOf<{ id: number }>();
      expect(true).toBeTrue();
    });

    it("should type the delivery with the response of the option", () => {
      type BatchedListener = ReturnType<typeof createBatchedListener>;

      expectTypeOf<ExtractListenerDeliveredType<BatchedListener>>().toEqualTypeOf<Price[]>();
      expect(true).toBeTrue();
    });
  });

  describe("when no listener option is typed", () => {
    it("should keep the response unknown and the payload undefined", () => {
      type UntypedListener = ReturnType<typeof createUntypedListener>;

      expectTypeOf<ExtractListenerResponseType<UntypedListener>>().toEqualTypeOf<unknown>();
      expectTypeOf<ExtractListenerPayloadType<UntypedListener>>().toEqualTypeOf<undefined>();
      expect(true).toBeTrue();
    });

    it("should keep the listeners of adapters without listener options as they were", () => {
      const websocket = new Socket({ url: "ws://localhost:3000", adapterOptions: { autoConnect: false } });
      const listener = websocket.createListener<Price, { symbol: string }>()({ topic: "prices" });
      const plain = websocket.createListener()({ topic: "plain" });

      expectTypeOf<ExtractListenerResponseType<typeof listener>>().toEqualTypeOf<Price>();
      expectTypeOf<ExtractListenerPayloadType<typeof listener>>().toEqualTypeOf<{ symbol: string }>();
      expectTypeOf<ExtractListenerResponseType<typeof plain>>().toEqualTypeOf<unknown>();
      expectTypeOf<ExtractListenerPayloadType<typeof plain>>().toEqualTypeOf<undefined>();
      expect(listener.topic).toBe("prices");
    });

    it("should reject options the adapter does not declare", () => {
      // @ts-expect-error label is a string
      const create = () => socket.createListener()({ topic: "prices", options: { label: 1 } });

      expectTypeOf(create).toBeFunction();
      expect(true).toBeTrue();
    });
  });
});
