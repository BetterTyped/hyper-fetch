import { createSseE2EServer, createWebsocketE2EServer, sleep } from "@hyper-fetch/testing";
import { ServerSentEventsAdapter } from "adapter-sse";
import net from "net";
import { Socket } from "socket";

/** A TCP server that accepts connections and never answers - the handshake of every client hangs */
const createSilentServer = async () => {
  const connections: net.Socket[] = [];
  const server = net.createServer((connection) => {
    connections.push(connection);
    connection.on("error", () => null);
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const { port } = server.address() as net.AddressInfo;

  return {
    port,
    connections,
    stop: async () => {
      connections.forEach((connection) => connection.destroy());
      await new Promise((resolve) => {
        server.close(resolve);
      });
    },
  };
};

describe("E2E [ Lifecycle ]", () => {
  describe("When using a real WebSocket server", () => {
    it("should be connected when connect resolves right after creating the socket", async () => {
      const { startServer, stopServer } = createWebsocketE2EServer();
      const url = await startServer();
      const socket = new Socket({ url });

      await socket.connect();

      expect(socket.adapter.connected).toBe(true);
      await socket.disconnect();
      await stopServer();
    });

    it("should send a message emitted right after awaiting connect", async () => {
      const { startServer, stopServer, waitForMessage, waitForClient } = createWebsocketE2EServer();
      const url = await startServer();
      const client = waitForClient();
      const socket = new Socket({ url });
      await client;
      const message = waitForMessage();

      await socket.connect();
      socket
        .createEmitter<{ value: number }>()({ topic: "ready" })
        .emit({ payload: { value: 1 } });

      await expect(message).resolves.toStrictEqual({ topic: "ready", data: { value: 1 } });
      await socket.disconnect();
      await stopServer();
    });

    it("should stay disconnected after disconnecting a connection that is still opening", async () => {
      const silent = await createSilentServer();
      const socket = new Socket({ url: `ws://127.0.0.1:${silent.port}`, reconnectTime: 100 });
      const reconnecting = vi.fn();
      const connecting = vi.fn();
      const errors = vi.fn();
      await vi.waitFor(() => expect(silent.connections.length).toBeGreaterThanOrEqual(1));

      await socket.disconnect();
      // Everything the socket does from now on would be acting against the manual disconnect
      socket.events.onReconnecting(reconnecting);
      socket.events.onConnecting(connecting);
      socket.events.onError(errors);
      await sleep(400);

      expect(reconnecting).not.toHaveBeenCalled();
      expect(connecting).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
      expect(socket.adapter.connected).toBe(false);
      expect(socket.adapter.connecting).toBe(false);
      await silent.stop();
    });

    it("should give up after the configured attempts when the handshake never finishes", async () => {
      const silent = await createSilentServer();
      const socket = new Socket({ url: `ws://127.0.0.1:${silent.port}`, reconnect: 2, reconnectTime: 40 });
      const attempts: number[] = [];
      const failed = vi.fn();
      socket.onError(() => null);
      socket.events.onReconnecting(({ attempts: attempt }) => attempts.push(attempt));
      socket.events.onReconnectingFailed(failed);

      await vi.waitFor(() => expect(failed).toHaveBeenCalledTimes(1), { timeout: 5000 });
      await sleep(200);

      expect(attempts).toStrictEqual([0, 1, 2]);
      expect(failed).toHaveBeenCalledWith({ attempts: 2 });
      expect(socket.adapter.connecting).toBe(false);
      await socket.disconnect();
      await silent.stop();
    });

    it("should not report an error for a manual disconnect", async () => {
      const { startServer, stopServer } = createWebsocketE2EServer();
      const url = await startServer();
      const socket = new Socket({ url });
      const errors = vi.fn();
      const disconnected = vi.fn();
      await socket.connect();
      socket.onError(errors);
      socket.events.onDisconnected(disconnected);

      await socket.disconnect();

      expect(errors).not.toHaveBeenCalled();
      expect(disconnected).toHaveBeenCalledTimes(1);
      await stopServer();
    });

    it("should deliver the data returned by an onMessage interceptor", async () => {
      const { startServer, stopServer, sendToAll } = createWebsocketE2EServer();
      const url = await startServer();
      const socket = new Socket({ url }).onMessage<{ value: number }>(({ event }) => ({
        ...event,
        value: event.value + 1,
      }));
      const received = vi.fn();
      socket
        .createListener<{ value: number }>()({ topic: "numbers" })
        .listen(({ data }) => received(data));
      await socket.connect();

      sendToAll("numbers", { value: 41 });

      await vi.waitFor(() => expect(received).toHaveBeenCalledWith({ value: 42 }));
      await socket.disconnect();
      await stopServer();
    });

    it("should keep the connection when the server sends binary and malformed frames", async () => {
      const { startServer, stopServer, sendToAll, sendRawToAll, getConnectedClients } = createWebsocketE2EServer();
      const url = await startServer();
      const socket = new Socket({ url });
      const received = vi.fn();
      const errors = vi.fn();
      socket.onError(errors);
      socket
        .createListener<number>()({ topic: "numbers" })
        .listen(({ data }) => received(data));
      await socket.connect();
      await vi.waitFor(() => expect(getConnectedClients()).toHaveLength(1));

      getConnectedClients()[0].send(Buffer.from([0, 1, 2, 255]));
      sendRawToAll("{ broken json");
      sendRawToAll("");
      sendToAll("numbers", 1);

      await vi.waitFor(() => expect(received).toHaveBeenCalledWith(1));
      expect(received).toHaveBeenCalledTimes(1);
      expect(errors).not.toHaveBeenCalled();
      expect(socket.adapter.connected).toBe(true);
      await socket.disconnect();
      await stopServer();
    });
  });

  describe("When using a real Server-Sent Events server", () => {
    it("should be connected when connect resolves right after creating the socket", async () => {
      const { startServer, stopServer } = createSseE2EServer();
      const url = await startServer();
      const socket = new Socket({ url, adapter: ServerSentEventsAdapter });

      await socket.connect();

      expect(socket.adapter.connected).toBe(true);
      await socket.disconnect();
      await stopServer();
    });

    it("should report the disconnection when the server drops the stream", async () => {
      const { startServer, stopServer, closeAllClients } = createSseE2EServer();
      const url = await startServer();
      const socket = new Socket({ url, adapter: ServerSentEventsAdapter, reconnectTime: 10_000 });
      const disconnected = vi.fn();
      socket.onError(() => null);
      socket.events.onDisconnected(disconnected);
      await socket.connect();

      closeAllClients();

      await vi.waitFor(() => expect(disconnected).toHaveBeenCalledTimes(1), { timeout: 5000 });
      expect(socket.adapter.connected).toBe(false);
      await socket.disconnect();
      await stopServer();
    });

    it("should receive messages again after the dropped stream is back", async () => {
      const { startServer, stopServer, closeAllClients, sendEvent, getConnectedCount } = createSseE2EServer();
      const url = await startServer();
      const socket = new Socket({ url, adapter: ServerSentEventsAdapter, reconnectTime: 100 });
      const received = vi.fn();
      const connected = vi.fn();
      socket.onError(() => null);
      socket
        .createListener<number>()({ topic: "numbers" })
        .listen(({ data }) => received(data));
      await socket.connect();
      socket.events.onConnected(connected);

      closeAllClients();
      await vi.waitFor(() => expect(connected).toHaveBeenCalledTimes(1), { timeout: 8000 });
      await vi.waitFor(() => expect(getConnectedCount()).toBe(1), { timeout: 5000 });
      sendEvent("numbers", 7);

      await vi.waitFor(() => expect(received).toHaveBeenCalledWith(7), { timeout: 5000 });
      expect(received).toHaveBeenCalledTimes(1);
      await socket.disconnect();
      await stopServer();
    }, 20_000);

    it("should stay disconnected after disconnecting a stream that is still opening", async () => {
      const silent = await createSilentServer();
      const socket = new Socket({
        url: `http://127.0.0.1:${silent.port}`,
        adapter: ServerSentEventsAdapter,
        reconnectTime: 100,
      });
      const reconnecting = vi.fn();
      const connecting = vi.fn();
      await vi.waitFor(() => expect(silent.connections.length).toBeGreaterThanOrEqual(1));

      await socket.disconnect();
      // Everything the socket does from now on would be acting against the manual disconnect
      socket.events.onReconnecting(reconnecting);
      socket.events.onConnecting(connecting);
      await sleep(400);

      expect(reconnecting).not.toHaveBeenCalled();
      expect(connecting).not.toHaveBeenCalled();
      expect(socket.adapter.connecting).toBe(false);
      await silent.stop();
    });

    it("should throw from emit instead of leaving an unhandled rejection", async () => {
      const { startServer, stopServer } = createSseE2EServer();
      const url = await startServer();
      const socket = new Socket({ url, adapter: ServerSentEventsAdapter });
      await socket.connect();

      expect(() => socket.createEmitter<number>()({ topic: "numbers" }).emit({ payload: 1 })).toThrow(
        "Cannot emit events in SSE adapter",
      );
      await socket.disconnect();
      await stopServer();
    });
  });
});
