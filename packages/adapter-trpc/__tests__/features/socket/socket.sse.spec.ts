import { AppManager } from "@hyper-fetch/core";
import { Socket } from "@hyper-fetch/sockets";
import superjson, { serialize } from "superjson";

import type { TrpcSseAdapterOptionsType } from "../../../src";
import { TrpcSocketError, TrpcSseAdapter } from "../../../src";
import {
  ControlledEventSource,
  installControlledEventSource,
  uninstallControlledEventSource,
} from "../../utils/controlled-event-source";
import { flushPromises } from "../../utils/controlled-websocket";

type User = { id: number; name: string };
type UserInput = { id: number };

const url = "http://localhost:3000/trpc";

const notFound = { message: "Not found", code: -32_004, data: { code: "NOT_FOUND", httpStatus: 404 } };
const internal = { message: "Crashed", code: -32_603, data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 } };

describe("Trpc SSE Adapter", () => {
  let appManager = new AppManager();

  const createSocket = ({
    adapterOptions = { autoConnect: false },
    transformer,
  }: { adapterOptions?: TrpcSseAdapterOptionsType; transformer?: typeof superjson } = {}) => {
    const socket = new Socket({
      url,
      adapter: TrpcSseAdapter({ transformer }),
      adapterOptions,
      appManager: () => appManager,
    });
    const errors: Error[] = [];
    socket.onError(({ error }) => {
      errors.push(error as Error);
    });
    const onUpdate = socket.createListener<User, UserInput>()({ topic: "user/onUpdate" });
    const onTick = socket.createListener<number>()({ topic: "onTick" });
    return { socket, errors, onUpdate, onTick };
  };

  let setup = createSocket();

  const connect = async (current = setup) => {
    await current.socket.connect();
    await flushPromises();
  };

  /** The stream of the given procedure that is open right now */
  const stream = (path: string) => {
    const instance = ControlledEventSource.active.find((source) => new URL(source.url).pathname.endsWith(`/${path}`));
    if (!instance) {
      throw new Error(`No active stream of ${path}`);
    }
    return instance;
  };

  beforeEach(() => {
    installControlledEventSource();
    appManager = new AppManager();
    setup = createSocket();
  });

  afterEach(async () => {
    await setup.socket.disconnect();
    vi.useRealTimers();
    uninstallControlledEventSource();
  });

  describe("when opening streams", () => {
    it("should open the stream of the procedure with the input", async () => {
      await connect();

      setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());

      expect(ControlledEventSource.instances).toHaveLength(1);
      expect(ControlledEventSource.last.url).toBe(`${url}/user.onUpdate?input=${encodeURIComponent('{"id":1}')}`);
    });

    it("should open the stream without an input", async () => {
      await connect();

      setup.onTick.listen(vi.fn());

      expect(ControlledEventSource.last.url).toBe(`${url}/onTick`);
    });

    it("should open the streams when the socket connects", async () => {
      setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());
      setup.onTick.listen(vi.fn());
      expect(ControlledEventSource.instances).toHaveLength(0);

      await connect();

      expect(ControlledEventSource.active).toHaveLength(2);
      expect(setup.socket.adapter.connected).toBeTrue();
    });

    it("should add the query params, the connection params and the EventSource init", async () => {
      setup = createSocket({
        adapterOptions: {
          autoConnect: false,
          connectionParams: { token: "secret" },
          eventSourceInit: { withCredentials: true },
        },
      });
      setup.socket.setUrl(`${url}?tenant=a`).setQueryParams({ input: "dropped", region: "eu" });
      await connect();

      setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());

      const { params, eventSourceInit } = ControlledEventSource.last;
      expect([...params.entries()]).toStrictEqual([
        ["tenant", "a"],
        ["region", "eu"],
        ["input", '{"id":1}'],
        ["connectionParams", '{"token":"secret"}'],
      ]);
      expect(eventSourceInit).toStrictEqual({ withCredentials: true });
    });

    it("should share the stream between the callbacks with the same input", async () => {
      await connect();
      const first = vi.fn();
      const second = vi.fn();

      setup.onUpdate.setPayload({ id: 1 }).listen(first);
      setup.onUpdate.setPayload({ id: 1 }).listen(second);
      ControlledEventSource.last.serverOpen();
      ControlledEventSource.last.serverData({ id: 1, name: "John" });

      expect(ControlledEventSource.instances).toHaveLength(1);
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
    });

    it("should open a stream for every input and keep their data apart", async () => {
      await connect();
      const first = vi.fn();
      const second = vi.fn();
      setup.onUpdate.setPayload({ id: 1 }).listen(({ data }) => first(data));
      setup.onUpdate.setPayload({ id: 2 }).listen(({ data }) => second(data));
      const [streamOne, streamTwo] = ControlledEventSource.instances;

      streamTwo.serverData({ id: 2, name: "Jane" });
      streamOne.serverData({ id: 1, name: "John" });

      expect(first.mock.calls).toStrictEqual([[{ id: 1, name: "John" }]]);
      expect(second.mock.calls).toStrictEqual([[{ id: 2, name: "Jane" }]]);
    });

    it("should keep a stream for every input of the same callback", async () => {
      await connect();
      const callback = vi.fn();
      const stopFirst = setup.onUpdate.setPayload({ id: 1 }).listen(callback);
      setup.onUpdate.setPayload({ id: 2 }).listen(callback);
      const [streamOne, streamTwo] = ControlledEventSource.instances;

      stopFirst();
      streamOne.serverData({ id: 1, name: "John" });
      streamTwo.serverData({ id: 2, name: "Jane" });

      expect(streamOne.readyState).toBe(streamOne.CLOSED);
      expect(streamTwo.readyState).not.toBe(streamTwo.CLOSED);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        data: { id: 2, name: "Jane" },
        extra: { eventId: null, payload: { id: 2 } },
      });
    });

    it("should report a stream that can't be created", async () => {
      await connect();
      ControlledEventSource.constructorError = new Error("Invalid url");

      const stop = setup.onTick.listen(vi.fn());
      stop();

      expect(setup.errors.map(({ message }) => message)).toStrictEqual(["Invalid url"]);
    });

    it("should report a missing EventSource", async () => {
      await connect();
      const original = globalThis.EventSource;
      // @ts-expect-error removing the global like in an environment without EventSource
      delete globalThis.EventSource;

      try {
        setup.onTick.listen(vi.fn());
      } finally {
        globalThis.EventSource = original;
      }

      expect(setup.errors[0].message).toBe("EventSource is not available in this environment");
    });

    it("should report an input that can't be serialized", async () => {
      await connect();
      const listener = setup.socket.createListener<number, { total: bigint }>()({ topic: "onTotal" });

      listener.setPayload({ total: 1n }).listen(vi.fn());

      expect(setup.errors[0]).toBeInstanceOf(TypeError);
      expect(ControlledEventSource.instances).toHaveLength(0);
    });
  });

  describe("when receiving events", () => {
    it("should deliver the data with the extra", async () => {
      await connect();
      const callback = vi.fn();
      setup.onUpdate.setPayload({ id: 1 }).listen(callback);

      ControlledEventSource.last.serverOpen();
      ControlledEventSource.last.serverData({ id: 1, name: "John" });

      expect(callback).toHaveBeenCalledWith({
        data: { id: 1, name: "John" },
        extra: { eventId: null, payload: { id: 1 } },
      });
    });

    it("should pass the id of tracked events in the extra", async () => {
      await connect();
      const callback = vi.fn();
      setup.onUpdate.setPayload({ id: 1 }).listen(callback);

      ControlledEventSource.last.serverData({ id: 1, name: "John" }, "event-1");
      ControlledEventSource.last.serverData({ id: 1, name: "Johnny" });

      expect(callback.mock.calls.map(([{ extra }]) => extra.eventId)).toStrictEqual(["event-1", null]);
    });

    it("should ignore the ping and connected events", async () => {
      await connect();
      const callback = vi.fn();
      setup.onTick.listen(callback);

      ControlledEventSource.last.serverOpen();
      ControlledEventSource.last.serverEvent("ping", "");

      expect(callback).not.toHaveBeenCalled();
      expect(setup.errors).toHaveLength(0);
    });

    it("should report a malformed message and keep the stream", async () => {
      await connect();
      const callback = vi.fn();
      setup.onTick.listen(callback);

      ControlledEventSource.last.serverEvent("message", "not json");
      ControlledEventSource.last.serverData(1);

      expect(setup.errors.map(({ message }) => message)).toStrictEqual([
        "Received a malformed tRPC subscription message",
      ]);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should report a malformed connected event and keep the stream", async () => {
      await connect();
      const callback = vi.fn();
      setup.onTick.listen(callback);

      ControlledEventSource.last.serverEvent("connected", "{");
      ControlledEventSource.last.serverData(1);

      expect(setup.errors).toHaveLength(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should report a throwing callback and keep delivering", async () => {
      await connect();
      const other = vi.fn();
      setup.onTick.listen(() => {
        throw new Error("Callback failed");
      });
      setup.onTick.listen(other);

      ControlledEventSource.last.serverData(1);

      expect(setup.errors.map(({ message }) => message)).toStrictEqual(["Callback failed"]);
      expect(other).toHaveBeenCalledTimes(1);
    });
  });

  describe("when unsubscribing", () => {
    it("should close the stream when the last callback leaves", async () => {
      await connect();
      const stopFirst = setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());
      const stopSecond = setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());
      const source = ControlledEventSource.last;

      stopFirst();
      expect(source.readyState).toBe(source.CONNECTING);

      stopSecond();
      expect(source.readyState).toBe(source.CLOSED);
    });

    it("should ignore the events of a closed stream", async () => {
      await connect();
      const callback = vi.fn();
      const stop = setup.onTick.listen(callback);
      const source = ControlledEventSource.last;

      stop();
      source.serverOpen();
      source.serverData(1);
      source.serverEvent("ping", "");
      source.serverError(notFound);
      source.serverEvent("return", "");
      source.serverDrop();

      expect(callback).not.toHaveBeenCalled();
      expect(setup.errors).toHaveLength(0);
    });

    it("should clear the inactivity timer", async () => {
      vi.useFakeTimers();
      await connect();
      const stop = setup.onTick.listen(vi.fn());
      ControlledEventSource.last.serverOpen({ reconnectAfterInactivityMs: 1000 });

      stop();

      expect(vi.getTimerCount()).toBe(0);
    });

    it("should do nothing for a subscription without a stream", async () => {
      const stop = setup.onTick.listen(vi.fn());

      stop();

      expect(ControlledEventSource.instances).toHaveLength(0);
      expect(setup.errors).toHaveLength(0);
    });
  });

  describe("when the server ends the subscription", () => {
    it("should close the stream on return and unsubscribe the listeners", async () => {
      await connect();
      const callback = vi.fn();
      setup.onTick.listen(callback);
      const source = ControlledEventSource.last;

      source.serverEvent("return", "");
      source.serverData(1);

      expect(source.readyState).toBe(source.CLOSED);
      expect(source.closeCalls).toBe(1);
      expect(callback).not.toHaveBeenCalled();
      expect(setup.socket.adapter.listeners.get("onTick")?.size).toBe(0);
      expect(setup.errors).toHaveLength(0);
    });

    it("should open a new stream for the next listener with the same input", async () => {
      await connect();
      const ended = vi.fn();
      const next = vi.fn();
      setup.onTick.listen(ended);
      ControlledEventSource.last.serverEvent("return", "");

      setup.onTick.listen(next);
      ControlledEventSource.last.serverData(1);

      expect(ControlledEventSource.instances).toHaveLength(2);
      expect(next).toHaveBeenCalledTimes(1);
      expect(ended).not.toHaveBeenCalled();
    });

    it("should not reopen an ended subscription after a reconnect", async () => {
      await connect();
      setup.onTick.listen(vi.fn());
      setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());
      stream("onTick").serverEvent("return", "");

      await setup.socket.reconnect();
      await flushPromises();

      expect(ControlledEventSource.active.map((source) => new URL(source.url).pathname)).toStrictEqual([
        "/trpc/user.onUpdate",
      ]);
    });
  });

  describe("when the server reports an error", () => {
    it("should report the error and end the subscription", async () => {
      await connect();
      const callback = vi.fn();
      setup.onUpdate.setPayload({ id: 1 }).listen(callback);
      const source = ControlledEventSource.last;

      source.serverError(notFound);
      source.serverData({ id: 1, name: "John" });

      expect(setup.errors[0]).toBeInstanceOf(TrpcSocketError);
      expect(setup.errors[0]).toMatchObject({
        message: "Not found",
        shape: notFound,
        topic: "user/onUpdate",
        payload: { id: 1 },
      });
      expect(source.readyState).toBe(source.CLOSED);
      expect(callback).not.toHaveBeenCalled();
    });

    it("should keep the stream of a retryable error for the EventSource to reconnect", async () => {
      await connect();
      const callback = vi.fn();
      setup.onTick.listen(callback);
      const source = ControlledEventSource.last;

      source.serverError(internal);
      source.serverData(1);

      expect(setup.errors[0]).toMatchObject({ shape: internal, topic: "onTick" });
      expect(source.readyState).not.toBe(source.CLOSED);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should end the subscription for an error shape without a code", async () => {
      await connect();
      setup.onTick.listen(vi.fn());
      const source = ControlledEventSource.last;

      source.serverError("boom");

      expect(setup.errors[0].message).toBe("The tRPC subscription failed");
      expect(source.readyState).toBe(source.CLOSED);
    });

    it("should end the subscription for a malformed error", async () => {
      await connect();
      setup.onTick.listen(vi.fn());
      const source = ControlledEventSource.last;

      source.serverEvent("serialized-error", "{");

      expect(setup.errors[0].message).toBe("Received a malformed tRPC subscription message");
      expect(source.readyState).toBe(source.CLOSED);
    });
  });

  describe("when the stream fails", () => {
    it("should report a lost stream and leave the retry to the EventSource", async () => {
      await connect();
      const callback = vi.fn();
      setup.onTick.listen(callback);
      const source = ControlledEventSource.last;

      source.serverDrop();
      source.serverOpen();
      source.serverData(1, "1");

      expect(setup.errors.map(({ message }) => message)).toStrictEqual(["The stream of onTick was lost, reconnecting"]);
      expect(ControlledEventSource.instances).toHaveLength(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should end the subscription when the EventSource gives up", async () => {
      await connect();
      setup.onTick.listen(vi.fn());
      const source = ControlledEventSource.last;

      source.serverFail();

      expect(setup.errors.map(({ message }) => message)).toStrictEqual(["The stream of onTick failed"]);
      expect(source.closeCalls).toBe(1);
      expect(setup.socket.adapter.connected).toBeTrue();
    });
  });

  describe("when the stream is inactive", () => {
    it("should restart a quiet stream with the last event id", async () => {
      vi.useFakeTimers();
      await connect();
      setup.onTick.listen(vi.fn());
      const source = ControlledEventSource.last;
      source.serverOpen({ reconnectAfterInactivityMs: 1000 });
      source.serverData(1, "a");

      await vi.advanceTimersByTimeAsync(999);
      expect(ControlledEventSource.instances).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);

      expect(source.readyState).toBe(source.CLOSED);
      expect(ControlledEventSource.active).toHaveLength(1);
      expect(ControlledEventSource.last.params.get("lastEventId")).toBe("a");
      expect(setup.errors.map(({ message }) => message)).toStrictEqual([
        "No events for 1000ms - restarting the stream of onTick",
      ]);
    });

    it("should keep a stream that gets pings", async () => {
      vi.useFakeTimers();
      await connect();
      setup.onTick.listen(vi.fn());
      const source = ControlledEventSource.last;
      source.serverOpen({ reconnectAfterInactivityMs: 1000 });

      await vi.advanceTimersByTimeAsync(800);
      source.serverEvent("ping", "");
      await vi.advanceTimersByTimeAsync(800);
      source.serverData(1);
      await vi.advanceTimersByTimeAsync(800);

      expect(ControlledEventSource.instances).toHaveLength(1);
    });

    it("should not watch the stream without the server option", async () => {
      vi.useFakeTimers();
      await connect();
      setup.onTick.listen(vi.fn());
      ControlledEventSource.last.serverOpen({ reconnectAfterInactivityMs: "soon" });
      ControlledEventSource.last.serverEvent("connected", "null");

      expect(vi.getTimerCount()).toBe(0);
    });

    it("should stop watching a lost stream", async () => {
      vi.useFakeTimers();
      await connect();
      setup.onTick.listen(vi.fn());
      ControlledEventSource.last.serverOpen({ reconnectAfterInactivityMs: 1000 });

      ControlledEventSource.last.serverDrop();

      // Only the connection timeout of the retrying stream is left
      expect(vi.getTimerCount()).toBe(1);
    });
  });

  describe("when a stream does not open", () => {
    const createTimedSocket = ({
      reconnectTime,
      connectionTimeout,
    }: {
      reconnectTime: number;
      connectionTimeout: number;
    }) =>
      new Socket({
        url,
        adapter: TrpcSseAdapter(),
        adapterOptions: { autoConnect: false },
        reconnectTime,
        connectionTimeout,
      });

    it("should open the stream again after the connection timeout", async () => {
      vi.useFakeTimers();
      setup.socket = createTimedSocket({ reconnectTime: 10, connectionTimeout: 1000 });
      const errors: Error[] = [];
      setup.socket.onError(({ error }) => {
        errors.push(error as Error);
      });
      await connect();
      setup.socket.createListener<number>()({ topic: "onTick" }).listen(vi.fn());
      const first = ControlledEventSource.last;

      // A short reconnect time does not cut the slow stream short
      await vi.advanceTimersByTimeAsync(999);
      expect(ControlledEventSource.instances).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);

      expect(first.readyState).toBe(first.CLOSED);
      expect(ControlledEventSource.active).toHaveLength(1);
      expect(errors.map(({ message }) => message)).toStrictEqual([
        "The stream of onTick did not open within 1000ms - restarting it",
      ]);
    });

    it("should not restart a stream that opened in time", async () => {
      vi.useFakeTimers();
      setup.socket = createTimedSocket({ reconnectTime: 1000, connectionTimeout: 100 });
      await connect();
      setup.socket.createListener<number>()({ topic: "onTick" }).listen(vi.fn());

      await vi.advanceTimersByTimeAsync(99);
      ControlledEventSource.last.serverOpen();
      await vi.advanceTimersByTimeAsync(1000);

      expect(ControlledEventSource.instances).toHaveLength(1);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should guard a stream the EventSource retries on its own with the connection timeout", async () => {
      vi.useFakeTimers();
      setup.socket = createTimedSocket({ reconnectTime: 5000, connectionTimeout: 100 });
      await connect();
      setup.socket.createListener<number>()({ topic: "onTick" }).listen(vi.fn());
      ControlledEventSource.last.serverOpen();

      ControlledEventSource.last.serverDrop();
      await vi.advanceTimersByTimeAsync(100);

      expect(ControlledEventSource.instances).toHaveLength(2);
      expect(ControlledEventSource.active).toHaveLength(1);
    });
  });

  describe("when using a transformer", () => {
    beforeEach(() => {
      setup = createSocket({ transformer: superjson });
    });

    it("should serialize the input into the url", async () => {
      await connect();
      const date = new Date("2024-01-01T00:00:00.000Z");
      const listener = setup.socket.createListener<number, { since: Date }>()({ topic: "onSince" });

      listener.setPayload({ since: date }).listen(vi.fn());

      expect(JSON.parse(ControlledEventSource.last.params.get("input") as string)).toStrictEqual(
        serialize({ since: date }),
      );
    });

    it("should deserialize the data and the error", async () => {
      await connect();
      const callback = vi.fn();
      const date = new Date("2024-01-01T00:00:00.000Z");
      setup.socket.createListener<{ at: Date }>()({ topic: "onDate" }).listen(callback);
      const source = ControlledEventSource.last;
      const shape = { ...notFound, data: { ...notFound.data, at: date } };

      source.serverData(serialize({ at: date }), "1");
      source.serverError(serialize(shape));

      expect(callback).toHaveBeenCalledWith({ data: { at: date }, extra: { eventId: "1", payload: undefined } });
      expect(setup.errors[0]).toMatchObject({ shape });
    });
  });

  describe("when the socket connects", () => {
    it("should connect on creation by default", async () => {
      setup = createSocket({ adapterOptions: {} });
      setup.onTick.listen(vi.fn());
      await flushPromises();

      expect(setup.socket.adapter.connected).toBeTrue();
      expect(ControlledEventSource.active).toHaveLength(1);
    });

    it("should report the lifecycle to the socket callbacks", async () => {
      const connected = vi.fn();
      const disconnected = vi.fn();
      setup.socket.onConnected(connected);
      setup.socket.onDisconnected(disconnected);

      await connect();
      await setup.socket.disconnect();

      expect(connected).toHaveBeenCalledTimes(1);
      expect(disconnected).toHaveBeenCalledTimes(1);
    });

    it("should join the connection attempt in progress", async () => {
      const first = setup.socket.adapter.connect();
      const second = setup.socket.adapter.connect();

      await expect(first).resolves.toBeTrue();
      await expect(second).resolves.toBeTrue();
    });

    it("should start a new attempt after a cancelled one", async () => {
      setup.onTick.listen(vi.fn());
      const cancelled = setup.socket.adapter.connect();
      await setup.socket.disconnect();
      const next = setup.socket.adapter.connect();

      await expect(cancelled).resolves.toBeFalse();
      await expect(next).resolves.toBeTrue();
      expect(ControlledEventSource.active).toHaveLength(1);
    });

    it("should resolve with the connection state when already connected", async () => {
      await connect();
      setup.onTick.listen(vi.fn());

      await expect(setup.socket.adapter.connect()).resolves.toBeTrue();
      expect(ControlledEventSource.instances).toHaveLength(1);
    });

    it("should not connect when the onConnect interceptor fails", async () => {
      setup.socket.onConnect(() => {
        throw new Error("No token");
      });
      setup.onTick.listen(vi.fn());

      await expect(setup.socket.adapter.connect()).resolves.toBeFalse();

      expect(setup.errors[0].message).toBe("No token");
      expect(ControlledEventSource.instances).toHaveLength(0);
    });

    it("should use the connection details resolved for every attempt", async () => {
      let token = 0;
      setup.socket.onConnect(({ connection }) => {
        token += 1;
        return { ...connection, adapterOptions: { connectionParams: { token: `${token}` } } };
      });
      setup.onTick.listen(vi.fn());

      await connect();
      await setup.socket.reconnect();
      await flushPromises();

      expect(ControlledEventSource.instances.map(({ params }) => params.get("connectionParams"))).toStrictEqual([
        '{"token":"1"}',
        '{"token":"2"}',
      ]);
    });
  });

  describe("when the socket disconnects", () => {
    it("should close every stream and keep the subscriptions", async () => {
      await connect();
      setup.onTick.listen(vi.fn());
      setup.onUpdate.setPayload({ id: 1 }).listen(vi.fn());
      ControlledEventSource.instances[0].serverData(1, "t-1");

      await setup.socket.disconnect();

      expect(ControlledEventSource.active).toHaveLength(0);
      expect(setup.socket.adapter.connected).toBeFalse();
      expect(setup.socket.adapter.forceClosed).toBeTrue();

      await connect();

      expect(ControlledEventSource.active).toHaveLength(2);
      expect(stream("onTick").params.get("lastEventId")).toBe("t-1");
      expect(stream("user.onUpdate").params.get("lastEventId")).toBeNull();
    });

    it("should not report a disconnect when it was not connected", async () => {
      const disconnected = vi.fn();
      setup.socket.onDisconnected(disconnected);

      await expect(setup.socket.adapter.disconnect()).resolves.toBeTrue();

      expect(disconnected).not.toHaveBeenCalled();
    });

    it("should not open streams for new listeners while disconnected", async () => {
      await connect();
      await setup.socket.disconnect();

      setup.onTick.listen(vi.fn());

      expect(ControlledEventSource.instances).toHaveLength(0);
    });

    it("should win over a reconnection in progress", async () => {
      setup.socket.onConnect(async ({ connection }) => connection);
      await connect();
      setup.onTick.listen(vi.fn());

      const reconnecting = setup.socket.reconnect();
      await setup.socket.disconnect();
      await reconnecting;
      await flushPromises();

      expect(ControlledEventSource.active).toHaveLength(0);
      expect(setup.socket.adapter.reconnectionAttempts).toBe(0);
    });
  });

  describe("when the socket reconnects", () => {
    it("should reopen every stream with the last event id", async () => {
      await connect();
      setup.onTick.listen(vi.fn());
      const first = ControlledEventSource.last;
      first.serverData(1, "5");

      await setup.socket.reconnect();
      await flushPromises();

      expect(first.readyState).toBe(first.CLOSED);
      expect(ControlledEventSource.active).toHaveLength(1);
      expect(ControlledEventSource.last.params.get("lastEventId")).toBe("5");
      expect(setup.socket.adapter.connected).toBeTrue();
    });

    it("should connect after a manual disconnect", async () => {
      await connect();
      await setup.socket.disconnect();

      await setup.socket.reconnect();
      await flushPromises();

      expect(setup.socket.adapter.connected).toBeTrue();
    });
  });

  describe("when the app goes online", () => {
    it("should connect", async () => {
      setup = createSocket({ adapterOptions: {} });
      await flushPromises();
      setup.socket.adapter.setConnected(false);

      appManager.setOnline(false);
      appManager.setOnline(true);
      await flushPromises();

      expect(setup.socket.adapter.connected).toBeTrue();
    });

    it("should stay disconnected after a manual disconnect", async () => {
      setup = createSocket({ adapterOptions: {} });
      await flushPromises();
      await setup.socket.disconnect();

      appManager.setOnline(false);
      appManager.setOnline(true);
      await flushPromises();

      expect(setup.socket.adapter.connected).toBeFalse();
    });

    it("should not connect without autoConnect", async () => {
      appManager.setOnline(false);
      appManager.setOnline(true);
      await flushPromises();

      expect(setup.socket.adapter.connected).toBeFalse();
    });
  });

  describe("when emitting", () => {
    it("should throw because Server-Sent Events are receive-only", async () => {
      await connect();
      const emitter = setup.socket.createEmitter<{ name: string }>()({ topic: "user/create" });

      expect(() => emitter.emit({ payload: { name: "John" } })).toThrow(
        "Cannot emit events with the tRPC SSE adapter, it supports subscriptions only",
      );
    });
  });
});
