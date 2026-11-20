import { createControlledFetch, flushPromises } from "../../utils/controlled-fetch";
import { createStreamSocket, serialize } from "../../utils/stream-socket";

const defaultPayload = { id: 1 };

describe("Orpc Stream Adapter [ Subscriptions ]", () => {
  let server = createControlledFetch();
  let setup = createStreamSocket();

  const subscribe = (payload: { id: number } = defaultPayload) => {
    const callback = vi.fn();
    const unsubscribe = setup.onUpdate.setPayload(payload).listen(({ data }) => callback(data));
    return { callback, unsubscribe };
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    server = createControlledFetch();
    setup = createStreamSocket();
    await flushPromises();
  });

  afterEach(async () => {
    await setup.socket.disconnect();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("when listeners share the payload", () => {
    it("should open one stream for every listener", async () => {
      const first = subscribe();
      const second = subscribe({ id: 1 });
      await flushPromises();
      server.last().open();
      server.last().send({ data: serialize({ id: 1, name: "a" }) });
      await flushPromises();

      expect(server.calls).toHaveLength(1);
      expect(first.callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "a" });
      expect(second.callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "a" });
    });

    it("should keep the stream until the last listener unsubscribes", async () => {
      const first = subscribe();
      const second = subscribe();
      await flushPromises();
      const call = server.last();
      call.open();

      first.unsubscribe();
      call.send({ data: serialize({ id: 1, name: "a" }) });
      await flushPromises();
      expect(call.aborted).toBeFalse();
      expect(first.callback).not.toHaveBeenCalled();
      expect(second.callback).toHaveBeenCalledOnce();

      second.unsubscribe();
      await flushPromises();
      expect(call.aborted).toBeTrue();
      expect(setup.socket.adapter.listeners.get("planet/onUpdate")?.size).toBe(0);
      expect(setup.errors).toStrictEqual([]);
    });

    it("should abort a stream that did not open yet", async () => {
      const { unsubscribe } = subscribe();
      await flushPromises();

      unsubscribe();
      await flushPromises();
      vi.advanceTimersByTime(60_000);
      await flushPromises();

      expect(server.last().aborted).toBeTrue();
      expect(server.calls).toHaveLength(1);
      expect(setup.errors).toStrictEqual([]);
    });

    it("should ignore the rejection of a stream aborted while reading the error body", async () => {
      const { unsubscribe } = subscribe();
      await flushPromises();

      server.last().respond({ status: 500, body: JSON.stringify(serialize({ code: "X" })) });
      unsubscribe();
      await flushPromises();

      expect(setup.errors).toStrictEqual([]);
    });

    it("should start a new stream without the last event id after every listener left", async () => {
      const { unsubscribe } = subscribe();
      await flushPromises();
      server.last().open();
      server.last().send({ data: serialize({ id: 1, name: "a" }), id: "4" });
      await flushPromises();

      unsubscribe();
      subscribe();
      await flushPromises();

      expect(server.calls).toHaveLength(2);
      expect(server.last().headers["last-event-id"]).toBeUndefined();
    });

    it("should share the stream of inputs equal in the wire format", async () => {
      const listener = setup.socket.createListener<number, { at: Date }>()({ topic: "since" });
      listener.listen(vi.fn(), { payload: { at: new Date(0) } });
      listener.listen(vi.fn(), { payload: { at: new Date(0) } });
      listener.listen(vi.fn(), { payload: { at: new Date(1) } });
      await flushPromises();

      expect(server.calls).toHaveLength(2);
    });

    it("should keep the stream until every listen call of the same callback unsubscribed", async () => {
      const callback = vi.fn();
      const listener = setup.onUpdate.setPayload({ id: 1 });
      const first = listener.listen(callback);
      const second = listener.listen(callback);
      await flushPromises();
      const call = server.last();
      call.open();

      first();
      await flushPromises();
      expect(call.aborted).toBeFalse();
      call.send({ data: serialize({ id: 1, name: "a" }) });
      await flushPromises();
      expect(callback).toHaveBeenCalledOnce();

      second();
      await flushPromises();
      expect(call.aborted).toBeTrue();
      expect(server.calls).toHaveLength(1);
    });
  });

  describe("when listeners have different payloads", () => {
    it("should open a stream for every payload and keep their messages apart", async () => {
      const one = subscribe({ id: 1 });
      const two = subscribe({ id: 2 });
      await flushPromises();
      const [callOne, callTwo] = server.calls;
      callOne.open();
      callTwo.open();

      callOne.send({ data: serialize({ id: 1, name: "one" }) });
      callTwo.send({ data: serialize({ id: 2, name: "two" }) });
      await flushPromises();

      expect(callOne.body).toStrictEqual({ json: { id: 1 } });
      expect(callTwo.body).toStrictEqual({ json: { id: 2 } });
      expect(one.callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "one" });
      expect(two.callback).toHaveBeenCalledExactlyOnceWith({ id: 2, name: "two" });
    });

    it("should abort only the stream of the payload that lost its listeners", async () => {
      const one = subscribe({ id: 1 });
      subscribe({ id: 2 });
      await flushPromises();

      one.unsubscribe();
      await flushPromises();

      expect(server.calls.map((call) => call.aborted)).toStrictEqual([true, false]);
    });

    it("should keep two streams for one callback listening with two payloads", async () => {
      const callback = vi.fn();
      const stopOne = setup.onUpdate.listen(callback, { payload: { id: 1 } });
      setup.onUpdate.listen(callback, { payload: { id: 2 } });
      await flushPromises();
      const [callOne, callTwo] = server.calls;
      callOne.open();
      callTwo.open();

      stopOne();
      await flushPromises();
      callOne.send({ data: serialize({ id: 1, name: "one" }) });
      callTwo.send({ data: serialize({ id: 2, name: "two" }) });
      await flushPromises();

      expect(server.calls.map((call) => call.body)).toStrictEqual([{ json: { id: 1 } }, { json: { id: 2 } }]);
      expect([callOne.aborted, callTwo.aborted]).toStrictEqual([true, false]);
      expect(callback).toHaveBeenCalledExactlyOnceWith({
        data: { id: 2, name: "two" },
        extra: { id: undefined, retry: undefined },
      });
    });

    it("should keep the streams of the same payload on another topic apart", async () => {
      const other = setup.socket.createListener<number, { id: number }>()({ topic: "planet/onDelete" });
      const callback = vi.fn();
      subscribe({ id: 1 });
      other.listen(({ data }) => callback(data), { payload: { id: 1 } });
      await flushPromises();

      expect(server.calls.map((call) => call.url.split("/").at(-1))).toStrictEqual(["onUpdate", "onDelete"]);
    });
  });

  describe("when a listener unsubscribes while messages are delivered", () => {
    it("should not deliver the rest of the chunk after the last listener left", async () => {
      const callback = vi.fn();
      const unsubscribe = setup.onUpdate.setPayload({ id: 1 }).listen(({ data }) => {
        callback(data);
        unsubscribe();
      });
      await flushPromises();
      const call = server.last();
      call.open();

      call.write(
        `data: ${JSON.stringify(serialize({ id: 1, name: "a" }))}\n\ndata: ${JSON.stringify(serialize({ id: 1, name: "b" }))}\n\n`,
      );
      await flushPromises();

      expect(callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "a" });
      expect(call.aborted).toBeTrue();
      expect(setup.errors).toStrictEqual([]);
    });
  });

  describe("when the server ended a subscription", () => {
    it.each([
      ["done", { event: "done" }],
      ["error", { event: "error", data: serialize({ defined: false, code: "X", status: 500, message: "x" }) }],
    ])("should start a new one without the last event id after the %s event", async (_, end) => {
      const first = subscribe();
      await flushPromises();
      server.last().open();
      server.last().send({ data: serialize({ id: 1, name: "a" }), id: "8" });
      server.last().send(end);
      await flushPromises();

      const second = subscribe();
      await flushPromises();
      server.last().open();
      server.last().send({ data: serialize({ id: 1, name: "b" }) });
      await flushPromises();

      expect(server.calls).toHaveLength(2);
      expect(server.last().headers["last-event-id"]).toBeUndefined();
      // The listener of the ended subscription unsubscribed with it
      expect(first.callback.mock.calls).toStrictEqual([[{ id: 1, name: "a" }]]);
      expect(second.callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "b" });
    });
  });

  describe("when using a delivery strategy", () => {
    it("should batch the messages of the subscription", async () => {
      const callback = vi.fn();
      setup.onUpdate
        .setPayload({ id: 1 })
        .setDelivery({ strategy: "batch", interval: 50 })
        .listen(({ data }) => callback(data));
      await flushPromises();
      server.last().open();

      server.last().send({ data: serialize({ id: 1, name: "a" }) });
      server.last().send({ data: serialize({ id: 1, name: "b" }) });
      await flushPromises();
      vi.advanceTimersByTime(50);

      expect(callback).toHaveBeenCalledExactlyOnceWith([
        { id: 1, name: "a" },
        { id: 1, name: "b" },
      ]);
    });
  });
});
