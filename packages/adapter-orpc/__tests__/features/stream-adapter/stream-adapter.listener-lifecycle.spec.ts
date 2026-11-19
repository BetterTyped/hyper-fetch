import type { ExtendListener } from "@hyper-fetch/sockets";
import { ORPCError } from "@orpc/client";

import { createControlledFetch, flushPromises } from "../../utils/controlled-fetch";
import { asSocketError } from "../../utils/socket-error";
import { createStreamSocket, serialize } from "../../utils/stream-socket";

const defaultPayload = { id: 1 };

describe("Orpc Stream Adapter [ Listener lifecycle ]", () => {
  let server = createControlledFetch();
  let setup = createStreamSocket();

  /** Listens and records the data, the starts and the ends of the subscription in order */
  // Any delivered type - batched listeners deliver arrays
  const listen = (
    payload: { id: number } = defaultPayload,
    listener: ExtendListener<typeof setup.onUpdate, { delivered: unknown }> = setup.onUpdate,
  ) => {
    const log: unknown[] = [];
    const onStart = vi.fn(() => log.push("start"));
    const onEnd = vi.fn(({ error }: { error: Error | null }) => log.push({ end: error }));
    const unsubscribe = listener.listen(({ data }) => log.push(data), { payload, onStart, onEnd });
    return { log, onStart, onEnd, unsubscribe };
  };

  const advance = async (ms: number) => {
    vi.advanceTimersByTime(ms);
    await flushPromises();
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

  describe("when the server confirms the subscription", () => {
    it("should start the listener when the event stream answers", async () => {
      const { onStart } = listen();
      await flushPromises();
      expect(onStart).not.toHaveBeenCalled();

      server.last().open();
      await flushPromises();

      expect(onStart).toHaveBeenCalledExactlyOnceWith({ topic: "planet/onUpdate" });
    });

    it("should start a listener that joins a confirmed subscription right away, and only that one", async () => {
      const first = listen();
      await flushPromises();
      server.last().open();
      await flushPromises();

      const second = listen();

      expect(second.onStart).toHaveBeenCalledOnce();
      expect(first.onStart).toHaveBeenCalledOnce();
      expect(server.calls).toHaveLength(1);
    });

    it("should start a listener that joined before the confirmation with the others", async () => {
      const first = listen();
      const second = listen();
      await flushPromises();

      server.last().open();
      await flushPromises();

      expect(first.onStart).toHaveBeenCalledOnce();
      expect(second.onStart).toHaveBeenCalledOnce();
    });

    it("should not start the listener of a subscription that left while the response was on its way", async () => {
      const { onStart, unsubscribe } = listen();
      await flushPromises();

      server.last().open();
      unsubscribe();
      await flushPromises();

      expect(onStart).not.toHaveBeenCalled();
      expect(setup.errors).toStrictEqual([]);
    });

    it("should start the listeners again when a restarted stream is confirmed", async () => {
      const { onStart, onEnd } = listen();
      await flushPromises();
      server.last().open();
      await flushPromises();

      server.last().break();
      await flushPromises();
      const late = listen();
      await advance(5000);
      expect(late.onStart).not.toHaveBeenCalled();
      server.last().open();
      await flushPromises();

      expect(onStart).toHaveBeenCalledTimes(2);
      expect(late.onStart).toHaveBeenCalledOnce();
      expect(onEnd).not.toHaveBeenCalled();
    });

    it("should start the listeners again after a reconnect", async () => {
      const { onStart } = listen();
      await flushPromises();
      server.last().open();
      await flushPromises();

      await setup.socket.reconnect();
      await flushPromises();
      server.last().open();
      await flushPromises();

      expect(onStart).toHaveBeenCalledTimes(2);
    });
  });

  describe("when the server ends the subscription", () => {
    it("should end the listeners without an error after the last value of a finished iterator", async () => {
      const first = listen();
      const second = listen();
      await flushPromises();
      server.last().open();
      server.last().send({ data: serialize({ id: 1, name: "last" }) });
      server.last().send({ event: "done" });
      await flushPromises();

      expect(first.log).toStrictEqual(["start", { id: 1, name: "last" }, { end: null }]);
      expect(second.onEnd).toHaveBeenCalledExactlyOnceWith({ topic: "planet/onUpdate", error: null });
      expect(setup.socket.adapter.listeners.get("planet/onUpdate")?.size ?? 0).toBe(0);
      expect(setup.errors).toStrictEqual([]);
    });

    it("should end the listeners when the server closes the stream", async () => {
      const { onEnd } = listen();
      await flushPromises();
      server.last().open();
      server.last().close();
      await flushPromises();

      expect(onEnd).toHaveBeenCalledExactlyOnceWith({ topic: "planet/onUpdate", error: null });
    });

    it("should end the listeners with the OrpcSocketError of an error event", async () => {
      const { onEnd, log } = listen();
      await flushPromises();
      server.last().open();
      server.last().send({
        event: "error",
        data: serialize({ defined: true, code: "OVERHEATED", status: 500, message: "Too hot", data: { celsius: 900 } }),
      });
      await flushPromises();

      const error = asSocketError(onEnd.mock.calls[0][0].error);
      expect(error).toMatchObject({ code: "OVERHEATED", defined: true, topic: "planet/onUpdate", payload: { id: 1 } });
      expect(error.cause).toBeInstanceOf(ORPCError);
      // The same error reaches socket.onError
      expect(setup.errors).toStrictEqual([error]);
      expect(log).toStrictEqual(["start", { end: error }]);
    });

    it.each([
      [
        "a rejected call",
        {
          status: 401,
          body: JSON.stringify(serialize({ defined: false, code: "UNAUTHORIZED", status: 401, message: "No" })),
        },
      ],
      ["a procedure that is not an event iterator", { body: "{}" }],
    ])("should end the listeners with the error of %s", async (_, response) => {
      const { onStart, onEnd } = listen();
      await flushPromises();

      server.last().respond(response);
      await flushPromises();

      expect(onStart).not.toHaveBeenCalled();
      expect(asSocketError(onEnd.mock.calls[0][0].error)).toBe(setup.errors[0]);
    });

    it("should end the listeners when the stream stops restarting", async () => {
      await setup.socket.disconnect();
      setup = createStreamSocket({ reconnect: 0 });
      const { onEnd } = listen();
      await flushPromises();

      server.last().fail();
      await flushPromises();

      expect(setup.errors).toHaveLength(2);
      expect(onEnd).toHaveBeenCalledExactlyOnceWith({ topic: "planet/onUpdate", error: setup.errors[1] });
    });

    it("should not end the listeners on a failure the stream recovers from", async () => {
      const { onEnd } = listen();
      await flushPromises();

      server.last().fail();
      await flushPromises();
      await advance(5000);

      expect(onEnd).not.toHaveBeenCalled();
      expect(server.calls).toHaveLength(2);
    });

    it("should not abort the request again or start it on reconnect", async () => {
      listen();
      await flushPromises();
      server.last().open();
      server.last().close();
      await flushPromises();

      await setup.socket.reconnect();
      await flushPromises();
      await advance(60_000);

      expect(server.calls).toHaveLength(1);
    });

    it("should keep the subscriptions of other inputs", async () => {
      const one = listen({ id: 1 });
      const two = listen({ id: 2 });
      await flushPromises();
      const [callOne, callTwo] = server.calls;
      callOne.open();
      callTwo.open();

      callOne.send({ event: "done" });
      callTwo.send({ data: serialize({ id: 2, name: "two" }) });
      await flushPromises();

      expect(one.onEnd).toHaveBeenCalledOnce();
      expect(two.onEnd).not.toHaveBeenCalled();
      expect(two.log).toStrictEqual(["start", { id: 2, name: "two" }]);
      expect(callTwo.aborted).toBeFalse();
    });

    it("should deliver the batch of a delivery strategy before the end", async () => {
      const batched = setup.onUpdate.setDelivery({ strategy: "batch", interval: 1000 });
      const { log } = listen({ id: 1 }, batched);
      await flushPromises();
      server.last().open();
      server.last().send({ data: serialize({ id: 1, name: "a" }) });
      server.last().send({ data: serialize({ id: 1, name: "b" }) });
      server.last().send({ event: "done" });
      await flushPromises();

      expect(log).toStrictEqual([
        "start",
        [
          { id: 1, name: "a" },
          { id: 1, name: "b" },
        ],
        { end: null },
      ]);
    });

    it("should start a new subscription when a listener of the ended one listens again in onEnd", async () => {
      const again = vi.fn();
      setup.onUpdate.listen(vi.fn(), {
        payload: { id: 1 },
        onEnd: () => {
          setup.onUpdate.listen(again, { payload: { id: 1 } });
        },
      });
      await flushPromises();
      server.last().open();
      server.last().send({ event: "done" });
      await flushPromises();
      server.last().open();
      server.last().send({ data: serialize({ id: 1, name: "again" }) });
      await flushPromises();

      expect(server.calls).toHaveLength(2);
      expect(server.calls[0].aborted).toBeTrue();
      expect(server.calls[1].aborted).toBeFalse();
      expect(again).toHaveBeenCalledOnce();
    });
  });
});
