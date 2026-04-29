/* eslint-disable no-await-in-loop */
/**
 * @vitest-environment node
 */
import { Socket } from "@hyper-fetch/sockets";
import { createWebsocketE2EServer, sleep, waitForConnection } from "@hyper-fetch/testing";

describe("E2E [ WebSocket Edge Cases ]", () => {
  it("should handle rapid connect/disconnect cycles without crashing", async () => {
    const { startServer, stopServer } = createWebsocketE2EServer();
    const url = await startServer();

    const socket = new Socket({ url, adapterOptions: { autoConnect: false }, reconnectTime: 100 });

    for (let i = 0; i < 5; i += 1) {
      await socket.connect();
      await sleep(50);
      await socket.disconnect();
      await sleep(50);
    }

    // Should be in a clean disconnected state
    expect(socket.adapter.connected).toBe(false);
    expect(socket.adapter.connecting).toBe(false);

    // Should still be able to connect
    await socket.connect();
    await waitForConnection(socket, 3000);
    expect(socket.adapter.connected).toBe(true);

    await socket.disconnect();
    await stopServer();
  });

  it("should survive malformed JSON from server", async () => {
    const { startServer, stopServer, sendRawToAll } = createWebsocketE2EServer();
    const url = await startServer();

    const socket = new Socket({ url });
    await waitForConnection(socket);

    const errors: any[] = [];
    socket.onError(({ error }: any) => errors.push(error));

    // Send malformed JSON
    sendRawToAll("this is not json{{{");
    await sleep(200);

    // Connection should still be alive
    expect(socket.adapter.connected).toBe(true);

    await socket.disconnect();
    await stopServer();
  });

  it("should handle multiple concurrent sockets independently", async () => {
    const { startServer, stopServer, sendToAll } = createWebsocketE2EServer();
    const url = await startServer();

    const socket1 = new Socket({ url });
    const socket2 = new Socket({ url });
    const socket3 = new Socket({ url });

    await waitForConnection(socket1);
    await waitForConnection(socket2);
    await waitForConnection(socket3);

    const received1: any[] = [];
    const received2: any[] = [];
    const received3: any[] = [];

    socket1
      .createListener<{ v: number }>()({ topic: "multi" })
      .listen(({ data }) => received1.push(data));
    socket2
      .createListener<{ v: number }>()({ topic: "multi" })
      .listen(({ data }) => received2.push(data));
    socket3
      .createListener<{ v: number }>()({ topic: "multi" })
      .listen(({ data }) => received3.push(data));

    await sleep(50);
    sendToAll("multi", { v: 1 });
    await sleep(200);

    expect(received1).toStrictEqual([{ v: 1 }]);
    expect(received2).toStrictEqual([{ v: 1 }]);
    expect(received3).toStrictEqual([{ v: 1 }]);

    // Disconnect one, others should still work
    await socket2.disconnect();

    sendToAll("multi", { v: 2 });
    await sleep(200);

    expect(received1).toStrictEqual([{ v: 1 }, { v: 2 }]);
    expect(received2).toStrictEqual([{ v: 1 }]); // No new message
    expect(received3).toStrictEqual([{ v: 1 }, { v: 2 }]);

    await socket1.disconnect();
    await socket3.disconnect();
    await stopServer();
  });

  it("should handle disconnect during reconnection gracefully", async () => {
    const { startServer, stopServer } = createWebsocketE2EServer();
    const url = await startServer();

    const socket = new Socket({ url, reconnectTime: 500 });
    await waitForConnection(socket);

    // Stop the server so reconnect cannot succeed
    await stopServer();
    await sleep(100);

    // Disconnect while reconnection is pending
    await socket.disconnect();
    await sleep(800);

    expect(socket.adapter.connected).toBe(false);
  });

  it("should handle server sending empty message", async () => {
    const { startServer, stopServer, sendRawToAll } = createWebsocketE2EServer();
    const url = await startServer();

    const socket = new Socket({ url });
    await waitForConnection(socket);

    sendRawToAll("");
    await sleep(200);

    // Should not crash
    expect(socket.adapter.connected).toBe(true);

    await socket.disconnect();
    await stopServer();
  });

  it("should handle many listeners without issues", async () => {
    const { startServer, stopServer, sendToAll } = createWebsocketE2EServer();
    const url = await startServer();

    const socket = new Socket({ url });
    await waitForConnection(socket);

    const listenerCount = 100;
    const receivedCounts = new Array(listenerCount).fill(0);

    for (let i = 0; i < listenerCount; i += 1) {
      const idx = i;
      socket
        .createListener<{ v: number }>()({ topic: "many-listeners" })
        .listen(() => {
          receivedCounts[idx] += 1;
        });
    }

    await sleep(50);
    sendToAll("many-listeners", { v: 1 });
    await sleep(300);

    // All listeners should have received the message
    receivedCounts.forEach((count) => {
      expect(count).toBe(1);
    });

    await socket.disconnect();
    await stopServer();
  });

  it("should handle connecting to an unreachable server", async () => {
    const socket = new Socket({
      url: "ws://127.0.0.1:19999",
      reconnect: 1,
      reconnectTime: 100,
      adapterOptions: { autoConnect: false },
    });

    let errorFired = false;

    socket.onError(() => {
      errorFired = true;
    });

    await socket.connect();
    await sleep(1000);

    expect(errorFired).toBe(true);
  });

  it("should handle bidirectional communication", async () => {
    const { startServer, stopServer, onMessage } = createWebsocketE2EServer();
    const url = await startServer();

    const socket = new Socket({ url });
    await waitForConnection(socket);

    // Set up echo behavior on server
    const serverReceived: any[] = [];
    onMessage((msg, ws) => {
      serverReceived.push(msg);
      if (msg.topic === "echo-request") {
        ws.send(JSON.stringify({ topic: "echo-response", data: msg.data }));
      }
    });

    // Set up client listener for response
    const clientReceived: any[] = [];
    socket
      .createListener<{ message: string }>()({ topic: "echo-response" })
      .listen(({ data }) => {
        clientReceived.push(data);
      });

    await sleep(50);

    // Client sends, server echoes back
    const emitter = socket.createEmitter<{ message: string }>()({ topic: "echo-request" });
    await emitter.setPayload({ message: "ping" }).emit();

    await sleep(300);

    expect(serverReceived).toHaveLength(1);
    expect(serverReceived[0].data).toStrictEqual({ message: "ping" });
    expect(clientReceived).toHaveLength(1);
    expect(clientReceived[0]).toStrictEqual({ message: "ping" });

    await socket.disconnect();
    await stopServer();
  });
});
