import type { ListenerCallbackType } from "@hyper-fetch/sockets";
import { Socket } from "@hyper-fetch/sockets";
import superjson, { serialize } from "superjson";

import type { TrpcSocketExtraType, TrpcWebsocketAdapterOptionsType, TrpcWebsocketAdapterType } from "../../../src";
import { TrpcSocketError, TrpcWebsocketAdapter } from "../../../src";
import type { ControlledWebSocket } from "../../utils/controlled-websocket";
import {
  flushPromises,
  installControlledWebSocket,
  openWebSocket,
  uninstallControlledWebSocket,
  waitForWebSocket,
} from "../../utils/controlled-websocket";

type User = { id: number; name: string };
type UserInput = { id: number };

const url = "ws://localhost:3001";

const createSocket = ({
  adapterOptions,
  transformer,
}: { adapterOptions?: TrpcWebsocketAdapterOptionsType; transformer?: typeof superjson } = {}) => {
  const socket = new Socket({
    url,
    adapter: TrpcWebsocketAdapter({ transformer }),
    adapterOptions,
    reconnectTime: 100,
  });
  const errors: Error[] = [];
  socket.onError(({ error }) => {
    errors.push(error as Error);
  });
  const onUpdate = socket.createListener<User, UserInput>()({ topic: "user/onUpdate" });
  const onTick = socket.createListener<number>()({ topic: "onTick" });
  return { socket, errors, onUpdate, onTick };
};

describe("Trpc Websocket Adapter [ Subscriptions ]", () => {
  let setup = createSocket({ adapterOptions: { autoConnect: false } });

  const connect = async (current = setup) => {
    current.socket.connect();
    return openWebSocket();
  };

  beforeEach(() => {
    installControlledWebSocket();
    setup = createSocket({ adapterOptions: { autoConnect: false } });
  });

  afterEach(async () => {
    await setup.socket.disconnect();
    vi.useRealTimers();
    uninstallControlledWebSocket();
  });

  describe("when starting a subscription", () => {
    it("should send the subscription request with the procedure path and the input", async () => {
      const ws = await connect();

      setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());

      expect(ws.messages).toStrictEqual([
        { id: 1, method: "subscription", params: { path: "user.onUpdate", input: { id: 1 } } },
      ]);
    });

    it("should send no input for a procedure without one", async () => {
      const ws = await connect();

      setup.onTick.listen(vi.fn());

      expect(ws.subscriptions).toStrictEqual([{ id: 1, method: "subscription", params: { path: "onTick" } }]);
    });

    it.each([0, false, "", null])("should send the falsy input %j", async (input) => {
      const ws = await connect();
      const listener = setup.socket.createListener<number, unknown>()({ topic: "echo" });

      listener.setPayload(input).listen(vi.fn());

      expect(ws.subscriptions[0].params).toStrictEqual({ path: "echo", input });
    });

    it("should wait with the subscriptions until the connection opens", async () => {
      setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());
      setup.onTick.listen(vi.fn());
      setup.socket.connect();
      const ws = await waitForWebSocket();

      expect(ws.sent).toHaveLength(0);

      ws.serverOpen();

      expect(ws.subscriptions.map(({ params }) => params.path)).toStrictEqual(["user.onUpdate", "onTick"]);
    });

    it("should map nested topics to the procedure path", async () => {
      const ws = await connect();

      setup.socket.createListener<string>()({ topic: "/admin/audit/onEntry/" }).listen(vi.fn());

      expect(ws.subscriptions[0].params.path).toBe("admin.audit.onEntry");
    });
  });

  describe("when receiving data", () => {
    it("should deliver the data with the extra", async () => {
      const ws = await connect();
      const callback = vi.fn();
      setup.onUpdate.setPayload({ id: 1 }).listen(callback);

      ws.serverResult(1, { type: "started" });
      ws.serverResult(1, { type: "data", data: { id: 1, name: "John" } });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        data: { id: 1, name: "John" },
        extra: { eventId: null, payload: { id: 1 } },
      });
    });

    it("should unwrap tracked events and pass their id in the extra", async () => {
      const ws = await connect();
      const callback = vi.fn();
      setup.onUpdate.setPayload({ id: 1 }).listen(callback);

      ws.serverResult(1, { type: "data", id: "event-7", data: { id: "event-7", data: { id: 1, name: "John" } } });

      expect(callback).toHaveBeenCalledWith({
        data: { id: 1, name: "John" },
        extra: { eventId: "event-7", payload: { id: 1 } },
      });
    });

    it("should deliver falsy and empty data", async () => {
      const ws = await connect();
      const callback = vi.fn();
      setup.onTick.listen(callback);

      ws.serverResult(1, { type: "data", data: 0 });
      ws.serverResult(1, { type: "data" });

      expect(callback.mock.calls.map(([{ data }]) => data)).toStrictEqual([0, undefined]);
    });

    it("should not deliver the started result", async () => {
      const ws = await connect();
      const callback = vi.fn();
      setup.onTick.listen(callback);

      ws.serverResult(1, { type: "started" });

      expect(callback).not.toHaveBeenCalled();
      expect(setup.errors).toHaveLength(0);
    });

    it("should pass the topic and the extra of the subscription to the message interceptors", async () => {
      const ws = await connect();
      const interceptor = vi.fn(({ event }: { event: User; topic: string; extra: TrpcSocketExtraType }) => event);
      setup.socket.onMessage<User>(interceptor);
      setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());
      setup.onUpdate.setPayload({ id: 2 }).listen(vi.fn());

      ws.serverResult(2, { type: "data", id: "9", data: { id: "9", data: { id: 2, name: "Jane" } } });

      expect(interceptor).toHaveBeenCalledExactlyOnceWith({
        event: { id: 2, name: "Jane" },
        topic: "user/onUpdate",
        extra: { eventId: "9", payload: { id: 2 } },
      });
    });

    it("should run the message interceptors and pass the extra to the listener events", async () => {
      const ws = await connect();
      const events = vi.fn();
      setup.socket.events.onListenerEvent(events);
      setup.socket.onMessage<User>(({ event }) => ({ ...event, name: event.name.toUpperCase() }));
      const callback = vi.fn();
      setup.onUpdate.setPayload({ id: 1 }).listen(callback);

      ws.serverResult(1, { type: "data", id: "1", data: { id: "1", data: { id: 1, name: "John" } } });

      expect(callback).toHaveBeenCalledWith({
        data: { id: 1, name: "JOHN" },
        extra: { eventId: "1", payload: { id: 1 } },
      });
      expect(events).toHaveBeenCalledWith({
        topic: "user/onUpdate",
        data: { id: 1, name: "JOHN" },
        extra: { eventId: "1", payload: { id: 1 } },
      });
    });
  });

  describe("when listeners share a subscription", () => {
    it("should start one subscription for the callbacks with the same input", async () => {
      const ws = await connect();
      const first = vi.fn();
      const second = vi.fn();

      setup.onUpdate.setPayload({ id: 1 }).listen(first);
      setup.onUpdate.listen(second, { payload: { id: 1 } });
      ws.serverResult(1, { type: "data", data: { id: 1, name: "John" } });

      expect(ws.subscriptions).toHaveLength(1);
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
    });

    it("should keep the subscription until the last callback leaves", async () => {
      const ws = await connect();
      const stopFirst = setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());
      const stopSecond = setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());

      stopFirst();
      expect(ws.stopped).toStrictEqual([]);

      stopSecond();
      expect(ws.stopped).toStrictEqual([1]);
    });

    it("should keep delivering to the callbacks that stay", async () => {
      const ws = await connect();
      const leaving = vi.fn();
      const staying = vi.fn();
      const stop = setup.onUpdate.setPayload({ id: 1 }).listen(leaving);
      setup.onUpdate.setPayload({ id: 1 }).listen(staying);

      stop();
      ws.serverResult(1, { type: "data", data: { id: 1, name: "John" } });

      expect(leaving).not.toHaveBeenCalled();
      expect(staying).toHaveBeenCalledTimes(1);
    });

    it("should share the subscription between inputs that are equal on the wire", async () => {
      const ws = await connect();

      setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());
      setup.onUpdate.setPayload(JSON.parse('{"id":1}')).listen(vi.fn());

      expect(ws.subscriptions).toHaveLength(1);
    });
  });

  describe("when listeners have different inputs", () => {
    it("should start a subscription for every input", async () => {
      const ws = await connect();

      setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());
      setup.onUpdate.setPayload({ id: 2 }).listen(vi.fn());

      expect(ws.subscriptions.map(({ id, params }) => [id, params.input])).toStrictEqual([
        [1, { id: 1 }],
        [2, { id: 2 }],
      ]);
    });

    it("should never deliver the data of one input to another", async () => {
      const ws = await connect();
      const first = vi.fn();
      const second = vi.fn();
      setup.onUpdate.setPayload({ id: 1 }).listen(({ data }) => first(data));
      setup.onUpdate.setPayload({ id: 2 }).listen(({ data }) => second(data));

      ws.serverResult(2, { type: "data", data: { id: 2, name: "Jane" } });
      ws.serverResult(1, { type: "data", data: { id: 1, name: "John" } });

      expect(first.mock.calls).toStrictEqual([[{ id: 1, name: "John" }]]);
      expect(second.mock.calls).toStrictEqual([[{ id: 2, name: "Jane" }]]);
    });

    it("should stop only the subscription that lost its last callback", async () => {
      const ws = await connect();
      const second = vi.fn();
      const stopFirst = setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());
      setup.onUpdate.setPayload({ id: 2 }).listen(second);

      stopFirst();
      ws.serverResult(2, { type: "data", data: { id: 2, name: "Jane" } });

      expect(ws.stopped).toStrictEqual([1]);
      expect(second).toHaveBeenCalledTimes(1);
    });

    it("should keep a server subscription for every input of the same callback", async () => {
      const ws = await connect();
      const callback = vi.fn();

      const stopFirst = setup.onUpdate.setPayload({ id: 1 }).listen(callback);
      const stopSecond = setup.onUpdate.setPayload({ id: 2 }).listen(callback);
      ws.serverResult(1, { type: "data", data: { id: 1, name: "John" } });
      ws.serverResult(2, { type: "data", data: { id: 2, name: "Jane" } });

      expect(ws.subscriptions.map(({ params }) => params.input)).toStrictEqual([{ id: 1 }, { id: 2 }]);
      expect(callback.mock.calls.map(([{ data }]) => data)).toStrictEqual([
        { id: 1, name: "John" },
        { id: 2, name: "Jane" },
      ]);

      stopFirst();
      expect(ws.stopped).toStrictEqual([1]);

      ws.serverResult(1, { type: "data", data: { id: 1, name: "Late" } });
      ws.serverResult(2, { type: "data", data: { id: 2, name: "Janet" } });
      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenLastCalledWith({
        data: { id: 2, name: "Janet" },
        extra: { eventId: null, payload: { id: 2 } },
      });

      stopSecond();
      expect(ws.stopped).toStrictEqual([1, 2]);
    });

    it("should stop only the subscription of the returned unsubscribe", async () => {
      const ws = await connect();
      const callback = vi.fn();
      const stopFirst = setup.onUpdate.setPayload({ id: 1 }).listen(callback);
      setup.onUpdate.setPayload({ id: 2 }).listen(callback);

      stopFirst();
      stopFirst();

      expect(ws.stopped).toStrictEqual([1]);
      expect(setup.socket.adapter.listeners.get("user/onUpdate")?.size).toBe(1);
    });

    it("should count the same callback listening twice with one input", async () => {
      const ws = await connect();
      const callback = vi.fn();
      const stopFirst = setup.onUpdate.setPayload({ id: 1 }).listen(callback);
      const stopSecond = setup.onUpdate.setPayload({ id: 1 }).listen(callback);

      stopFirst();
      expect(ws.stopped).toStrictEqual([]);
      ws.serverResult(1, { type: "data", data: { id: 1, name: "John" } });
      expect(callback).toHaveBeenCalledTimes(1);

      stopSecond();
      expect(ws.stopped).toStrictEqual([1]);
    });

    it("should keep the subscriptions of other topics of the same callback", async () => {
      const ws = await connect();
      const callback: ListenerCallbackType<TrpcWebsocketAdapterType, any> = vi.fn();
      setup.onTick.listen(callback);
      const stopUpdate = setup.onUpdate.setPayload({ id: 1 }).listen(callback);

      stopUpdate();
      ws.serverResult(1, { type: "data", data: 1 });

      expect(ws.stopped).toStrictEqual([2]);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("when unsubscribing", () => {
    it("should ignore the data that arrives after the stop", async () => {
      const ws = await connect();
      const callback = vi.fn();
      const stop = setup.onUpdate.setPayload({ id: 1 }).listen(callback);

      stop();
      ws.serverResult(1, { type: "data", data: { id: 1, name: "John" } });
      ws.serverResult(1, { type: "stopped" });

      expect(callback).not.toHaveBeenCalled();
      expect(setup.errors).toHaveLength(0);
    });

    it("should start a new subscription with a new id after the stop", async () => {
      const ws = await connect();
      const stop = setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());
      stop();

      setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());

      expect(ws.subscriptions.map(({ id }) => id)).toStrictEqual([1, 2]);
    });

    it("should remove the listener from the socket", async () => {
      await connect();
      const stop = setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());

      stop();

      expect(setup.socket.adapter.listeners.get("user/onUpdate")?.size).toBe(0);
    });

    it("should not send the stop while disconnected", async () => {
      const ws = await connect();
      const stop = setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());
      ws.serverClose();

      stop();

      expect(ws.stopped).toStrictEqual([]);
    });
  });

  describe("when the server stops a subscription", () => {
    it("should unsubscribe the listeners and deliver nothing more", async () => {
      const ws = await connect();
      const callback = vi.fn();
      setup.onUpdate.setPayload({ id: 1 }).listen(callback);

      ws.serverResult(1, { type: "stopped" });
      ws.serverResult(1, { type: "data", data: { id: 1, name: "John" } });

      expect(callback).not.toHaveBeenCalled();
      expect(setup.socket.adapter.listeners.get("user/onUpdate")?.size).toBe(0);
      expect(ws.stopped).toStrictEqual([]);
      expect(setup.errors).toHaveLength(0);
    });

    it("should not send the stop for a subscription the server ended", async () => {
      const ws = await connect();
      const stop = setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());
      ws.serverResult(1, { type: "stopped" });

      stop();

      expect(ws.stopped).toStrictEqual([]);
    });

    it("should start a new subscription for the next listener with the same input", async () => {
      const ws = await connect();
      const ended = vi.fn();
      const next = vi.fn();
      setup.onUpdate.setPayload({ id: 1 }).listen(ended);
      ws.serverResult(1, { type: "stopped" });

      const stop = setup.onUpdate.setPayload({ id: 1 }).listen(next);
      ws.serverResult(2, { type: "data", data: { id: 1, name: "John" } });

      expect(ws.subscriptions.map(({ id }) => id)).toStrictEqual([1, 2]);
      expect(next).toHaveBeenCalledTimes(1);
      expect(ended).not.toHaveBeenCalled();

      stop();
      expect(ws.stopped).toStrictEqual([2]);
    });

    it("should not restart an ended subscription after a reconnect", async () => {
      vi.useFakeTimers();
      const ws = await connect();
      setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());
      setup.onTick.listen(vi.fn());
      ws.serverResult(1, { type: "stopped" });

      ws.serverClose();
      await vi.advanceTimersByTimeAsync(100);
      const next = await openWebSocket(2);

      expect(next.subscriptions.map(({ params }) => params.path)).toStrictEqual(["onTick"]);
    });
  });

  describe("when the server reports an error", () => {
    const shape = { message: "Not allowed", code: -32_001, data: { code: "UNAUTHORIZED", httpStatus: 401 } };

    it("should report the error of the subscription", async () => {
      const ws = await connect();
      setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());

      ws.serverMessage({ id: 1, error: shape });

      expect(setup.errors).toHaveLength(1);
      const [error] = setup.errors;
      expect(error).toBeInstanceOf(TrpcSocketError);
      expect(error.message).toBe("Not allowed");
      expect(error).toMatchObject({ shape, topic: "user/onUpdate", payload: { id: 1 } });
    });

    it("should end the subscription", async () => {
      const ws = await connect();
      const callback = vi.fn();
      const stop = setup.onUpdate.setPayload({ id: 1 }).listen(callback);

      ws.serverMessage({ id: 1, error: shape });
      ws.serverResult(1, { type: "data", data: { id: 1, name: "John" } });
      stop();

      expect(callback).not.toHaveBeenCalled();
      expect(ws.stopped).toStrictEqual([]);
    });

    it("should report a connection error without a subscription", async () => {
      const ws = await connect();
      const callback = vi.fn();
      setup.onUpdate.setPayload({ id: 1 }).listen(callback);

      ws.serverMessage({ id: null, error: shape });
      ws.serverResult(1, { type: "data", data: { id: 1, name: "John" } });

      expect(setup.errors[0]).toMatchObject({ shape, topic: null, payload: undefined });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should use a generic message when the error shape has none", async () => {
      const ws = await connect();

      ws.serverMessage({ id: null, error: "boom" });

      expect(setup.errors[0]).toBeInstanceOf(TrpcSocketError);
      expect(setup.errors[0].message).toBe("The tRPC subscription failed");
    });
  });

  describe("when the server sends a malformed message", () => {
    it.each([
      ["a frame that is not JSON", "not json"],
      ["a message that is not an object", "42"],
      ["a message without a result or an error", JSON.stringify({ id: 1 })],
      ["an unknown result type", JSON.stringify({ id: 1, result: { type: "unknown" } })],
    ])("should report %s and keep the connection", async (_name, frame) => {
      const ws = await connect();
      const callback = vi.fn();
      setup.onTick.listen(callback);

      ws.serverSend(frame);
      ws.serverResult(1, { type: "data", data: 1 });

      expect(setup.errors).toHaveLength(1);
      expect(setup.errors[0].message).toBe("Received a malformed tRPC subscription message");
      expect(callback).toHaveBeenCalledTimes(1);
      expect(setup.socket.adapter.connected).toBeTrue();
    });

    it("should ignore results of unknown subscriptions", async () => {
      const ws = await connect();

      ws.serverResult(99, { type: "data", data: 1 });

      expect(setup.errors).toHaveLength(0);
    });
  });

  describe("when a callback throws", () => {
    it("should report the error and deliver the event to the other callbacks", async () => {
      const ws = await connect();
      const failure = new Error("Callback failed");
      const other = vi.fn();
      setup.onTick.listen(() => {
        throw failure;
      });
      setup.onTick.listen(other);

      ws.serverResult(1, { type: "data", data: 1 });
      ws.serverResult(1, { type: "data", data: 2 });

      expect(setup.errors).toStrictEqual([failure, failure]);
      expect(other).toHaveBeenCalledTimes(2);
    });

    it("should report a thrown value that is not an error", async () => {
      const ws = await connect();
      setup.onTick.listen(() => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw "failed";
      });

      ws.serverResult(1, { type: "data", data: 1 });

      expect(setup.errors[0]).toBeInstanceOf(Error);
      expect(setup.errors[0].message).toBe("failed");
    });
  });

  describe("when the input can't be serialized", () => {
    it("should report the error and send nothing", async () => {
      const ws = await connect();
      const listener = setup.socket.createListener<number, { total: bigint }>()({ topic: "onTotal" });

      const stop = listener.setPayload({ total: 1n }).listen(vi.fn());

      expect(setup.errors).toHaveLength(1);
      expect(setup.errors[0]).toBeInstanceOf(TypeError);
      expect(ws.sent).toHaveLength(0);

      stop();
      expect(setup.socket.adapter.listeners.get("onTotal")?.size).toBe(0);
    });
  });

  describe("when sending fails", () => {
    it("should report a failed subscription request and retry it on the next connection", async () => {
      vi.useFakeTimers();
      const ws = await connect();
      ws.readyState = ws.CLOSING;

      setup.onTick.listen(vi.fn());
      expect(setup.errors[0].message).toContain("Cannot send");

      ws.serverClose();
      await vi.advanceTimersByTimeAsync(100);
      const next = await openWebSocket(2);
      expect(next.subscriptions).toHaveLength(1);
    });

    it("should report a failed stop", async () => {
      const ws = await connect();
      const stop = setup.onTick.listen(vi.fn());
      ws.readyState = ws.CLOSING;

      stop();

      expect(setup.errors[0].message).toContain("Cannot send");
      ws.serverClose();
    });
  });

  describe("when using a transformer", () => {
    beforeEach(() => {
      setup = createSocket({ adapterOptions: { autoConnect: false }, transformer: superjson });
    });

    it("should serialize the input", async () => {
      const ws = await connect();
      const date = new Date("2024-01-01T00:00:00.000Z");
      const listener = setup.socket.createListener<number, { since: Date }>()({ topic: "onSince" });

      listener.setPayload({ since: date }).listen(vi.fn());

      expect(ws.subscriptions[0].params.input).toStrictEqual(serialize({ since: date }));
    });

    it("should keep inputs that differ only in the transformer format apart", async () => {
      const ws = await connect();
      const listener = setup.socket.createListener<number, { since: Date | string }>()({ topic: "onSince" });

      listener.setPayload({ since: new Date("2024-01-01T00:00:00.000Z") }).listen(vi.fn());
      listener.setPayload({ since: "2024-01-01T00:00:00.000Z" }).listen(vi.fn());

      expect(ws.subscriptions).toHaveLength(2);
    });

    it("should deserialize the data", async () => {
      const ws = await connect();
      const callback = vi.fn();
      const date = new Date("2024-01-01T00:00:00.000Z");
      setup.socket.createListener<{ at: Date }>()({ topic: "onDate" }).listen(callback);

      ws.serverResult(1, { type: "data", data: serialize({ at: date }) });

      expect(callback.mock.calls[0][0].data.at).toBeInstanceOf(Date);
      expect(callback.mock.calls[0][0].data).toStrictEqual({ at: date });
    });

    it("should deserialize tracked data", async () => {
      const ws = await connect();
      const callback = vi.fn();
      const date = new Date("2024-01-01T00:00:00.000Z");
      setup.socket.createListener<{ at: Date }>()({ topic: "onDate" }).listen(callback);

      ws.serverResult(1, { type: "data", id: "5", data: serialize({ id: "5", data: { at: date } }) });

      expect(callback).toHaveBeenCalledWith({ data: { at: date }, extra: { eventId: "5", payload: undefined } });
    });

    it("should deserialize the error shape", async () => {
      const ws = await connect();
      setup.onTick.listen(vi.fn());
      const shape = { message: "Failed", code: -32_603, data: { at: new Date(0) } };

      ws.serverMessage({ id: 1, error: serialize(shape) });

      expect(setup.errors[0]).toMatchObject({ shape, topic: "onTick" });
    });

    it("should report data the transformer can't read", async () => {
      const ws = await connect();
      const callback = vi.fn();
      setup.onTick.listen(callback);
      vi.spyOn(superjson, "deserialize").mockImplementationOnce(() => {
        throw new Error("Unreadable");
      });

      ws.serverResult(1, { type: "data", data: 1 });

      expect(setup.errors[0].message).toBe("Received a malformed tRPC subscription message");
      expect(setup.errors[0].cause).toStrictEqual(new Error("Unreadable"));
      expect(callback).not.toHaveBeenCalled();
    });

    it("should report an error shape the transformer can't read and end the subscription", async () => {
      const ws = await connect();
      const stop = setup.onTick.listen(vi.fn());
      vi.spyOn(superjson, "deserialize").mockImplementationOnce(() => {
        throw new Error("Unreadable");
      });

      ws.serverMessage({ id: 1, error: {} });
      stop();

      expect(setup.errors[0].message).toBe("Received a malformed tRPC subscription message");
      expect(ws.stopped).toStrictEqual([]);
    });
  });

  describe("when reconnecting", () => {
    it("should restart every subscription with the last tracked event id", async () => {
      vi.useFakeTimers();
      const ws = await connect();
      const callback = vi.fn();
      setup.onUpdate.setPayload({ id: 1 }).listen(callback);
      setup.onTick.listen(vi.fn());
      ws.serverResult(1, { type: "data", id: "a", data: { id: "a", data: { id: 1, name: "John" } } });
      ws.serverResult(1, { type: "data", id: "b", data: { id: "b", data: { id: 1, name: "Johnny" } } });
      ws.serverResult(2, { type: "data", data: 1 });

      ws.serverClose();
      expect(setup.socket.adapter.connected).toBeFalse();
      await vi.advanceTimersByTimeAsync(100);
      const next = await openWebSocket(2);

      expect(next.subscriptions).toStrictEqual([
        { id: 3, method: "subscription", params: { path: "user.onUpdate", input: { id: 1 }, lastEventId: "b" } },
        { id: 4, method: "subscription", params: { path: "onTick" } },
      ]);

      next.serverResult(3, { type: "data", id: "c", data: { id: "c", data: { id: 1, name: "J" } } });
      expect(callback).toHaveBeenLastCalledWith({
        data: { id: 1, name: "J" },
        extra: { eventId: "c", payload: { id: 1 } },
      });
    });

    it("should ignore the messages of the previous connection", async () => {
      const ws = await connect();
      const callback = vi.fn();
      setup.onTick.listen(callback);

      setup.socket.reconnect();
      const next = await openWebSocket(2);
      ws.serverResult(1, { type: "data", data: 1 });

      expect(callback).not.toHaveBeenCalled();
      expect(next.subscriptions).toHaveLength(1);
    });

    it("should reconnect when the server sends the reconnect notification", async () => {
      const ws = await connect();
      setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());
      ws.serverResult(1, { type: "data", id: "9", data: { id: "9", data: { id: 1, name: "John" } } });

      ws.serverMessage({ id: null, method: "reconnect" });
      await flushPromises();
      const next = await openWebSocket(2);

      expect(ws.readyState).toBe(ws.CLOSED);
      expect(next.subscriptions[0].params).toStrictEqual({ path: "user.onUpdate", input: { id: 1 }, lastEventId: "9" });
      expect(setup.errors).toHaveLength(0);
    });

    it("should not stop the subscriptions of the closed connection", async () => {
      const ws = await connect();
      setup.onTick.listen(vi.fn());

      await setup.socket.disconnect();

      expect(ws.stopped).toStrictEqual([]);
      expect(ws.closeCalls).toStrictEqual([{ code: 1000, reason: undefined }]);
    });

    it("should start the kept subscriptions when connecting after a disconnect", async () => {
      const ws = await connect();
      setup.onTick.listen(vi.fn());
      await setup.socket.disconnect();
      expect(ws.subscriptions).toHaveLength(1);

      setup.socket.connect();
      const next = await openWebSocket(2);

      expect(next.subscriptions).toHaveLength(1);
    });
  });

  describe("when sending connection params", () => {
    it("should send them as the first message", async () => {
      setup = createSocket({ adapterOptions: { autoConnect: false, connectionParams: { token: "secret" } } });
      setup.onTick.listen(vi.fn());

      const ws = await connect();

      expect(ws.url).toBe(`${url}?connectionParams=1`);
      expect(ws.messages).toStrictEqual([
        { method: "connectionParams", data: { token: "secret" } },
        { id: 1, method: "subscription", params: { path: "onTick" } },
      ]);
    });

    it("should add the flag to the query params", async () => {
      setup = createSocket({ adapterOptions: { autoConnect: false, connectionParams: { token: "secret" } } });
      setup.socket.setQueryParams({ room: "a" });

      const ws = await connect();

      expect(ws.url).toBe(`${url}?room=a&connectionParams=1`);
    });

    it("should resolve them for every connection attempt", async () => {
      setup = createSocket({ adapterOptions: { autoConnect: false } });
      let token = 0;
      setup.socket.onConnect(({ connection }) => {
        token += 1;
        return {
          ...connection,
          adapterOptions: { ...connection.adapterOptions, connectionParams: { token: `${token}` } },
        };
      });

      const ws = await connect();
      setup.socket.reconnect();
      const next = await openWebSocket(2);

      expect(ws.messages[0]).toStrictEqual({ method: "connectionParams", data: { token: "1" } });
      expect(next.messages[0]).toStrictEqual({ method: "connectionParams", data: { token: "2" } });
    });

    it("should send no connection params without the option", async () => {
      const ws = await connect();

      expect(ws.url).toBe(url);
      expect(ws.sent).toHaveLength(0);
    });
  });

  describe("when emitting", () => {
    it("should throw because only subscriptions are supported", async () => {
      await connect();
      const emitter = setup.socket.createEmitter<{ name: string }>()({ topic: "user/create" });

      expect(() => emitter.emit({ payload: { name: "John" } })).toThrow(
        "Cannot emit events with the tRPC WebSocket adapter, it supports subscriptions only",
      );
    });
  });
});

describe("Trpc Websocket Adapter [ Keep Alive ]", () => {
  let socket: Socket<TrpcWebsocketAdapterType>;
  let errors: Error[] = [];

  const connect = async (keepAlive?: TrpcWebsocketAdapterOptionsType["keepAlive"]) => {
    socket = new Socket({
      url,
      adapter: TrpcWebsocketAdapter(),
      adapterOptions: { keepAlive },
      reconnectTime: 100,
    });
    errors = [];
    socket.onError(({ error }) => {
      errors.push(error as Error);
    });
    return openWebSocket(1);
  };

  const pings = (ws: ControlledWebSocket) => ws.sent.filter((frame) => frame === "PING").length;

  beforeEach(() => {
    installControlledWebSocket();
    vi.useFakeTimers();
  });

  afterEach(async () => {
    await socket.disconnect();
    vi.useRealTimers();
    uninstallControlledWebSocket();
  });

  it("should answer the ping of the server", async () => {
    const ws = await connect();

    ws.serverSend("PING");

    expect(ws.sent).toStrictEqual(["PONG"]);
  });

  it("should not ping without the keep-alive", async () => {
    const ws = await connect();

    await vi.advanceTimersByTimeAsync(60_000);

    expect(pings(ws)).toBe(0);
    expect(socket.adapter.connected).toBeTrue();
  });

  it("should ping a quiet connection with the default timings", async () => {
    const ws = await connect({ enabled: true });

    await vi.advanceTimersByTimeAsync(4999);
    expect(pings(ws)).toBe(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(pings(ws)).toBe(1);
  });

  it("should stay connected when the server answers", async () => {
    const ws = await connect({ enabled: true, intervalMs: 1000, pongTimeoutMs: 500 });

    await vi.advanceTimersByTimeAsync(1000);
    ws.serverSend("PONG");
    await vi.advanceTimersByTimeAsync(1000);
    ws.serverSend("PONG");
    await vi.advanceTimersByTimeAsync(400);

    expect(pings(ws)).toBe(2);
    expect(socket.adapter.connected).toBeTrue();
    expect(errors).toHaveLength(0);
  });

  it("should delay the ping while messages arrive", async () => {
    const ws = await connect({ enabled: true, intervalMs: 1000, pongTimeoutMs: 500 });

    await vi.advanceTimersByTimeAsync(900);
    ws.serverResult(1, { type: "started" });
    await vi.advanceTimersByTimeAsync(900);

    expect(pings(ws)).toBe(0);
  });

  it("should reconnect when the server does not answer the ping", async () => {
    const ws = await connect({ enabled: true, intervalMs: 1000, pongTimeoutMs: 500 });
    socket.createListener<number>()({ topic: "onTick" }).listen(vi.fn());

    await vi.advanceTimersByTimeAsync(1500);

    expect(socket.adapter.connected).toBeFalse();
    expect(ws.readyState).toBe(ws.CLOSED);
    expect(errors.map(({ message }) => message)).toStrictEqual([
      "Keep-alive timeout - the server did not answer the ping in time",
    ]);

    await vi.advanceTimersByTimeAsync(100);
    const next = await openWebSocket(2);
    expect(next.subscriptions).toHaveLength(1);
  });

  it("should report a ping that can't be sent", async () => {
    const ws = await connect({ enabled: true, intervalMs: 1000, pongTimeoutMs: 500 });
    ws.readyState = ws.CLOSING;

    await vi.advanceTimersByTimeAsync(1000);

    expect(errors[0].message).toContain("Cannot send");
    ws.serverClose();
  });

  it("should stop pinging after a disconnect", async () => {
    const ws = await connect({ enabled: true, intervalMs: 1000, pongTimeoutMs: 500 });

    await socket.disconnect();
    await vi.advanceTimersByTimeAsync(5000);

    expect(pings(ws)).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
