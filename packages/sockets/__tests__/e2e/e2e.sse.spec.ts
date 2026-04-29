/**
 * @vitest-environment node
 */
import { EventSource as NodeEventSource } from "eventsource";

(globalThis as any).EventSource = NodeEventSource;
(globalThis as any).window = globalThis;

import { Socket } from "@hyper-fetch/sockets";
import { ServerSentEventsAdapter } from "@hyper-fetch/sockets";
import { createSseE2EServer, sleep, waitForConnection } from "@hyper-fetch/testing";

describe("E2E [ SSE Adapter ]", () => {
  it("should connect to an SSE endpoint", async () => {
    const { startServer, stopServer, waitForClient } = createSseE2EServer();
    const url = await startServer();

    const socket = new Socket({
      url,
      adapter: ServerSentEventsAdapter,
    });

    await waitForClient();
    await waitForConnection(socket, 5000);

    expect(socket.adapter.connected).toBe(true);

    await socket.disconnect();
    await stopServer();
  });

  it("should receive SSE events by topic", async () => {
    const { startServer, stopServer, sendEvent, waitForClient } = createSseE2EServer();
    const url = await startServer();

    const socket = new Socket({
      url,
      adapter: ServerSentEventsAdapter,
    });

    await waitForClient();
    await waitForConnection(socket, 5000);

    const listener = socket.createListener<{ name: string }>()({ topic: "user-update" });
    const received: any[] = [];
    listener.listen(({ data }) => received.push(data));

    await sleep(50);
    sendEvent("user-update", { name: "Alice" });
    await sleep(300);

    expect(received).toHaveLength(1);
    expect(received[0]).toStrictEqual({ name: "Alice" });

    await socket.disconnect();
    await stopServer();
  });

  it("should throw when trying to emit on SSE", async () => {
    const { startServer, stopServer, waitForClient } = createSseE2EServer();
    const url = await startServer();

    const socket = new Socket({
      url,
      adapter: ServerSentEventsAdapter,
    });

    await waitForClient();
    await waitForConnection(socket, 5000);

    const emitter = socket.createEmitter<{ v: number }>()({ topic: "test" });

    // Emitter.emit() calls adapter.emit() without awaiting, so the error
    // surfaces as an unhandled rejection. Catch it explicitly.
    let errorCaught = false;
    try {
      await (socket.adapter as any).emit(emitter.setPayload({ v: 1 }));
    } catch (error: any) {
      errorCaught = true;
      expect(error.message).toBe("Cannot emit events in SSE adapter");
    }
    expect(errorCaught).toBe(true);

    await socket.disconnect();
    await stopServer();
  });

  it("should disconnect cleanly", async () => {
    const { startServer, stopServer, waitForClient } = createSseE2EServer();
    const url = await startServer();

    const socket = new Socket({
      url,
      adapter: ServerSentEventsAdapter,
    });

    await waitForClient();
    await waitForConnection(socket, 5000);

    expect(socket.adapter.connected).toBe(true);

    let disconnectedFired = false;
    socket.events.onDisconnected(() => {
      disconnectedFired = true;
    });

    await socket.disconnect();
    await sleep(100);

    expect(socket.adapter.connected).toBe(false);
    expect(disconnectedFired).toBe(true);

    await stopServer();
  });

  it("should reconnect after server closes connection", async () => {
    const sseServer = createSseE2EServer();
    const url = await sseServer.startServer();

    const socket = new Socket({
      url,
      adapter: ServerSentEventsAdapter,
      reconnectTime: 500,
      reconnect: 3,
    });

    await sseServer.waitForClient();
    await waitForConnection(socket, 5000);

    let reconnectFired = false;
    socket.onReconnect(() => {
      reconnectFired = true;
    });

    // Destroy server completely to force connection loss
    await sseServer.stopServer();
    await sleep(2000);

    expect(reconnectFired).toBe(true);

    await socket.disconnect();
  });

  it("should support multiple listeners on different topics", async () => {
    const { startServer, stopServer, sendEvent, waitForClient } = createSseE2EServer();
    const url = await startServer();

    const socket = new Socket({
      url,
      adapter: ServerSentEventsAdapter,
    });

    await waitForClient();
    await waitForConnection(socket, 5000);

    const usersData: any[] = [];
    const ordersData: any[] = [];

    socket.createListener<{ id: number }>()({ topic: "users" }).listen(({ data }) => usersData.push(data));
    socket.createListener<{ orderId: string }>()({ topic: "orders" }).listen(({ data }) => ordersData.push(data));

    await sleep(50);
    sendEvent("users", { id: 1 });
    sendEvent("orders", { orderId: "o1" });
    sendEvent("users", { id: 2 });
    await sleep(300);

    expect(usersData).toStrictEqual([{ id: 1 }, { id: 2 }]);
    expect(ordersData).toStrictEqual([{ orderId: "o1" }]);

    await socket.disconnect();
    await stopServer();
  });

  it("should pass query params in the SSE URL", async () => {
    const { startServer, stopServer, waitForClient } = createSseE2EServer();
    const url = await startServer();

    const socket = new Socket({
      url,
      adapter: ServerSentEventsAdapter,
      queryParams: { token: "xyz", channel: "main" },
    });

    await waitForClient();
    await waitForConnection(socket, 5000);

    expect(socket.adapter.connected).toBe(true);

    await socket.disconnect();
    await stopServer();
  });
});
