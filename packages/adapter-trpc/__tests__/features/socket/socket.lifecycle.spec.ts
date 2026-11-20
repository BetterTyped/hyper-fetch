import { Socket } from "@hyper-fetch/sockets";

import { TrpcSocketError, TrpcSseAdapter, TrpcWebsocketAdapter } from "../../../src";
import {
  ControlledEventSource,
  installControlledEventSource,
  uninstallControlledEventSource,
} from "../../utils/controlled-event-source";
import {
  flushPromises,
  installControlledWebSocket,
  openWebSocket,
  uninstallControlledWebSocket,
} from "../../utils/controlled-websocket";

type User = { id: number; name: string };

const shape = { message: "Not allowed", code: -32_001, data: { code: "UNAUTHORIZED", httpStatus: 401 } };
const internal = { message: "Crashed", code: -32_603, data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 } };

const createLifecycle = () => {
  const calls: string[] = [];
  const onStart = vi.fn(() => calls.push("start"));
  const onEnd = vi.fn(({ error }: { topic: string; error: Error | null }) => calls.push(error ? "failed" : "ended"));
  return { calls, onStart, onEnd };
};

describe("Trpc Websocket Adapter [ Subscription lifecycle ]", () => {
  const createSocket = () => {
    const socket = new Socket({
      url: "ws://localhost:3001",
      adapter: TrpcWebsocketAdapter(),
      adapterOptions: { autoConnect: false },
      reconnectTime: 100,
    });
    const errors: Error[] = [];
    socket.onError(({ error }) => {
      errors.push(error as Error);
    });
    const onUpdate = socket.createListener<User, { id: number }>()({ topic: "user/onUpdate" });
    return { socket, errors, onUpdate };
  };

  let setup = createSocket();

  const connect = async () => {
    setup.socket.connect();
    return openWebSocket();
  };

  beforeEach(() => {
    installControlledWebSocket();
    setup = createSocket();
  });

  afterEach(async () => {
    await setup.socket.disconnect();
    vi.useRealTimers();
    uninstallControlledWebSocket();
  });

  it("should tell the socket that the server confirms subscriptions", () => {
    expect(setup.socket.adapter.confirmsSubscriptions).toBeTrue();
  });

  describe("when the server starts the subscription", () => {
    it("should start the listeners when the server confirms it", async () => {
      const ws = await connect();
      const first = createLifecycle();
      const second = createLifecycle();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, onStart: first.onStart });
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, onStart: second.onStart });

      expect(first.onStart).not.toHaveBeenCalled();
      ws.serverResult(1, { type: "started" });

      expect(first.onStart).toHaveBeenCalledExactlyOnceWith({ topic: "user/onUpdate" });
      expect(second.onStart).toHaveBeenCalledTimes(1);
    });

    it("should start a callback that joins a confirmed subscription right away", async () => {
      const ws = await connect();
      const first = createLifecycle();
      const late = createLifecycle();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, onStart: first.onStart });
      ws.serverResult(1, { type: "started" });

      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, onStart: late.onStart });

      expect(late.onStart).toHaveBeenCalledTimes(1);
      expect(first.onStart).toHaveBeenCalledTimes(1);
      expect(ws.subscriptions).toHaveLength(1);
    });

    it("should not start a callback that joins before the confirmation until it arrives", async () => {
      const ws = await connect();
      const first = createLifecycle();
      const late = createLifecycle();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, onStart: first.onStart });
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, onStart: late.onStart });

      expect(late.onStart).not.toHaveBeenCalled();
      ws.serverResult(1, { type: "started" });
      expect(late.onStart).toHaveBeenCalledTimes(1);
    });

    it("should start the listeners again when a reconnect is confirmed", async () => {
      vi.useFakeTimers();
      const ws = await connect();
      const lifecycle = createLifecycle();
      const late = createLifecycle();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, onStart: lifecycle.onStart });
      ws.serverResult(1, { type: "started" });

      ws.serverClose();
      // The subscription is not confirmed on the lost connection anymore
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, onStart: late.onStart });
      expect(late.onStart).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(100);
      const next = await openWebSocket(2);
      expect(lifecycle.onStart).toHaveBeenCalledTimes(1);

      next.serverResult(next.subscriptions[0].id, { type: "started" });

      expect(lifecycle.onStart).toHaveBeenCalledTimes(2);
      expect(late.onStart).toHaveBeenCalledTimes(1);
    });
  });

  describe("when the server ends the subscription", () => {
    it("should end the listeners without an error after stopped", async () => {
      const ws = await connect();
      const lifecycle = createLifecycle();
      const callback = vi.fn();
      setup.onUpdate.listen(callback, { payload: { id: 1 }, ...lifecycle });
      ws.serverResult(1, { type: "started" });
      ws.serverResult(1, { type: "data", data: { id: 1, name: "John" } });

      ws.serverResult(1, { type: "stopped" });

      expect(lifecycle.calls).toStrictEqual(["start", "ended"]);
      expect(lifecycle.onEnd).toHaveBeenCalledWith({ topic: "user/onUpdate", error: null });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(setup.socket.adapter.listeners.get("user/onUpdate")?.size).toBe(0);
      expect(ws.stopped).toStrictEqual([]);
      expect(setup.errors).toHaveLength(0);
    });

    it("should end the listeners with the error of the subscription", async () => {
      const ws = await connect();
      const lifecycle = createLifecycle();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, ...lifecycle });

      ws.serverMessage({ id: 1, error: shape });

      const [{ error }] = lifecycle.onEnd.mock.calls[0];
      expect(error).toBeInstanceOf(TrpcSocketError);
      expect(error).toMatchObject({ shape, topic: "user/onUpdate", payload: { id: 1 } });
      expect(setup.errors).toStrictEqual([error]);
      expect(ws.stopped).toStrictEqual([]);
    });

    it("should not end the subscriptions for a connection error", async () => {
      const ws = await connect();
      const lifecycle = createLifecycle();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, ...lifecycle });

      ws.serverMessage({ id: null, error: shape });

      expect(lifecycle.onEnd).not.toHaveBeenCalled();
      expect(setup.errors[0]).toMatchObject({ topic: null });
    });

    it("should keep the subscriptions of other inputs", async () => {
      const ws = await connect();
      const ended = createLifecycle();
      const other = createLifecycle();
      const callback = vi.fn();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, ...ended });
      setup.onUpdate.listen(callback, { payload: { id: 2 }, ...other });

      ws.serverResult(1, { type: "stopped" });
      ws.serverResult(2, { type: "data", data: { id: 2, name: "Jane" } });

      expect(ended.onEnd).toHaveBeenCalledTimes(1);
      expect(other.onEnd).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should deliver the pending batch before the end", async () => {
      vi.useFakeTimers();
      const ws = await connect();
      const lifecycle = createLifecycle();
      setup.onUpdate
        .setDelivery({ strategy: "batch", interval: 1000 })
        .listen(({ data }) => lifecycle.calls.push(`data:${data.map(({ name }) => name).join(",")}`), {
          payload: { id: 1 },
          ...lifecycle,
        });

      ws.serverResult(1, { type: "data", data: { id: 1, name: "a" } });
      ws.serverResult(1, { type: "data", data: { id: 1, name: "b" } });
      ws.serverResult(1, { type: "stopped" });

      expect(lifecycle.calls).toStrictEqual(["data:a,b", "ended"]);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should not call the end after unsubscribing", async () => {
      const ws = await connect();
      const lifecycle = createLifecycle();
      const stop = setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, ...lifecycle });

      stop();
      ws.serverResult(1, { type: "stopped" });

      expect(lifecycle.onEnd).not.toHaveBeenCalled();
      expect(ws.stopped).toStrictEqual([1]);
    });

    it("should not revive an ended subscription after a reconnect", async () => {
      vi.useFakeTimers();
      const ws = await connect();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 } });
      setup.onUpdate.listen(vi.fn(), { payload: { id: 2 } });
      ws.serverResult(1, { type: "stopped" });

      ws.serverClose();
      await vi.advanceTimersByTimeAsync(100);
      const next = await openWebSocket(2);

      expect(next.subscriptions.map(({ params }) => params.input)).toStrictEqual([{ id: 2 }]);
    });

    it("should start a fresh subscription when listening after the end", async () => {
      const ws = await connect();
      const lifecycle = createLifecycle();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 } });
      ws.serverResult(1, { type: "data", id: "a", data: { id: "a", data: { id: 1, name: "John" } } });
      ws.serverResult(1, { type: "stopped" });

      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, ...lifecycle });
      ws.serverResult(2, { type: "started" });

      expect(ws.subscriptions[1]).toStrictEqual({
        id: 2,
        method: "subscription",
        params: { path: "user.onUpdate", input: { id: 1 } },
      });
      expect(lifecycle.onStart).toHaveBeenCalledTimes(1);
    });
  });
});

describe("Trpc SSE Adapter [ Subscription lifecycle ]", () => {
  const createSocket = () => {
    const socket = new Socket({
      url: "http://localhost:3000/trpc",
      adapter: TrpcSseAdapter(),
      adapterOptions: { autoConnect: false },
    });
    const errors: Error[] = [];
    socket.onError(({ error }) => {
      errors.push(error as Error);
    });
    const onUpdate = socket.createListener<User, { id: number }>()({ topic: "user/onUpdate" });
    return { socket, errors, onUpdate };
  };

  let setup = createSocket();

  const connect = async () => {
    await setup.socket.connect();
    await flushPromises();
  };

  beforeEach(() => {
    installControlledEventSource();
    setup = createSocket();
  });

  afterEach(async () => {
    await setup.socket.disconnect();
    vi.useRealTimers();
    uninstallControlledEventSource();
  });

  it("should tell the socket that the server confirms subscriptions", () => {
    expect(setup.socket.adapter.confirmsSubscriptions).toBeTrue();
  });

  describe("when the server starts the stream", () => {
    it("should start the listeners on the connected event", async () => {
      await connect();
      const lifecycle = createLifecycle();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, ...lifecycle });

      expect(lifecycle.onStart).not.toHaveBeenCalled();
      ControlledEventSource.last.serverOpen();

      expect(lifecycle.onStart).toHaveBeenCalledExactlyOnceWith({ topic: "user/onUpdate" });
    });

    it("should start a callback that joins a confirmed stream right away", async () => {
      await connect();
      const first = createLifecycle();
      const late = createLifecycle();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, ...first });
      ControlledEventSource.last.serverOpen();

      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, ...late });

      expect(late.onStart).toHaveBeenCalledTimes(1);
      expect(first.onStart).toHaveBeenCalledTimes(1);
      expect(ControlledEventSource.instances).toHaveLength(1);
    });

    it("should start the listeners again when the EventSource reconnects on its own", async () => {
      await connect();
      const lifecycle = createLifecycle();
      const late = createLifecycle();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, ...lifecycle });
      const source = ControlledEventSource.last;
      source.serverOpen();

      source.serverDrop();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, ...late });
      expect(late.onStart).not.toHaveBeenCalled();
      source.serverOpen();

      expect(lifecycle.onStart).toHaveBeenCalledTimes(2);
      expect(late.onStart).toHaveBeenCalledTimes(1);
    });

    it("should start the listeners again when the socket reconnects", async () => {
      await connect();
      const lifecycle = createLifecycle();
      const late = createLifecycle();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, ...lifecycle });
      ControlledEventSource.last.serverOpen();

      await setup.socket.reconnect();
      await flushPromises();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, ...late });
      expect(late.onStart).not.toHaveBeenCalled();
      ControlledEventSource.last.serverOpen();

      expect(ControlledEventSource.instances).toHaveLength(2);
      expect(lifecycle.onStart).toHaveBeenCalledTimes(2);
      expect(late.onStart).toHaveBeenCalledTimes(1);
    });

    it("should start the listeners again when a quiet stream is restarted", async () => {
      vi.useFakeTimers();
      await connect();
      const lifecycle = createLifecycle();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, ...lifecycle });
      ControlledEventSource.last.serverOpen({ reconnectAfterInactivityMs: 1000 });

      await vi.advanceTimersByTimeAsync(1000);
      expect(ControlledEventSource.instances).toHaveLength(2);
      ControlledEventSource.last.serverOpen();

      expect(lifecycle.onStart).toHaveBeenCalledTimes(2);
    });

    it("should keep a retryable error running and start it again", async () => {
      await connect();
      const lifecycle = createLifecycle();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, ...lifecycle });
      const source = ControlledEventSource.last;
      source.serverOpen();

      source.serverError(internal);
      source.serverDrop();
      source.serverOpen();

      expect(lifecycle.onEnd).not.toHaveBeenCalled();
      expect(lifecycle.onStart).toHaveBeenCalledTimes(2);
      expect(setup.errors[0]).toMatchObject({ shape: internal });
    });
  });

  describe("when the server ends the stream", () => {
    it("should end the listeners without an error on return", async () => {
      await connect();
      const lifecycle = createLifecycle();
      const callback = vi.fn();
      setup.onUpdate.listen(callback, { payload: { id: 1 }, ...lifecycle });
      const source = ControlledEventSource.last;
      source.serverOpen();
      source.serverData({ id: 1, name: "John" });

      source.serverEvent("return", "");

      expect(lifecycle.calls).toStrictEqual(["start", "ended"]);
      expect(lifecycle.onEnd).toHaveBeenCalledWith({ topic: "user/onUpdate", error: null });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(source.closeCalls).toBe(1);
      expect(setup.socket.adapter.listeners.get("user/onUpdate")?.size).toBe(0);
    });

    it("should end the listeners with the error of the subscription", async () => {
      await connect();
      const lifecycle = createLifecycle();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, ...lifecycle });

      ControlledEventSource.last.serverError(shape);

      const [{ error }] = lifecycle.onEnd.mock.calls[0];
      expect(error).toBeInstanceOf(TrpcSocketError);
      expect(error).toMatchObject({ shape, topic: "user/onUpdate", payload: { id: 1 } });
      expect(setup.errors).toStrictEqual([error]);
    });

    it("should end the listeners with the error of a malformed error event", async () => {
      await connect();
      const lifecycle = createLifecycle();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, ...lifecycle });

      ControlledEventSource.last.serverEvent("serialized-error", "{");

      expect(lifecycle.onEnd.mock.calls[0][0].error?.message).toBe("Received a malformed tRPC subscription message");
      expect(setup.errors).toHaveLength(1);
    });

    it("should end the listeners with an error when the EventSource gives up", async () => {
      await connect();
      const lifecycle = createLifecycle();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, ...lifecycle });

      ControlledEventSource.last.serverFail();

      expect(lifecycle.onEnd.mock.calls[0][0].error?.message).toBe("The stream of user.onUpdate failed");
      expect(setup.errors).toHaveLength(1);
    });

    it("should keep the streams of other inputs", async () => {
      await connect();
      const ended = createLifecycle();
      const other = createLifecycle();
      const callback = vi.fn();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 }, ...ended });
      setup.onUpdate.listen(callback, { payload: { id: 2 }, ...other });
      const [first, second] = ControlledEventSource.instances;

      first.serverEvent("return", "");
      second.serverData({ id: 2, name: "Jane" });

      expect(ended.onEnd).toHaveBeenCalledTimes(1);
      expect(other.onEnd).not.toHaveBeenCalled();
      expect(second.readyState).not.toBe(second.CLOSED);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should deliver the pending batch before the end", async () => {
      vi.useFakeTimers();
      await connect();
      const lifecycle = createLifecycle();
      setup.onUpdate
        .setDelivery({ strategy: "batch", interval: 1000 })
        .listen(({ data }) => lifecycle.calls.push(`data:${data.map(({ name }) => name).join(",")}`), {
          payload: { id: 1 },
          ...lifecycle,
        });
      const source = ControlledEventSource.last;

      source.serverData({ id: 1, name: "a" });
      source.serverData({ id: 1, name: "b" });
      source.serverEvent("return", "");

      expect(lifecycle.calls).toStrictEqual(["data:a,b", "ended"]);
    });

    it("should not revive an ended subscription after a reconnect", async () => {
      await connect();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 } });
      setup.onUpdate.listen(vi.fn(), { payload: { id: 2 } });
      ControlledEventSource.instances[0].serverEvent("return", "");

      await setup.socket.reconnect();
      await flushPromises();

      expect(ControlledEventSource.active.map(({ params }) => params.get("input"))).toStrictEqual(['{"id":2}']);
    });

    it("should open a fresh stream without the last event id when listening after the end", async () => {
      await connect();
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 } });
      ControlledEventSource.last.serverData({ id: 1, name: "John" }, "a");
      ControlledEventSource.last.serverEvent("return", "");

      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 } });

      expect(ControlledEventSource.instances).toHaveLength(2);
      expect(ControlledEventSource.last.params.get("lastEventId")).toBeNull();
    });
  });
});
