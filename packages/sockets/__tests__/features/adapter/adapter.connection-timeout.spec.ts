import { Time } from "@hyper-fetch/core";
import { ServerSentEventsAdapter } from "adapter-sse";
import { WebsocketAdapter } from "adapter-websockets";
import { Socket } from "socket";

import {
  ControlledEventSource,
  installControlledEventSource,
  uninstallControlledEventSource,
} from "../../utils/controlled-event-source";
import {
  ControlledWebSocket,
  flushPromises,
  installControlledWebSocket,
  uninstallControlledWebSocket,
} from "../../utils/controlled-websocket";

/**
 * `connectionTimeout` limits how long one connection attempt may take, `reconnectTime` is the delay before the next
 * attempt after a connection was lost. A short reconnect delay must not cut slow handshakes short.
 */
describe("Socket Adapter [ Connection timeout ]", () => {
  const sockets: Socket<any>[] = [];
  // The lower end of the reconnection jitter - every delay is exactly `reconnectTime`
  let random = vi.spyOn(Math, "random");

  beforeEach(() => {
    random = vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    random.mockRestore();
  });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    installControlledWebSocket();
    installControlledEventSource();
  });

  afterEach(async () => {
    await Promise.all(sockets.map((socket) => socket.disconnect()));
    sockets.length = 0;
    vi.clearAllTimers();
    vi.useRealTimers();
    uninstallControlledWebSocket();
    uninstallControlledEventSource();
  });

  const createSocket = (options: { adapter: "ws" | "sse"; reconnectTime?: number; connectionTimeout?: number }) => {
    const socket = new Socket({
      url: options.adapter === "ws" ? "ws://timeout" : "http://timeout",
      adapter: options.adapter === "ws" ? WebsocketAdapter() : ServerSentEventsAdapter(),
      reconnectTime: options.reconnectTime,
      connectionTimeout: options.connectionTimeout,
    });
    sockets.push(socket);
    return socket;
  };

  it("should default the connection timeout to 5 seconds", () => {
    const socket = createSocket({ adapter: "ws" });

    expect(socket.connectionTimeout).toBe(Time.SEC * 5);
  });

  it("should keep the connection timeout separate from the reconnect delay", () => {
    const socket = createSocket({ adapter: "ws", reconnectTime: 10, connectionTimeout: 1000 });

    expect(socket.reconnectTime).toBe(10);
    expect(socket.connectionTimeout).toBe(1000);
  });

  describe.each([
    ["WebSocket", "ws" as const, () => ControlledWebSocket.instances],
    ["SSE", "sse" as const, () => ControlledEventSource.instances],
  ])("When using the %s adapter", (_, adapter, instances) => {
    it("should wait for the connection timeout and the reconnect delay before starting a new attempt", async () => {
      createSocket({ adapter, reconnectTime: 10, connectionTimeout: 1000 });
      await flushPromises();
      expect(instances()).toHaveLength(1);

      await vi.advanceTimersByTimeAsync(1000);
      expect(instances()).toHaveLength(1);

      await vi.advanceTimersByTimeAsync(10);
      expect(instances()).toHaveLength(2);
    });

    it("should start a new attempt when the handshake takes longer than the connection timeout", async () => {
      const onReconnecting = vi.fn();
      const socket = createSocket({ adapter, reconnectTime: 5000, connectionTimeout: 100 });
      socket.events.onReconnecting(onReconnecting);
      await flushPromises();

      await vi.advanceTimersByTimeAsync(100);
      expect(onReconnecting).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(5000);
      expect(onReconnecting).toHaveBeenCalledTimes(1);
      expect(instances()).toHaveLength(2);
    });
  });

  it("should reconnect after the reconnect delay when an open connection was lost", async () => {
    createSocket({ adapter: "ws", reconnectTime: 10, connectionTimeout: 1000 });
    await flushPromises();
    ControlledWebSocket.instances[0].serverOpen();
    await flushPromises();

    ControlledWebSocket.instances[0].serverClose({ code: 1011 });
    await vi.advanceTimersByTimeAsync(10);

    expect(ControlledWebSocket.instances).toHaveLength(2);
  });

  it("should reconnect after the reconnect delay when an open SSE stream was lost", async () => {
    createSocket({ adapter: "sse", reconnectTime: 10, connectionTimeout: 1000 });
    await flushPromises();
    ControlledEventSource.instances[0].serverOpen();
    await flushPromises();

    ControlledEventSource.instances[0].serverFail();
    await vi.advanceTimersByTimeAsync(10);

    expect(ControlledEventSource.instances).toHaveLength(2);
  });
});
