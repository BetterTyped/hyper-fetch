import type { ListenerDeliveryType } from "delivery";
import { createDeliveryStrategy } from "delivery";
import type { ExtendListener, Listener, ListenerInstance, ListenerModel } from "listener";
import { Socket } from "socket";
import type { ExtractListenerDeliveredType, ExtractListenerResponseType } from "types";
import { expectTypeOf } from "vitest";

type Price = { symbol: string; value: number };
type Summary = { count: number; last: Price };

const socket = new Socket({ url: "ws://localhost:3000" });

const summarize = createDeliveryStrategy<Price, Summary>(({ deliver }) => ({
  push: ({ data, extra }) => deliver({ data: { count: 1, last: data }, extra }),
  dispose: () => null,
}));

const plain = socket.createListener<Price>()({ topic: "prices" });
const latest = socket.createListener<Price>()({ topic: "prices", delivery: { strategy: "latest", interval: 16 } });
const batch = socket.createListener<Price>()({ topic: "prices", delivery: { strategy: "batch", interval: 100 } });
const custom = socket.createListener<Price>()({ topic: "prices", delivery: summarize });

describe("Delivery [ TypeScript ]", () => {
  it("should type callback data by strategy", () => {
    plain.listen(({ data }) => expectTypeOf(data).toEqualTypeOf<Price>());
    latest.listen(({ data }) => expectTypeOf(data).toEqualTypeOf<Price>());
    batch.listen(({ data }) => expectTypeOf(data).toEqualTypeOf<Price[]>());
    custom.listen(({ data }) => expectTypeOf(data).toEqualTypeOf<Summary>());
    expect(true).toBeTrue();
  });

  it("should keep the response type as the wire type", () => {
    expectTypeOf<ExtractListenerResponseType<typeof batch>>().toEqualTypeOf<Price>();
    expectTypeOf<ExtractListenerDeliveredType<typeof batch>>().toEqualTypeOf<Price[]>();
    expectTypeOf<ExtractListenerResponseType<typeof custom>>().toEqualTypeOf<Price>();
    expectTypeOf<ExtractListenerDeliveredType<typeof custom>>().toEqualTypeOf<Summary>();
    expectTypeOf<ExtractListenerDeliveredType<typeof plain>>().toEqualTypeOf<Price>();
    expect(true).toBeTrue();
  });

  it("should re-type through setDelivery", () => {
    const rebatched = plain.setDelivery({ strategy: "batch", interval: 50 });
    expectTypeOf<ExtractListenerDeliveredType<typeof rebatched>>().toEqualTypeOf<Price[]>();
    const cleared = batch.setDelivery(undefined);
    expectTypeOf<ExtractListenerDeliveredType<typeof cleared>>().toEqualTypeOf<Price>();
    const withParams = socket
      .createListener<Price>()({ topic: "prices/:symbol", delivery: { strategy: "batch", interval: 50 } })
      .setParams({ symbol: "BTC" });
    expectTypeOf<ExtractListenerDeliveredType<typeof withParams>>().toEqualTypeOf<Price[]>();
    expect(true).toBeTrue();
  });

  it("should satisfy ListenerInstance constraints regardless of delivery", () => {
    expectTypeOf(batch).toMatchTypeOf<ListenerInstance>();
    expectTypeOf(batch).toMatchTypeOf<ListenerInstance<{ response: Price }>>();
    expectTypeOf(custom).toMatchTypeOf<ListenerInstance<{ response: Price }>>();
    // covariance guard - partial constraints keep matching wider responses
    expectTypeOf(plain).toMatchTypeOf<ListenerInstance<{ response: { symbol: string } }>>();
    expectTypeOf(batch).toMatchTypeOf<ListenerInstance<{ response: { symbol: string } }>>();
    expect(true).toBeTrue();
  });

  it("should default ListenerModel delivered to response", () => {
    type Model = ListenerModel<{ response: Price; topic: "prices" }>;
    type Batched = ListenerModel<{ response: Price; topic: "prices"; delivered: Price[] }>;
    expectTypeOf<ExtractListenerDeliveredType<Model>>().toEqualTypeOf<Price>();
    expectTypeOf<ExtractListenerDeliveredType<Batched>>().toEqualTypeOf<Price[]>();
    expect(true).toBeTrue();
  });

  it("should follow the response override in ExtendListener", () => {
    type Overridden = ExtendListener<ListenerInstance, { response: Price }>;
    type Kept = ExtendListener<typeof batch, { topic: "other" }>;
    type Explicit = ExtendListener<typeof plain, { delivered: Summary }>;
    expectTypeOf<ExtractListenerDeliveredType<Overridden>>().toEqualTypeOf<Price>();
    expectTypeOf<ExtractListenerDeliveredType<Kept>>().toEqualTypeOf<Price[]>();
    expectTypeOf<ExtractListenerDeliveredType<Explicit>>().toEqualTypeOf<Summary>();
    expect(true).toBeTrue();
  });

  it("should reject invalid presets", () => {
    const invalid = () => {
      // @ts-expect-error unknown strategy
      socket.createListener<Price>()({ topic: "prices", delivery: { strategy: "nope", interval: 1 } });
      // @ts-expect-error interval is required
      socket.createListener<Price>()({ topic: "prices", delivery: { strategy: "latest" } });
    };
    expect(invalid).toBeFunction();
  });

  it("should accept preset options", () => {
    const withLeading = socket.createListener<Price>()({
      topic: "prices",
      delivery: { strategy: "latest", interval: 16, leading: false },
    });
    const withMax = socket.createListener<Price>()({
      topic: "prices",
      delivery: { strategy: "batch", interval: 16, maxSize: 10 },
    });
    expectTypeOf<ExtractListenerDeliveredType<typeof withLeading>>().toEqualTypeOf<Price>();
    expectTypeOf<ExtractListenerDeliveredType<typeof withMax>>().toEqualTypeOf<Price[]>();
    expect(true).toBeTrue();
  });

  it("should type setDelivery with a custom strategy", () => {
    const summarized = plain.setDelivery(summarize);
    expectTypeOf<ExtractListenerDeliveredType<typeof summarized>>().toEqualTypeOf<Summary>();
    expectTypeOf<ExtractListenerResponseType<typeof summarized>>().toEqualTypeOf<Price>();
    summarized.listen(({ data }) => expectTypeOf(data).toEqualTypeOf<Summary>());
    expect(true).toBeTrue();
  });

  it("should reject a strategy whose input does not match the response", () => {
    const wrongInput = createDeliveryStrategy<{ other: string }, number>(({ deliver }) => ({
      push: ({ extra }) => deliver({ data: 1, extra }),
      dispose: () => null,
    }));
    // @ts-expect-error input type mismatch
    const invalid = () => socket.createListener<Price>()({ topic: "prices", delivery: wrongInput });
    expect(invalid).toBeFunction();
  });

  it("should keep the delivered type through clone and params", () => {
    const cloned = batch.clone();
    expectTypeOf<ExtractListenerDeliveredType<typeof cloned>>().toEqualTypeOf<Price[]>();
    const dynamic = socket.createListener<Price>()({ topic: "prices/:id", delivery: summarize });
    const bound = dynamic.setParams({ id: 1 });
    expectTypeOf<ExtractListenerDeliveredType<typeof bound>>().toEqualTypeOf<Summary>();
    bound.listen(({ data }) => expectTypeOf(data).toEqualTypeOf<Summary>());
    expect(true).toBeTrue();
  });

  it("should expose delivery with a loose type on the instance", () => {
    expectTypeOf(batch.delivery).toMatchTypeOf<ListenerDeliveryType | undefined>();
    expectTypeOf(batch.listenerOptions.delivery).toMatchTypeOf<ListenerDeliveryType | undefined>();
    expect(true).toBeTrue();
  });

  it("should type the raw Listener generics", () => {
    expectTypeOf<Listener<Price, "prices", typeof socket>>().toMatchTypeOf<ListenerInstance<{ delivered: Price }>>();
    expect(true).toBeTrue();
  });
});
