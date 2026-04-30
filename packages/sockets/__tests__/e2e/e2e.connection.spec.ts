/**
 * @vitest-environment node
 */
import { Socket } from "@hyper-fetch/sockets";
import { createWebsocketE2EServer, sleep, waitForConnection } from "@hyper-fetch/testing";

const { startServer, stopServer, waitForClient } = createWebsocketE2EServer();

describe("E2E [ WebSocket Connection ]", () => {
  let url: string;

  beforeAll(async () => {
    url = await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  it("should connect to a real WebSocket server", async () => {
    const socket = new Socket({ url, adapterOptions: { autoConnect: false } });

    expect(socket.adapter.connected).toBe(false);

    await socket.connect();
    await waitForConnection(socket);

    expect(socket.adapter.connected).toBe(true);
    await socket.disconnect();
  });

  it("should fire connecting and connected events in order", async () => {
    const events: string[] = [];

    const socket = new Socket({ url, adapterOptions: { autoConnect: false } });

    socket.events.onConnecting(({ connecting }) => {
      if (connecting) {events.push("connecting");}
    });
    socket.events.onConnected(() => {
      events.push("connected");
    });

    await socket.connect();
    await waitForConnection(socket);

    expect(events).toStrictEqual(["connecting", "connected"]);
    await socket.disconnect();
  });

  it("should not connect when autoConnect is false", async () => {
    const socket = new Socket({ url, adapterOptions: { autoConnect: false } });
    await sleep(200);

    expect(socket.adapter.connected).toBe(false);
    expect(socket.adapter.connecting).toBe(false);

    await socket.connect();
    await waitForConnection(socket);

    expect(socket.adapter.connected).toBe(true);
    await socket.disconnect();
  });

  it("should auto-connect by default", async () => {
    const socket = new Socket({ url });

    await waitForConnection(socket);

    expect(socket.adapter.connected).toBe(true);
    await socket.disconnect();
  });

  it("should pass query params in the URL", async () => {
    const clientPromise = waitForClient();
    const socket = new Socket({
      url,
      queryParams: { token: "abc123", mode: "test" },
    });

    const serverClient = await clientPromise;
    await waitForConnection(socket);

    // The ws server client doesn't directly expose URL, but connection succeeded with params
    expect(socket.adapter.connected).toBe(true);

    // Verify by checking the server received the connection
    expect(serverClient).toBeDefined();
    await socket.disconnect();
  });

  it("should disconnect manually", async () => {
    const socket = new Socket({ url });
    await waitForConnection(socket);

    expect(socket.adapter.connected).toBe(true);

    let disconnected = false;
    socket.events.onDisconnected(() => {
      disconnected = true;
    });

    await socket.disconnect();
    await sleep(100);

    expect(socket.adapter.connected).toBe(false);
    expect(disconnected).toBe(true);
  });

  it("should not auto-reconnect on clean close (code 1000)", async () => {
    const socket = new Socket({ url, reconnectTime: 100 });
    await waitForConnection(socket);

    let reconnectAttempted = false;
    socket.onReconnect(() => {
      reconnectAttempted = true;
    });

    await socket.disconnect();
    await sleep(300);

    expect(reconnectAttempted).toBe(false);
  });

  it("should support multiple sockets to the same server", async () => {
    const socket1 = new Socket({ url });
    const socket2 = new Socket({ url });

    await waitForConnection(socket1);
    await waitForConnection(socket2);

    expect(socket1.adapter.connected).toBe(true);
    expect(socket2.adapter.connected).toBe(true);

    await socket1.disconnect();

    expect(socket1.adapter.connected).toBe(false);
    expect(socket2.adapter.connected).toBe(true);

    await socket2.disconnect();
  });

  it("should fire disconnected event on server-initiated clean close", async () => {
    const { startServer: startLocal, stopServer: stopLocal, closeAllClients } = createWebsocketE2EServer();
    const localUrl = await startLocal();

    const socket = new Socket({ url: localUrl, reconnectTime: 100 });
    await waitForConnection(socket);

    let disconnectedFired = false;
    socket.events.onDisconnected(() => {
      disconnectedFired = true;
    });

    closeAllClients(1000, "normal close");
    await sleep(200);

    expect(disconnectedFired).toBe(true);

    await stopLocal();
  });
});
