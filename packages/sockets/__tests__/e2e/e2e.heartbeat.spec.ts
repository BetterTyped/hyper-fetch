/**
 * @vitest-environment node
 */
import { Socket } from "@hyper-fetch/sockets";
import { createWebsocketE2EServer, sleep, waitForConnection } from "@hyper-fetch/testing";

describe("E2E [ WebSocket Heartbeat ]", () => {
  it("should send heartbeat messages at configured interval", async () => {
    const { startServer, stopServer, onMessage } = createWebsocketE2EServer();
    const url = await startServer();

    const socket = new Socket({
      url,
      adapterOptions: {
        heartbeat: true,
        pingTimeout: 200,
        pongTimeout: 5000,
      },
    });

    await waitForConnection(socket);

    const heartbeats: any[] = [];
    onMessage((msg) => {
      if (msg.topic === "heartbeat") heartbeats.push(msg);
    });

    // Wait for at least one heartbeat
    await sleep(600);

    expect(heartbeats.length).toBeGreaterThanOrEqual(1);
    expect(heartbeats[0].data).toBe("heartbeat");

    await socket.disconnect();
    await stopServer();
  });

  it("should trigger reconnection when pong times out", async () => {
    const { startServer, stopServer } = createWebsocketE2EServer();
    const url = await startServer();

    const socket = new Socket({
      url,
      reconnectTime: 200,
      adapterOptions: {
        heartbeat: true,
        pingTimeout: 100,
        pongTimeout: 100,
      },
    });

    await waitForConnection(socket);

    let reconnectFired = false;
    socket.onReconnect(() => {
      reconnectFired = true;
    });

    // Server doesn't respond to heartbeat, so pong times out -> close -> reconnect
    await sleep(800);

    expect(reconnectFired).toBe(true);

    await socket.disconnect();
    await stopServer();
  });

  it("should reset heartbeat timer on incoming messages", async () => {
    const { startServer, stopServer, sendToAll, onMessage } = createWebsocketE2EServer();
    const url = await startServer();

    const socket = new Socket({
      url,
      adapterOptions: {
        heartbeat: true,
        pingTimeout: 300,
        pongTimeout: 5000,
      },
    });

    await waitForConnection(socket);

    const heartbeats: any[] = [];
    onMessage((msg) => {
      if (msg.topic === "heartbeat") heartbeats.push(msg);
    });

    // Send activity messages to keep resetting the heartbeat timer
    for (let i = 0; i < 3; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(150);
      sendToAll("activity", { i });
    }

    // The heartbeat timer resets on each message, so fewer heartbeats should have been sent
    const heartbeatsBefore = heartbeats.length;

    // Now wait without activity for heartbeat to fire
    await sleep(600);

    expect(heartbeats.length).toBeGreaterThan(heartbeatsBefore);

    await socket.disconnect();
    await stopServer();
  });

  it("should not send heartbeats when heartbeat is disabled", async () => {
    const { startServer, stopServer, onMessage } = createWebsocketE2EServer();
    const url = await startServer();

    const socket = new Socket({
      url,
      adapterOptions: {
        heartbeat: false,
      },
    });

    await waitForConnection(socket);

    const heartbeats: any[] = [];
    onMessage((msg) => {
      if (msg.topic === "heartbeat") heartbeats.push(msg);
    });

    await sleep(600);

    expect(heartbeats).toHaveLength(0);

    await socket.disconnect();
    await stopServer();
  });

  it("should use custom heartbeat message", async () => {
    const { startServer, stopServer, onMessage } = createWebsocketE2EServer();
    const url = await startServer();

    const socket = new Socket({
      url,
      adapterOptions: {
        heartbeat: true,
        pingTimeout: 150,
        pongTimeout: 5000,
        heartbeatMessage: "ping",
      },
    });

    await waitForConnection(socket);

    const heartbeats: any[] = [];
    onMessage((msg) => {
      if (msg.topic === "heartbeat") heartbeats.push(msg);
    });

    await sleep(500);

    expect(heartbeats.length).toBeGreaterThanOrEqual(1);
    expect(heartbeats[0].data).toBe("ping");

    await socket.disconnect();
    await stopServer();
  });
});
