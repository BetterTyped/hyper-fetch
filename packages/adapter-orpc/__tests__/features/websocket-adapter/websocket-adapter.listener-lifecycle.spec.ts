import type { ExtendListener } from "@hyper-fetch/sockets";
import { ORPCError } from "@orpc/client";

import { flushPromises } from "../../utils/controlled-fetch";
import type { ControlledWebSocket } from "../../utils/controlled-websocket";
import { installControlledWebSocket } from "../../utils/controlled-websocket";
import { asSocketError } from "../../utils/socket-error";
import { serialize } from "../../utils/stream-socket";
import { createWebsocketSocket } from "../../utils/websocket-socket";

const defaultPayload = { id: 1 };

describe("Orpc Websocket Adapter [ Listener lifecycle ]", () => {
  let Controlled = installControlledWebSocket();
  let setup = createWebsocketSocket();
  let ws: ControlledWebSocket;

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

  const open = async () => {
    await flushPromises();
    ws = Controlled.last;
    ws.serverOpen();
    await flushPromises();
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    Controlled = installControlledWebSocket();
    setup = createWebsocketSocket();
    await open();
  });

  afterEach(async () => {
    await setup.socket.disconnect();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe("when the server confirms the subscription", () => {
    it("should start the listener on the response of the event iterator", () => {
      const { onStart } = listen();
      ws.serverEvent("1", { data: serialize({ id: 1, name: "early" }) });
      expect(onStart).not.toHaveBeenCalled();

      ws.serverStartIterator("1");

      expect(onStart).toHaveBeenCalledExactlyOnceWith({ topic: "planet/onUpdate" });
    });

    it("should start a listener that joins a confirmed subscription right away, and only that one", () => {
      const first = listen();
      ws.serverStartIterator("1");

      const second = listen();

      expect(first.onStart).toHaveBeenCalledOnce();
      expect(second.onStart).toHaveBeenCalledOnce();
      expect(ws.requests).toHaveLength(1);
    });

    it("should start the listeners again when the subscription is confirmed after a reconnect", async () => {
      const { onStart, onEnd } = listen();
      ws.serverStartIterator("1");

      ws.serverClose({ code: 1006 });
      await flushPromises();
      const late = listen();
      expect(late.onStart).not.toHaveBeenCalled();
      vi.advanceTimersByTime(5000);
      await open();
      ws.serverStartIterator(ws.requests[0].i);

      expect(onStart).toHaveBeenCalledTimes(2);
      expect(late.onStart).toHaveBeenCalledOnce();
      expect(onEnd).not.toHaveBeenCalled();
    });
  });

  describe("when the server ends the subscription", () => {
    it("should end the listeners without an error after the last value of a finished iterator", () => {
      const first = listen();
      const second = listen();
      ws.serverStartIterator("1");

      ws.serverEvent("1", { data: serialize({ id: 1, name: "last" }) });
      ws.serverEvent("1", { event: "done" });

      expect(first.log).toStrictEqual(["start", { id: 1, name: "last" }, { end: null }]);
      expect(second.onEnd).toHaveBeenCalledExactlyOnceWith({ topic: "planet/onUpdate", error: null });
      expect(ws.aborts).toStrictEqual([]);
      expect(setup.socket.adapter.listeners.get("planet/onUpdate")?.size ?? 0).toBe(0);
    });

    it("should end the listeners with the OrpcSocketError of an error event", () => {
      const { onEnd, log } = listen();
      ws.serverStartIterator("1");

      ws.serverEvent("1", {
        event: "error",
        data: serialize({ defined: true, code: "OVERHEATED", status: 500, message: "Too hot", data: { celsius: 900 } }),
      });

      const error = asSocketError(onEnd.mock.calls[0][0].error);
      expect(error).toMatchObject({ code: "OVERHEATED", defined: true, topic: "planet/onUpdate", payload: { id: 1 } });
      expect(error.cause).toBeInstanceOf(ORPCError);
      expect(setup.errors).toStrictEqual([error]);
      expect(log).toStrictEqual(["start", { end: error }]);
      expect(ws.aborts).toStrictEqual([]);
    });

    it.each([
      [
        "a rejected call",
        { s: 401, b: serialize({ defined: false, code: "UNAUTHORIZED", status: 401, message: "No" }) },
      ],
      ["a procedure that is not an event iterator", { b: serialize(1) }],
    ])("should end the listeners with the error of %s", (_, payload) => {
      const { onStart, onEnd } = listen();

      ws.serverMessage({ i: "1", p: payload });

      expect(onStart).not.toHaveBeenCalled();
      expect(asSocketError(onEnd.mock.calls[0][0].error)).toBe(setup.errors[0]);
      expect(ws.aborts).toStrictEqual([]);
    });

    it("should end the listeners of an input that can't be encoded", () => {
      const upload = setup.socket.createListener<number, { file: Blob }>()({ topic: "upload/progress" });
      const onEnd = vi.fn();

      upload.listen(vi.fn(), { payload: { file: new Blob(["x"]) }, onEnd });

      expect(onEnd).toHaveBeenCalledExactlyOnceWith({ topic: "upload/progress", error: setup.errors[0] });
      expect(ws.sent).toStrictEqual([]);
    });

    it("should not end the listeners when the connection drops", async () => {
      const { onEnd } = listen();
      ws.serverStartIterator("1");

      ws.serverClose({ code: 1006 });
      await flushPromises();

      expect(onEnd).not.toHaveBeenCalled();
    });

    it("should not start a subscription the server ended after a reconnect", async () => {
      listen();
      ws.serverStartIterator("1");
      ws.serverEvent("1", { event: "done" });
      const ended = ws;

      setup.socket.reconnect();
      await open();

      expect(ended.requests).toHaveLength(1);
      expect(ws).not.toBe(ended);
      expect(ws.sent).toStrictEqual([]);
    });

    it("should keep the subscriptions of other inputs", () => {
      const one = listen({ id: 1 });
      const two = listen({ id: 2 });
      ws.serverStartIterator("1");
      ws.serverStartIterator("2");

      ws.serverEvent("1", { event: "done" });
      ws.serverEvent("2", { data: serialize({ id: 2, name: "two" }) });

      expect(one.onEnd).toHaveBeenCalledOnce();
      expect(two.onEnd).not.toHaveBeenCalled();
      expect(two.log).toStrictEqual(["start", { id: 2, name: "two" }]);
      expect(ws.aborts).toStrictEqual([]);
    });

    it("should deliver the batch of a delivery strategy before the end", () => {
      const batched = setup.onUpdate.setDelivery({ strategy: "batch", interval: 1000 });
      const { log } = listen({ id: 1 }, batched);
      ws.serverStartIterator("1");

      ws.serverEvent("1", { data: serialize({ id: 1, name: "a" }) });
      ws.serverEvent("1", { data: serialize({ id: 1, name: "b" }) });
      ws.serverEvent("1", { event: "done" });

      expect(log).toStrictEqual([
        "start",
        [
          { id: 1, name: "a" },
          { id: 1, name: "b" },
        ],
        { end: null },
      ]);
    });

    it("should start a new subscription without the last event id when a listener listens again", () => {
      listen();
      ws.serverEvent("1", { data: serialize({ id: 1, name: "a" }), meta: { id: "4" } });
      ws.serverEvent("1", { event: "done" });

      const again = listen();
      ws.serverStartIterator("2");

      expect(ws.requests.map(({ i, p }) => [i, p?.h])).toStrictEqual([
        ["1", undefined],
        ["2", undefined],
      ]);
      expect(again.onStart).toHaveBeenCalledOnce();
    });
  });
});
