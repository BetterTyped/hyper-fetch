import { ErrorEvent, ORPCError } from "@orpc/client";
import type { StandardRPCCustomJsonSerializer } from "@orpc/client/standard";

import type { ControlledStreamCall } from "../../utils/controlled-fetch";
import { createControlledFetch, flushPromises } from "../../utils/controlled-fetch";
import { asSocketError } from "../../utils/socket-error";
import type { Planet } from "../../utils/stream-socket";
import { createStreamSocket, serialize, streamUrl } from "../../utils/stream-socket";

const defaultPayload = { id: 1 };

describe("Orpc Stream Adapter [ Protocol ]", () => {
  let server = createControlledFetch();
  let setup = createStreamSocket();

  const subscribe = async (payload: { id: number } = defaultPayload) => {
    const callback = vi.fn();
    const unsubscribe = setup.onUpdate.setPayload(payload).listen(({ data, extra }) => callback(data, extra));
    await flushPromises();
    return { callback, unsubscribe, call: server.last() };
  };

  const openStream = async (payload: { id: number } = defaultPayload) => {
    const subscription = await subscribe(payload);
    subscription.call.open();
    await flushPromises();
    return subscription;
  };

  const flushed = async <T>(value: T) => {
    await flushPromises();
    return value;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    server = createControlledFetch();
    setup = createStreamSocket();
  });

  afterEach(async () => {
    await setup.socket.disconnect();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("when starting a subscription", () => {
    it("should call the procedure with the serialized input", async () => {
      const { call } = await subscribe({ id: 7 });

      expect(call.url).toBe(`${streamUrl}/planet/onUpdate`);
      expect(call.init.method).toBe("POST");
      expect(call.headers).toStrictEqual({ "Content-Type": "application/json" });
      expect(call.body).toStrictEqual({ json: { id: 7 } });
    });

    it("should send an empty input for procedures without one", async () => {
      const ticks = setup.socket.createListener<number>()({ topic: "ticks" });
      ticks.listen(vi.fn());
      await flushPromises();

      expect(server.last().url).toBe(`${streamUrl}/ticks`);
      expect(server.last().body).toStrictEqual({});
    });

    it("should encode the special types of the input", async () => {
      const at = new Date("2024-01-01T00:00:00.000Z");
      const listener = setup.socket.createListener<number, { at: Date; total: bigint }>()({ topic: "range" });
      listener.listen(vi.fn(), { payload: { at, total: 2n } });
      await flushPromises();

      expect(server.last().body).toStrictEqual({
        json: { at: "2024-01-01T00:00:00.000Z", total: "2" },
        meta: [
          [1, "at"],
          [0, "total"],
        ],
      });
    });

    it("should encode every segment of a nested procedure path", async () => {
      setup.socket.createListener<number>()({ topic: "chat/room messages/onMessage" }).listen(vi.fn());
      await flushPromises();

      expect(server.last().url).toBe(`${streamUrl}/chat/room%20messages/onMessage`);
    });

    it("should send the headers and the fetch options of the adapter", async () => {
      await setup.socket.disconnect();
      setup = createStreamSocket({
        adapterOptions: { headers: { authorization: "Bearer token" }, fetchOptions: { credentials: "include" } },
      });

      const { call } = await subscribe();

      expect(call.headers).toStrictEqual({ "Content-Type": "application/json", authorization: "Bearer token" });
      expect(call.init.credentials).toBe("include");
    });

    it("should append the query params of the socket without the reserved data param", async () => {
      await setup.socket.disconnect();
      setup = createStreamSocket({ url: `${streamUrl}/?tenant=acme` });
      setup.socket.setQueryParams({ token: "1", data: "ignored" });

      // The query params are read when connecting
      await setup.socket.reconnect();
      const { call } = await subscribe();

      expect(call.url).toBe(`${streamUrl}/planet/onUpdate?tenant=acme&token=1`);
    });
  });

  describe("when the server sends messages", () => {
    it("should deliver the value with the event meta", async () => {
      const { call, callback } = await openStream();

      call.send({ data: serialize({ id: 1, name: "Earth" }), id: "1", retry: 100 });
      await flushPromises();

      expect(callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "Earth" }, { id: "1", retry: 100 });
      expect(setup.errors).toStrictEqual([]);
    });

    it("should deliver the messages in order", async () => {
      const { call, callback } = await openStream();

      call.send({ data: serialize({ id: 1, name: "a" }), id: "1" });
      call.send({ data: serialize({ id: 1, name: "b" }) });
      call.send({ data: serialize({ id: 1, name: "c" }), id: "3" });
      await flushPromises();

      expect(callback.mock.calls).toStrictEqual([
        [
          { id: 1, name: "a" },
          { id: "1", retry: undefined },
        ],
        [
          { id: 1, name: "b" },
          { id: undefined, retry: undefined },
        ],
        [
          { id: 1, name: "c" },
          { id: "3", retry: undefined },
        ],
      ]);
    });

    it("should keep the special types of the output", async () => {
      const { call, callback } = await openStream();
      const value = {
        at: new Date(0),
        total: 10n,
        scores: new Map([["a", 1]]),
        tags: new Set(["x"]),
        sparse: [1, undefined],
      };

      call.send({ data: serialize(value) });
      await flushPromises();

      expect(callback.mock.calls[0][0]).toStrictEqual(value);
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
      setup = createStreamSocket({ customJsonSerializers: [money] });
      const listener = setup.socket.createListener<{ price: Money }, { min: Money }>()({ topic: "prices" });
      const callback = vi.fn();
      listener.listen(({ data }) => callback(data), { payload: { min: new Money(5) } });
      await flushPromises();
      const call = server.last();

      expect(call.body).toStrictEqual({ json: { min: 5 }, meta: [[21, "min"]] });
      call.open();
      call.send({ data: serialize({ price: new Money(150) }, [money]) });
      await flushPromises();

      expect(callback).toHaveBeenCalledExactlyOnceWith({ price: new Money(150) });
    });

    it("should read a message without the event field as a message", async () => {
      const { call, callback } = await openStream();

      call.write(`data: ${JSON.stringify(serialize({ id: 1, name: "a" }))}\n\n`);
      await flushPromises();

      expect(callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "a" }, { id: undefined, retry: undefined });
    });

    it("should join data split over many lines", async () => {
      const { call, callback } = await openStream();

      call.write('event: message\ndata: {"json":\ndata:{"id":1,"name":"a"}}\n\n');
      await flushPromises();

      expect(callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "a" }, { id: undefined, retry: undefined });
    });

    it("should ignore the keep-alive comments and unknown fields", async () => {
      const { call, callback } = await openStream();

      call.write(": \n\n");
      call.write(": keep-alive\n\n");
      call.write("foo: bar\n\n");
      call.write(`event: message\nfoo: bar\nidle\ndata: ${JSON.stringify(serialize({ id: 1, name: "a" }))}\n\n`);
      await flushPromises();

      expect(callback).toHaveBeenCalledOnce();
      expect(setup.errors).toStrictEqual([]);
    });

    it("should ignore an invalid retry", async () => {
      const { call, callback } = await openStream();

      call.write(`retry: -1\ndata: {}\n\n`);
      call.write(`retry: 1.5\ndata: {}\n\n`);
      call.write(`retry: abc\ndata: {}\n\n`);
      await flushPromises();

      expect(callback.mock.calls.map(([, extra]) => extra.retry)).toStrictEqual([undefined, undefined, undefined]);
    });

    it("should read the value of a field without the space after the colon", async () => {
      const { call, callback } = await openStream();

      call.write(`id:7\ndata:{}\n\n`);
      await flushPromises();

      expect(callback).toHaveBeenCalledExactlyOnceWith(undefined, { id: "7", retry: undefined });
    });

    it.each([
      ["\r\n", "CRLF"],
      ["\r", "CR"],
    ])("should read %j line endings", async (ending) => {
      const { call, callback } = await openStream();

      call.write(`event: message${ending}id: 1${ending}data: {"json":1}${ending}${ending}`);
      call.write(`data: {"json":2}${ending}${ending}`);
      await flushPromises();

      expect(callback.mock.calls).toStrictEqual([
        [1, { id: "1", retry: undefined }],
        [2, { id: undefined, retry: undefined }],
      ]);
    });
  });

  describe("when the events are split between chunks", () => {
    const frame = `event: message\nid: 1\ndata: ${JSON.stringify(serialize({ id: 1, name: "Zażółć" }))}\n\n`;

    it.each([1, 5, 15, frame.length - 2, frame.length - 1])(
      "should read an event split after %s characters",
      async (at) => {
        const { call, callback } = await openStream();

        call.write(frame.slice(0, at));
        await flushPromises();
        expect(callback).not.toHaveBeenCalled();

        call.write(frame.slice(at));
        await flushPromises();
        expect(callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "Zażółć" }, { id: "1", retry: undefined });
      },
    );

    it("should read an event written one character at a time", async () => {
      const { call, callback } = await openStream();

      [...frame].forEach((character) => call.write(character));
      // Every chunk takes a few promise ticks to read
      await flushPromises(frame.length * 5);

      expect(callback).toHaveBeenCalledOnce();
    });

    it("should read a multi-byte character split between chunks", async () => {
      const { call, callback } = await openStream();
      const bytes = new TextEncoder().encode(frame);
      // The first byte of "ż", a two-byte character
      const index = bytes.indexOf(197);

      call.writeBytes(bytes.slice(0, index + 1));
      call.writeBytes(bytes.slice(index + 1));
      await flushPromises();

      expect(callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "Zażółć" }, { id: "1", retry: undefined });
    });

    it("should read a CRLF delimiter split between chunks", async () => {
      const { call, callback } = await openStream();

      call.write('data: {"json":1}\r\n\r');
      await flushPromises();
      call.write('\ndata: {"json":2}\r\n\r\n');
      await flushPromises();

      expect(callback.mock.calls.map(([data]) => data)).toStrictEqual([1, 2]);
    });

    it("should not read the line feed of a CRLF split after a complete message as a new line", async () => {
      const { call, callback } = await openStream();

      call.write('data: {"json":1}\r\n\r');
      await flushPromises();
      call.write("\n");
      call.close();
      await flushPromises();

      expect(callback.mock.calls.map(([data]) => data)).toStrictEqual([1]);
      expect(setup.errors).toStrictEqual([]);
    });

    it("should keep a line feed that starts a chunk after a complete message without CR", async () => {
      const { call, callback } = await openStream();

      call.write('data: {"json":1}\n\n');
      await flushPromises();
      call.write('\ndata: {"json":2}\n\n');
      await flushPromises();

      expect(callback.mock.calls.map(([data]) => data)).toStrictEqual([1, 2]);
    });

    it("should read many events in one chunk", async () => {
      const { call, callback } = await openStream();

      call.write(`${frame}${frame}${frame}`);
      await flushPromises();

      expect(callback).toHaveBeenCalledTimes(3);
    });
  });

  describe("when the server ends the iterator", () => {
    it.each(["done", "close"])("should end the stream on the %s event", async (event) => {
      const { call, callback } = await openStream();

      call.write(`event: ${event}\ndata: {"json":"returned"}\n\nevent: message\ndata: {"json":1}\n\n`);
      await flushPromises();
      vi.advanceTimersByTime(60_000);
      await flushPromises();

      // The returned value is not delivered and nothing after the end is read
      expect(callback).not.toHaveBeenCalled();
      expect(call.aborted).toBeTrue();
      expect(server.calls).toHaveLength(1);
      expect(setup.errors).toStrictEqual([]);
    });

    it("should end the stream when the server closes it", async () => {
      const { call } = await openStream();

      call.close();
      await flushPromises();
      vi.advanceTimersByTime(60_000);
      await flushPromises();

      expect(server.calls).toHaveLength(1);
      expect(setup.errors).toStrictEqual([]);
    });

    it("should end an event stream without a body", async () => {
      const { call } = await subscribe();

      call.respond({ body: null, headers: { "content-type": "text/event-stream" } });
      await flushPromises();
      vi.advanceTimersByTime(60_000);
      await flushPromises();

      expect(server.calls).toHaveLength(1);
      expect(setup.errors).toStrictEqual([]);
    });
  });

  describe("when the server sends an error", () => {
    it("should report the defined ORPCError and end the stream", async () => {
      const { call, callback } = await openStream();
      const error = { defined: true, code: "NOT_FOUND", status: 404, message: "Gone", data: { id: 1 } };

      call.send({ event: "error", data: serialize(error), id: "9" });
      await flushPromises();
      vi.advanceTimersByTime(60_000);
      await flushPromises();

      expect(callback).not.toHaveBeenCalled();
      expect(setup.errors).toHaveLength(1);
      const reported = asSocketError(setup.errors[0]);
      expect(reported.shape).toStrictEqual(error);
      expect(reported.cause).toBeInstanceOf(ORPCError);
      expect((reported.cause as ORPCError<string, unknown>).toJSON()).toStrictEqual(error);
      expect(reported).toMatchObject({
        message: "Gone",
        name: "OrpcSocketError",
        topic: "planet/onUpdate",
        payload: { id: 1 },
        defined: true,
        code: "NOT_FOUND",
        status: 404,
        data: { id: 1 },
      });
      expect(server.calls).toHaveLength(1);
    });

    it("should report an error without the oRPC shape as an ErrorEvent", async () => {
      const { call } = await openStream();

      call.send({ event: "error", data: serialize({ reason: "custom" }) });
      await flushPromises();

      expect(setup.errors).toHaveLength(1);
      const reported = asSocketError(setup.errors[0]);
      expect(reported.shape).toBeNull();
      expect(reported).toMatchObject({ defined: false, code: undefined, status: undefined, data: undefined });
      expect(reported.cause).toBeInstanceOf(ErrorEvent);
      expect((reported.cause as ErrorEvent).data).toStrictEqual({ reason: "custom" });
    });

    it("should report an error event without data", async () => {
      const { call } = await openStream();

      call.write("event: error\n\n");
      await flushPromises();

      const { cause } = asSocketError(setup.errors[0]);
      expect(cause).toBeInstanceOf(ErrorEvent);
      expect((cause as ErrorEvent).data).toBeUndefined();
    });
  });

  describe("when a message is malformed", () => {
    it.each([
      ["data that is not JSON", "data: {not json\n\n"],
      ["data that is not the serialized object", "data: 5\n\n"],
      ["data with invalid meta", 'data: {"json":"x","meta":[[0]]}\n\n'],
      ["an error event that is not JSON", "event: error\ndata: {not json\n\n"],
    ])("should report %s and keep reading", async (_, text) => {
      const { call, callback } = await openStream();

      call.write(text);
      call.send({ data: serialize({ id: 1, name: "next" }) });
      await flushPromises();

      expect(setup.errors).toHaveLength(1);
      expect(callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "next" }, { id: undefined, retry: undefined });
    });

    it("should end the stream after an error event with invalid data", async () => {
      const { call, callback } = await openStream();

      call.write('event: error\ndata: {"json":"x","meta":[[0]]}\n\n');
      call.send({ data: serialize({ id: 1, name: "next" }) });
      await flushPromises();

      expect(setup.errors).toHaveLength(1);
      expect(callback).not.toHaveBeenCalled();
    });

    it("should report a failing listener and deliver to the other listeners", async () => {
      const { call, callback } = await openStream();
      setup.onUpdate.setPayload({ id: 1 }).listen(() => {
        throw new Error("Listener failed");
      });

      call.send({ data: serialize({ id: 1, name: "a" }) });
      call.send({ data: serialize({ id: 1, name: "b" }) });
      await flushPromises();

      expect(callback).toHaveBeenCalledTimes(2);
      expect(setup.errors.map(({ message }) => message)).toStrictEqual(["Listener failed", "Listener failed"]);
    });
  });

  describe("when the server rejects the call", () => {
    const respond = async (call: ControlledStreamCall, response: Parameters<ControlledStreamCall["respond"]>[0]) => {
      call.respond(response);
      await flushPromises();
      vi.advanceTimersByTime(60_000);
      return flushed(call);
    };

    it("should report the ORPCError of the response and not start again", async () => {
      const { call } = await subscribe();
      const error = { defined: false, code: "UNAUTHORIZED", status: 401, message: "Missing token", data: undefined };

      await respond(call, { status: 401, body: JSON.stringify(serialize(error)) });

      expect(setup.errors).toHaveLength(1);
      const reported = asSocketError(setup.errors[0]);
      expect(reported.shape).toStrictEqual(error);
      expect(reported.cause).toBeInstanceOf(ORPCError);
      expect(reported.topic).toBe("planet/onUpdate");
      expect(server.calls).toHaveLength(1);
    });

    it("should name the error after the status when the body is not an oRPC error", async () => {
      const { call } = await subscribe();

      await respond(call, { status: 404, body: "No procedure matched", headers: { "content-type": "text/plain" } });

      const error = asSocketError(setup.errors[0]);
      expect(error.cause).toBeInstanceOf(ORPCError);
      expect(error.code).toBe("NOT_FOUND");
      expect(error.status).toBe(404);
      expect(error.data).toBe("No procedure matched");
    });

    it("should keep the raw body of an error with invalid meta", async () => {
      const { call } = await subscribe();
      const body = { json: "x", meta: [[0]] };

      await respond(call, { status: 503, body: JSON.stringify(body) });

      const error = asSocketError(setup.errors[0]);
      expect(error.code).toBe("SERVICE_UNAVAILABLE");
      expect(error.data).toStrictEqual(body);
    });

    it("should report a procedure that is not an event iterator", async () => {
      const { call } = await subscribe();

      await respond(call, { body: JSON.stringify(serialize({ id: 1, name: "a" })) });

      expect(setup.errors.map(({ message }) => message)).toStrictEqual([
        'The procedure "planet/onUpdate" did not return an event iterator',
      ]);
      expect(call.aborted).toBeTrue();
      expect(server.calls).toHaveLength(1);
    });

    it("should report a response without the content type", async () => {
      const { call } = await subscribe();

      await respond(call, { body: null, headers: {} });

      expect(setup.errors).toHaveLength(1);
      expect(server.calls).toHaveLength(1);
    });
  });

  describe("when reporting the errors of a subscription", () => {
    it.each([
      ["a call that is not an event iterator", (call: ControlledStreamCall) => call.respond({ body: "{}" })],
      ["a transport failure", (call: ControlledStreamCall) => call.fail(new TypeError("fetch failed"))],
      [
        "malformed data",
        (call: ControlledStreamCall) => {
          call.open();
          call.write("data: {oops\n\n");
        },
      ],
    ])("should tell which subscription failed with %s", async (_, act) => {
      const { call } = await subscribe({ id: 3 });

      act(call);
      await flushPromises();

      const error = asSocketError(setup.errors[0]);
      expect(error).toMatchObject({ topic: "planet/onUpdate", payload: { id: 3 }, shape: null, defined: false });
      expect(error.cause).toBeInstanceOf(Error);
      expect(error.message).toBe((error.cause as Error).message);
    });

    it("should report the stream that stopped restarting", async () => {
      await setup.socket.disconnect();
      setup = createStreamSocket({ reconnect: 0 });
      const { call } = await subscribe({ id: 4 });

      call.fail();
      await flushPromises();

      const stopped = asSocketError(setup.errors[1]);
      expect(stopped.message).toBe('Stopped restarting the stream of "planet/onUpdate" after 0 attempts');
      expect(stopped.payload).toStrictEqual({ id: 4 });
    });

    it("should report the error thrown by a listener as it is", async () => {
      const { call } = await openStream();
      const thrown = new Error("Listener failed");
      setup.onUpdate.setPayload({ id: 1 }).listen(() => {
        throw thrown;
      });

      call.send({ data: serialize({ id: 1, name: "a" }) });
      await flushPromises();

      expect(setup.errors).toStrictEqual([thrown]);
    });
  });

  describe("when emitting", () => {
    it("should throw, the adapter only receives events", () => {
      const emitter = setup.socket.createEmitter<Planet>()({ topic: "planet/update" });

      expect(() => emitter.emit({ payload: { id: 1, name: "a" } })).toThrow(
        "Cannot emit events in the oRPC stream adapter, it only receives events of subscriptions",
      );
    });
  });
});
