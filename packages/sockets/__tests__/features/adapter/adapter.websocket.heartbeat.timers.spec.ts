import type { WebsocketAdapterOptionsType } from "adapter-websockets";
import { Socket } from "socket";

import {
  ControlledWebSocket,
  flushPromises,
  installControlledWebSocket,
  openWebSocket,
  uninstallControlledWebSocket,
} from "../../utils/controlled-websocket";

const url = "ws://heartbeat";
const pingTimeout = 3000;
const pongTimeout = 1000;
const reconnectTime = 500;

describe("Websocket Adapter [ Heartbeat Timers ]", () => {
  // The lower end of the reconnection jitter - every delay is exactly `reconnectTime`
  let random = vi.spyOn(Math, "random");
  beforeEach(() => {
    random = vi.spyOn(Math, "random").mockReturnValue(0);
  });
  afterEach(() => {
    random.mockRestore();
  });

  const sockets: Socket[] = [];

  const createConnectedSocket = async (adapterOptions: WebsocketAdapterOptionsType = {}) => {
    const socket = new Socket({
      url,
      reconnectTime,
      adapterOptions: { heartbeat: true, pingTimeout, pongTimeout, ...adapterOptions },
    });
    sockets.push(socket);
    const websocket = await openWebSocket();
    return { socket, websocket };
  };

  const ping = { topic: "heartbeat", data: "heartbeat" };

  beforeEach(() => {
    installControlledWebSocket();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(async () => {
    await Promise.all(sockets.map((socket) => socket.disconnect()));
    sockets.forEach((socket) => socket.appManager.unmount());
    sockets.length = 0;
    vi.useRealTimers();
    uninstallControlledWebSocket();
  });

  describe("When sending pings", () => {
    it("should not ping before the ping timeout passes", async () => {
      const { websocket } = await createConnectedSocket();

      await vi.advanceTimersByTimeAsync(pingTimeout - 1);

      expect(websocket.sent).toStrictEqual([]);
    });

    it("should ping once the connection was silent for the ping timeout", async () => {
      const { websocket } = await createConnectedSocket();

      await vi.advanceTimersByTimeAsync(pingTimeout);

      expect(websocket.sentMessages).toStrictEqual([ping]);
    });

    it("should use the configured heartbeat message", async () => {
      const { websocket } = await createConnectedSocket({ heartbeatMessage: "are-you-there" });

      await vi.advanceTimersByTimeAsync(pingTimeout);

      expect(websocket.sentMessages).toStrictEqual([{ topic: "heartbeat", data: "are-you-there" }]);
    });

    it("should encode the ping with the custom encoder", async () => {
      const { websocket } = await createConnectedSocket({
        encode: ({ topic, payload }) => `${topic}|${String(payload)}`,
      });

      await vi.advanceTimersByTimeAsync(pingTimeout);

      expect(websocket.sent).toStrictEqual(["heartbeat|heartbeat"]);
    });

    it("should use 5 seconds for the ping and the pong timeout by default", async () => {
      const { socket, websocket } = await createConnectedSocket({ pingTimeout: undefined, pongTimeout: undefined });
      socket.onError(() => null);

      await vi.advanceTimersByTimeAsync(4999);
      expect(websocket.sent).toHaveLength(0);
      await vi.advanceTimersByTimeAsync(1);
      expect(websocket.sent).toHaveLength(1);

      await vi.advanceTimersByTimeAsync(4999);
      expect(socket.adapter.connected).toBeTrue();
      await vi.advanceTimersByTimeAsync(1);
      expect(socket.adapter.connected).toBeFalse();
    });

    it("should keep pinging at the ping interval while the server answers", async () => {
      const { socket, websocket } = await createConnectedSocket();

      for (let i = 0; i < 5; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await vi.advanceTimersByTimeAsync(pingTimeout);
        websocket.serverEmit("heartbeat", "pong");
      }

      expect(websocket.sentMessages).toStrictEqual([ping, ping, ping, ping, ping]);
      expect(socket.adapter.connected).toBeTrue();
    });

    it("should not ping at all when the heartbeat is disabled", async () => {
      const { websocket } = await createConnectedSocket({ heartbeat: false });

      await vi.advanceTimersByTimeAsync(pingTimeout * 10);

      expect(websocket.sent).toStrictEqual([]);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should not ping by default", async () => {
      const socket = new Socket({ url });
      sockets.push(socket);
      const websocket = await openWebSocket();

      await vi.advanceTimersByTimeAsync(60_000);

      expect(websocket.sent).toStrictEqual([]);
    });
  });

  describe("When the connection is active", () => {
    it("should postpone the ping after every incoming frame", async () => {
      const { websocket } = await createConnectedSocket();

      await vi.advanceTimersByTimeAsync(pingTimeout - 1);
      websocket.serverEmit("ticks", 1);
      await vi.advanceTimersByTimeAsync(pingTimeout - 1);
      websocket.serverEmit("ticks", 2);
      await vi.advanceTimersByTimeAsync(pingTimeout - 1);

      expect(websocket.sent).toStrictEqual([]);

      await vi.advanceTimersByTimeAsync(1);

      expect(websocket.sentMessages).toStrictEqual([ping]);
    });

    it("should treat any frame as a pong, also the ones ignored by the decoder", async () => {
      const { socket, websocket } = await createConnectedSocket({ decode: () => null });

      await vi.advanceTimersByTimeAsync(pingTimeout);
      websocket.serverSend("pong");
      await vi.advanceTimersByTimeAsync(pongTimeout);

      expect(socket.adapter.connected).toBeTrue();
    });

    it("should treat a frame that cannot be decoded as a pong", async () => {
      const { socket, websocket } = await createConnectedSocket({
        decode: () => {
          throw new Error("Unknown frame");
        },
      });
      socket.onError(() => null);

      await vi.advanceTimersByTimeAsync(pingTimeout);
      websocket.serverSend("pong");
      await vi.advanceTimersByTimeAsync(pongTimeout);

      expect(socket.adapter.connected).toBeTrue();
    });

    it("should deliver the pong to the listeners of the heartbeat topic", async () => {
      const { socket, websocket } = await createConnectedSocket();
      const spy = vi.fn();
      socket
        .createListener<string>()({ topic: "heartbeat" })
        .listen(({ data }) => spy(data));

      await vi.advanceTimersByTimeAsync(pingTimeout);
      websocket.serverEmit("heartbeat", "pong");

      expect(spy).toHaveBeenCalledWith("pong");
    });
  });

  describe("When the server stops answering", () => {
    it("should stay connected until the pong timeout passes", async () => {
      const { socket } = await createConnectedSocket();

      await vi.advanceTimersByTimeAsync(pingTimeout + pongTimeout - 1);

      expect(socket.adapter.connected).toBeTrue();
    });

    it("should close the transport and report the lost connection", async () => {
      const { socket, websocket } = await createConnectedSocket();
      const events: string[] = [];
      socket.events.onDisconnected(() => events.push("disconnected"));
      socket.events.onError(({ error }: any) => events.push(`error:${error.message}`));

      await vi.advanceTimersByTimeAsync(pingTimeout + pongTimeout);

      expect(websocket.closeCalls).toHaveLength(1);
      expect(socket.adapter.connected).toBeFalse();
      expect(events).toStrictEqual([
        "disconnected",
        "error:Heartbeat timeout - the server did not respond to the ping in time",
      ]);
    });

    it("should not wait for the closing handshake of a dead connection", async () => {
      ControlledWebSocket.autoFinishClose = false;
      const { socket, websocket } = await createConnectedSocket();
      socket.onError(() => null);

      await vi.advanceTimersByTimeAsync(pingTimeout + pongTimeout);

      // The transport is still closing, but the socket already knows the connection is gone
      expect(websocket.readyState).toBe(ControlledWebSocket.CLOSING);
      expect(socket.adapter.connected).toBeFalse();

      await vi.advanceTimersByTimeAsync(reconnectTime);
      await flushPromises();

      expect(ControlledWebSocket.instances).toHaveLength(2);
      ControlledWebSocket.autoFinishClose = true;
    });

    it("should reconnect after the reconnect time", async () => {
      const { socket } = await createConnectedSocket();
      socket.onError(() => null);
      const reconnecting = vi.fn();
      socket.events.onReconnecting(reconnecting);

      await vi.advanceTimersByTimeAsync(pingTimeout + pongTimeout);
      expect(reconnecting).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(reconnectTime);
      await flushPromises();
      const next = await openWebSocket(2);

      expect(reconnecting).toHaveBeenCalledWith({ attempts: 0 });
      expect(socket.adapter.connected).toBeTrue();
      expect(ControlledWebSocket.active).toStrictEqual([next]);
    });

    it("should emit a single disconnected event when the dead transport finally closes", async () => {
      ControlledWebSocket.autoFinishClose = false;
      const { socket, websocket } = await createConnectedSocket();
      socket.onError(() => null);
      const disconnected = vi.fn();
      socket.events.onDisconnected(disconnected);

      await vi.advanceTimersByTimeAsync(pingTimeout + pongTimeout);
      websocket.finishClose();

      expect(disconnected).toHaveBeenCalledTimes(1);
      ControlledWebSocket.autoFinishClose = true;
    });

    it("should start the heartbeat again on the new connection", async () => {
      const { socket } = await createConnectedSocket();
      socket.onError(() => null);

      await vi.advanceTimersByTimeAsync(pingTimeout + pongTimeout + reconnectTime);
      await flushPromises();
      const next = await openWebSocket(2);
      await vi.advanceTimersByTimeAsync(pingTimeout);

      expect(next.sentMessages).toStrictEqual([ping]);
    });

    it("should use the heartbeat options returned by onConnect for the new connection", async () => {
      const { socket } = await createConnectedSocket();
      socket
        .onError(() => null)
        .onConnect(({ connection }) => ({
          ...connection,
          adapterOptions: { ...connection.adapterOptions, heartbeatMessage: "second-connection" },
        }));

      await vi.advanceTimersByTimeAsync(pingTimeout + pongTimeout + reconnectTime);
      await flushPromises();
      const next = await openWebSocket(2);
      await vi.advanceTimersByTimeAsync(pingTimeout);

      expect(next.sentMessages).toStrictEqual([{ topic: "heartbeat", data: "second-connection" }]);
    });
  });

  describe("When the connection ends", () => {
    it("should clear the ping timer on disconnect", async () => {
      const { socket, websocket } = await createConnectedSocket();

      await socket.disconnect();
      await vi.advanceTimersByTimeAsync(pingTimeout * 3);

      expect(websocket.sent).toStrictEqual([]);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should clear the pong timer on disconnect", async () => {
      const { socket } = await createConnectedSocket();
      const reconnecting = vi.fn();
      socket.events.onReconnecting(reconnecting);

      await vi.advanceTimersByTimeAsync(pingTimeout);
      await socket.disconnect();
      await vi.advanceTimersByTimeAsync(pongTimeout + reconnectTime * 3);

      expect(reconnecting).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should not start the heartbeat when a connected callback disconnects", async () => {
      const socket = new Socket({ url, reconnectTime, adapterOptions: { heartbeat: true, pingTimeout, pongTimeout } });
      sockets.push(socket);
      socket.onConnected(() => {
        socket.disconnect();
      });

      const websocket = await openWebSocket();

      // Nothing armed for a socket that is closed already - no ping, no minUptime
      expect(vi.getTimerCount()).toBe(0);
      await vi.advanceTimersByTimeAsync(pingTimeout * 3);
      expect(websocket.sent).toStrictEqual([]);
    });

    it("should stop pinging when the server closes the connection", async () => {
      const { socket, websocket } = await createConnectedSocket();
      // No reconnection, so the only timers left would be the heartbeat ones
      socket.shouldReconnect = () => false;
      socket.onError(() => null);

      websocket.serverClose({ code: 1000, wasClean: true });
      await vi.advanceTimersByTimeAsync(pingTimeout * 3);

      expect(websocket.sent).toStrictEqual([]);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should not ping through a connection that is being replaced", async () => {
      const { socket, websocket } = await createConnectedSocket();

      const reconnecting = socket.reconnect();
      const next = await openWebSocket(2);
      await reconnecting;
      await vi.advanceTimersByTimeAsync(pingTimeout);

      expect(websocket.sent).toStrictEqual([]);
      expect(next.sentMessages).toStrictEqual([ping]);
    });
  });
});
