import { ErrorEvent, ORPCError } from "@orpc/client";
import type { StandardRPCCustomJsonSerializer } from "@orpc/client/standard";

import { flushPromises } from "../../utils/controlled-fetch";
import type { ControlledWebSocket } from "../../utils/controlled-websocket";
import { installControlledWebSocket } from "../../utils/controlled-websocket";
import { asSocketError } from "../../utils/socket-error";
import type { Planet } from "../../utils/stream-socket";
import { serialize } from "../../utils/stream-socket";
import { createWebsocketSocket, websocketUrl } from "../../utils/websocket-socket";

const defaultPayload = { id: 1 };

describe("Orpc Websocket Adapter [ Protocol ]", () => {
  let Controlled = installControlledWebSocket();
  let setup = createWebsocketSocket();
  let ws: ControlledWebSocket;

  const open = async () => {
    await flushPromises();
    ws = Controlled.last;
    ws.serverOpen();
    await flushPromises();
    return ws;
  };

  /** Subscribes and starts the iterator on the server, returns the request id */
  const subscribe = (payload: { id: number } = defaultPayload) => {
    const callback = vi.fn();
    const unsubscribe = setup.onUpdate.setPayload(payload).listen(({ data, extra }) => callback(data, extra));
    const request = ws.requests.at(-1);
    if (!request) {
      throw new Error("No request was sent");
    }
    return { callback, unsubscribe, id: request.i };
  };

  const subscribeRunning = (payload: { id: number } = defaultPayload) => {
    const subscription = subscribe(payload);
    ws.serverStartIterator(subscription.id);
    return subscription;
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

  describe("when connecting", () => {
    it("should open one connection to the socket url", () => {
      expect(Controlled.instances).toHaveLength(1);
      expect(ws.url).toBe(websocketUrl);
      expect(ws.binaryType).toBe("arraybuffer");
      expect(setup.socket.adapter.connected).toBeTrue();
    });

    it("should pass the query params and the protocols", async () => {
      await setup.socket.disconnect();
      setup = createWebsocketSocket({ adapterOptions: { protocols: ["orpc"] } });
      setup.socket.setQueryParams({ token: "abc" });
      await open();

      expect(ws.url).toBe(`${websocketUrl}?token=abc`);
      expect(ws.protocols).toStrictEqual(["orpc"]);
    });
  });

  describe("when subscribing", () => {
    it("should send the request of the procedure", () => {
      subscribe({ id: 7 });

      expect(ws.messages).toStrictEqual([{ i: "1", p: { u: "/planet/onUpdate", b: { json: { id: 7 } } } }]);
    });

    it("should send an empty input for procedures without one", () => {
      setup.socket.createListener<number>()({ topic: "ticks" }).listen(vi.fn());

      expect(ws.messages).toStrictEqual([{ i: "1", p: { u: "/ticks", b: {} } }]);
    });

    it("should give every request its own id", () => {
      subscribe({ id: 1 });
      subscribe({ id: 2 });
      setup.socket.createListener<number>()({ topic: "chat/room messages/onMessage" }).listen(vi.fn());

      expect(ws.requests.map(({ i, p }) => [i, p?.u])).toStrictEqual([
        ["1", "/planet/onUpdate"],
        ["2", "/planet/onUpdate"],
        ["3", "/chat/room%20messages/onMessage"],
      ]);
    });

    it("should send the headers of the adapter", async () => {
      await setup.socket.disconnect();
      setup = createWebsocketSocket({ adapterOptions: { headers: { authorization: "Bearer token" } } });
      await open();

      subscribe();

      expect(ws.requests[0].p?.h).toStrictEqual({ authorization: "Bearer token" });
    });

    it("should report an input with files and send nothing", () => {
      const upload = setup.socket.createListener<number, { file: Blob }>()({ topic: "upload/progress" });

      upload.listen(vi.fn(), { payload: { file: new Blob(["x"]) } });

      expect(ws.sent).toStrictEqual([]);
      expect(setup.errors.map(({ message }) => message)).toStrictEqual([
        'Files in the input of "upload/progress" are not supported by the oRPC WebSocket adapter',
      ]);
    });

    it("should report a frame that can't be sent", () => {
      ws.readyState = ws.CLOSING;
      setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());
      ws.readyState = ws.OPEN;

      expect(setup.errors.map(({ message }) => message)).toStrictEqual([
        "[ControlledWebSocket] Cannot send - the connection is not open",
      ]);
    });

    it("should use the custom serializers of the adapter", async () => {
      class Money {
        constructor(public cents: number) {}
      }
      const money: StandardRPCCustomJsonSerializer = {
        type: 21,
        condition: (data) => data instanceof Money,
        serialize: (data: Money) => data.cents,
        deserialize: (cents: number) => new Money(cents),
      };
      await setup.socket.disconnect();
      setup = createWebsocketSocket({ customJsonSerializers: [money] });
      await open();
      const callback = vi.fn();
      const listener = setup.socket.createListener<{ price: Money }, { min: Money }>()({ topic: "prices" });

      listener.listen(({ data }) => callback(data), { payload: { min: new Money(5) } });
      ws.serverStartIterator("1");
      ws.serverEvent("1", { data: serialize({ price: new Money(150), at: new Date(0), total: 2n }, [money]) });

      expect(ws.requests[0].p?.b).toStrictEqual({ json: { min: 5 }, meta: [[21, "min"]] });
      expect(callback).toHaveBeenCalledExactlyOnceWith({ price: new Money(150), at: new Date(0), total: 2n });
    });
  });

  describe("when the server sends events", () => {
    it("should deliver the value with the event meta", () => {
      const { id, callback } = subscribeRunning();

      ws.serverEvent(id, { data: serialize({ id: 1, name: "Earth" }), meta: { id: "1", retry: 100 } });
      ws.serverEvent(id, { data: serialize({ id: 1, name: "Mars" }) });

      expect(callback.mock.calls).toStrictEqual([
        [
          { id: 1, name: "Earth" },
          { id: "1", retry: 100 },
        ],
        [
          { id: 1, name: "Mars" },
          { id: undefined, retry: undefined },
        ],
      ]);
      expect(setup.errors).toStrictEqual([]);
    });

    it("should keep the special types of the output", () => {
      const { id, callback } = subscribeRunning();
      const value = { at: new Date(0), total: 10n, scores: new Map([["a", 1]]), tags: new Set(["x"]) };

      ws.serverEvent(id, { data: serialize(value) });

      expect(callback.mock.calls[0][0]).toStrictEqual(value);
    });

    it("should deliver events sent before the iterator response", () => {
      const { id, callback } = subscribe();

      ws.serverEvent(id, { data: serialize({ id: 1, name: "early" }) });

      expect(callback).toHaveBeenCalledOnce();
    });

    it("should end the subscription on the done event without aborting it", () => {
      const { id, callback } = subscribeRunning();

      ws.serverEvent(id, { event: "done", data: serialize("returned") });
      ws.serverEvent(id, { data: serialize({ id: 1, name: "late" }) });

      expect(callback).not.toHaveBeenCalled();
      expect(ws.aborts).toStrictEqual([]);
      expect(setup.errors).toStrictEqual([]);
    });

    it("should report the defined ORPCError of an error event and end the subscription", () => {
      const { id, callback } = subscribeRunning();
      const error = { defined: true, code: "NOT_FOUND", status: 404, message: "Gone", data: { id: 1 } };

      ws.serverEvent(id, { event: "error", data: serialize(error), meta: { id: "4" } });
      ws.serverEvent(id, { data: serialize({ id: 1, name: "late" }) });

      expect(callback).not.toHaveBeenCalled();
      const reported = asSocketError(setup.errors[0]);
      expect(reported.cause).toBeInstanceOf(ORPCError);
      expect(reported).toMatchObject({ shape: error, topic: "planet/onUpdate", payload: { id: 1 }, code: "NOT_FOUND" });
      expect(ws.aborts).toStrictEqual([]);
    });

    it("should report an error event without the oRPC shape as an ErrorEvent", () => {
      const { id } = subscribeRunning();

      ws.serverEvent(id, { event: "error" });

      const { cause, shape } = asSocketError(setup.errors[0]);
      expect(shape).toBeNull();
      expect(cause).toBeInstanceOf(ErrorEvent);
      expect((cause as ErrorEvent).data).toBeUndefined();
    });

    it("should report a failing listener and keep delivering", () => {
      const { id, callback } = subscribeRunning();
      setup.onUpdate.setPayload({ id: 1 }).listen(() => {
        throw new Error("Listener failed");
      });

      ws.serverEvent(id, { data: serialize({ id: 1, name: "a" }) });
      ws.serverEvent(id, { data: serialize({ id: 1, name: "b" }) });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(setup.errors.map(({ message }) => message)).toStrictEqual(["Listener failed", "Listener failed"]);
    });

    it("should ignore messages of unknown requests and the server abort signal", () => {
      const { id, callback } = subscribeRunning();

      ws.serverEvent("99", { data: serialize({ id: 1, name: "other" }) });
      ws.serverMessage({ i: id, t: 4 });
      ws.serverEvent(id, { data: serialize({ id: 1, name: "own" }) });

      expect(callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "own" }, { id: undefined, retry: undefined });
      expect(setup.errors).toStrictEqual([]);
    });

    it.each([
      ["an ArrayBuffer", (bytes: Uint8Array) => bytes.buffer],
      ["a typed array view", (bytes: Uint8Array) => new Uint8Array([7, ...bytes]).subarray(1)],
    ])("should read a binary frame sent as %s", (_, toFrame) => {
      const { id, callback } = subscribeRunning();
      const json = JSON.stringify({ i: id, t: 3, p: { e: "message", d: serialize({ id: 1, name: "binary" }) } });
      const bytes = new Uint8Array([...new TextEncoder().encode(json), 255, 1, 2, 3]);

      ws.serverSend(toFrame(bytes));

      expect(callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "binary" }, { id: undefined, retry: undefined });
    });

    it("should read a binary frame without the file part", () => {
      const { id, callback } = subscribeRunning();
      const json = JSON.stringify({ i: id, t: 3, p: { e: "message", d: serialize(1) } });

      ws.serverSend(new TextEncoder().encode(json));

      expect(callback).toHaveBeenCalledOnce();
    });
  });

  describe("when a frame is malformed", () => {
    it.each([
      ["a frame that is not JSON", "{oops"],
      ["a message without the id", JSON.stringify({ t: 3, p: { e: "message" } })],
      ["a message that is not an object", JSON.stringify(5)],
      ["a message without the payload", JSON.stringify({ i: "1", t: 3 })],
      ["an unknown event", JSON.stringify({ i: "1", t: 3, p: { e: "ping" } })],
      ["a response with an invalid status", JSON.stringify({ i: "1", p: { s: "200" } })],
      ["a response with invalid headers", JSON.stringify({ i: "1", p: { h: "text/event-stream" } })],
      ["data that is not the serialized object", JSON.stringify({ i: "1", t: 3, p: { e: "message", d: 5 } })],
      ["a frame that is neither text nor binary", { unexpected: true }],
    ])("should report %s and keep the subscription", (_, frame) => {
      const { id, callback } = subscribeRunning();

      ws.serverSend(frame);
      ws.serverEvent(id, { data: serialize({ id: 1, name: "next" }) });

      expect(setup.errors).toHaveLength(1);
      expect(callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "next" }, { id: undefined, retry: undefined });
    });
  });

  describe("when the server rejects the call", () => {
    it("should report the ORPCError of the response and release the request", () => {
      const { id, callback } = subscribe();
      const error = { defined: false, code: "UNAUTHORIZED", status: 401, message: "Missing token", data: undefined };

      ws.serverMessage({ i: id, p: { s: 401, b: serialize(error) } });
      ws.serverEvent(id, { data: serialize({ id: 1, name: "late" }) });

      const reported = asSocketError(setup.errors[0]);
      expect(reported.cause).toBeInstanceOf(ORPCError);
      expect(reported.shape).toStrictEqual(error);
      expect(reported.topic).toBe("planet/onUpdate");
      expect(callback).not.toHaveBeenCalled();
    });

    it("should name the error after the status for an unknown procedure", () => {
      const { id } = subscribe();

      ws.serverMessage({ i: id, p: { s: 404, b: "No procedure matched" } });

      const error = asSocketError(setup.errors[0]);
      expect(error.code).toBe("NOT_FOUND");
      expect(error.data).toBe("No procedure matched");
    });

    it("should report a procedure that is not an event iterator", () => {
      const { id } = subscribe();

      ws.serverMessage({ i: id, p: { b: serialize({ id: 1, name: "a" }) } });

      expect(setup.errors.map(({ message }) => message)).toStrictEqual([
        'The procedure "planet/onUpdate" did not return an event iterator',
      ]);
    });

    it.each([
      ["a file", { "content-type": "text/event-stream", "content-disposition": "inline" }],
      ["a list of content types", { "content-type": ["text/event-stream"], "content-disposition": [] }],
    ])("should tell an event stream from %s", (_, headers) => {
      const { id } = subscribe();

      ws.serverMessage({ i: id, p: { h: headers } });

      const isIterator = !("content-disposition" in headers) || Array.isArray(headers["content-disposition"]);
      expect(setup.errors).toHaveLength(isIterator ? 0 : 1);
    });
  });

  describe("when reporting the errors of a subscription", () => {
    it("should tell which subscription a rejected input belongs to", () => {
      const upload = setup.socket.createListener<number, { file: Blob }>()({ topic: "upload/progress" });
      const file = new Blob(["x"]);

      upload.listen(vi.fn(), { payload: { file } });

      expect(asSocketError(setup.errors[0])).toMatchObject({
        topic: "upload/progress",
        payload: { file },
        shape: null,
      });
    });

    it("should tell which subscription a frame that can't be sent belongs to", () => {
      ws.readyState = ws.CLOSING;
      setup.onUpdate.setPayload({ id: 5 }).listen(vi.fn());
      ws.readyState = ws.OPEN;

      expect(asSocketError(setup.errors[0])).toMatchObject({ topic: "planet/onUpdate", payload: { id: 5 } });
    });

    it("should tell which subscription a procedure that is not an event iterator belongs to", () => {
      const { id } = subscribe({ id: 6 });

      ws.serverMessage({ i: id, p: { b: serialize(1) } });

      expect(asSocketError(setup.errors[0])).toMatchObject({ topic: "planet/onUpdate", payload: { id: 6 } });
    });

    it("should tell which subscription malformed data belongs to", () => {
      const { id } = subscribeRunning({ id: 7 });

      ws.serverEvent(id, { data: 5 });

      expect(asSocketError(setup.errors[0])).toMatchObject({ topic: "planet/onUpdate", payload: { id: 7 } });
    });

    it("should report a frame that can't be read without a topic", () => {
      ws.serverSend("{oops");

      const error = asSocketError(setup.errors[0]);
      expect(error).toMatchObject({ topic: null, payload: undefined, shape: null });
      expect(error.cause).toBeInstanceOf(SyntaxError);
    });

    it("should report the error thrown by a listener as it is", () => {
      const { id } = subscribeRunning();
      const thrown = new Error("Listener failed");
      setup.onUpdate.setPayload({ id: 1 }).listen(() => {
        throw thrown;
      });

      ws.serverEvent(id, { data: serialize({ id: 1, name: "a" }) });

      expect(setup.errors).toStrictEqual([thrown]);
    });
  });

  describe("when emitting", () => {
    it("should throw, the adapter only receives events", () => {
      const emitter = setup.socket.createEmitter<Planet>()({ topic: "planet/update" });

      expect(() => emitter.emit({ payload: { id: 1, name: "a" } })).toThrow(
        "Cannot emit events in the oRPC WebSocket adapter, it only receives events of subscriptions",
      );
    });
  });
});
