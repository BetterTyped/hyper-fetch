/**
 * @vitest-environment node
 */
import { Socket } from "@hyper-fetch/sockets";
import { createWebsocketE2EServer, sleep, waitForConnection } from "@hyper-fetch/testing";

const wsServer = createWebsocketE2EServer();

describe("E2E [ WebSocket Listeners ]", () => {
  let url: string;

  beforeAll(async () => {
    url = await wsServer.startServer();
  });

  afterAll(async () => {
    await wsServer.stopServer();
  });

  it("should receive a message on a matching topic", async () => {
    const socket = new Socket({ url });
    await waitForConnection(socket);

    const listener = socket.createListener<{ name: string }>()({ topic: "user-update" });

    const received: { data: { name: string } }[] = [];
    listener.listen(({ data }) => {
      received.push({ data });
    });

    await sleep(50);
    wsServer.sendToAll("user-update", { name: "John" });
    await sleep(200);

    expect(received).toHaveLength(1);
    expect(received[0].data).toStrictEqual({ name: "John" });

    await socket.disconnect();
  });

  it("should route messages to correct listeners by topic", async () => {
    const socket = new Socket({ url });
    await waitForConnection(socket);

    const userListener = socket.createListener<{ id: number }>()({ topic: "users" });
    const orderListener = socket.createListener<{ orderId: string }>()({ topic: "orders" });

    const userMessages: any[] = [];
    const orderMessages: any[] = [];

    userListener.listen(({ data }) => userMessages.push(data));
    orderListener.listen(({ data }) => orderMessages.push(data));

    await sleep(50);
    wsServer.sendToAll("users", { id: 1 });
    wsServer.sendToAll("orders", { orderId: "abc" });
    wsServer.sendToAll("users", { id: 2 });
    await sleep(200);

    expect(userMessages).toStrictEqual([{ id: 1 }, { id: 2 }]);
    expect(orderMessages).toStrictEqual([{ orderId: "abc" }]);

    await socket.disconnect();
  });

  it("should deliver messages to multiple listeners on same topic", async () => {
    const socket = new Socket({ url });
    await waitForConnection(socket);

    const listener1 = socket.createListener<{ v: number }>()({ topic: "shared" });
    const listener2 = socket.createListener<{ v: number }>()({ topic: "shared" });

    const results1: any[] = [];
    const results2: any[] = [];

    listener1.listen(({ data }) => results1.push(data));
    listener2.listen(({ data }) => results2.push(data));

    await sleep(50);
    wsServer.sendToAll("shared", { v: 42 });
    await sleep(200);

    expect(results1).toStrictEqual([{ v: 42 }]);
    expect(results2).toStrictEqual([{ v: 42 }]);

    await socket.disconnect();
  });

  it("should stop receiving after remove listener", async () => {
    const socket = new Socket({ url });
    await waitForConnection(socket);

    const listener = socket.createListener<{ v: number }>()({ topic: "removable" });

    const received: any[] = [];
    const remove = listener.listen(({ data }) => received.push(data));

    await sleep(50);
    wsServer.sendToAll("removable", { v: 1 });
    await sleep(200);

    expect(received).toHaveLength(1);

    remove();

    wsServer.sendToAll("removable", { v: 2 });
    await sleep(200);

    expect(received).toHaveLength(1);

    await socket.disconnect();
  });

  it("should handle listener with params in topic", async () => {
    const socket = new Socket({ url });
    await waitForConnection(socket);

    const listener = socket.createListener<{ status: string }>()({ topic: "room/:roomId/status" });
    const boundListener = listener.setParams({ roomId: "lobby" });

    const received: any[] = [];
    boundListener.listen(({ data }) => received.push(data));

    await sleep(50);
    wsServer.sendToAll("room/lobby/status", { status: "active" });
    await sleep(200);

    expect(received).toStrictEqual([{ status: "active" }]);

    await socket.disconnect();
  });

  it("should continue receiving messages after reconnection", async () => {
    const localServer = createWebsocketE2EServer();
    const localUrl = await localServer.startServer();

    const socket = new Socket({ url: localUrl, reconnectTime: 200 });
    await waitForConnection(socket);

    const listener = socket.createListener<{ v: number }>()({ topic: "persist" });
    const received: any[] = [];
    listener.listen(({ data }) => received.push(data));

    await sleep(50);
    localServer.sendToAll("persist", { v: 1 });
    await sleep(200);

    expect(received).toStrictEqual([{ v: 1 }]);

    // Trigger reconnection
    localServer.terminateAllClients();
    await sleep(600);
    await waitForConnection(socket, 3000);

    // Send after reconnect
    localServer.sendToAll("persist", { v: 2 });
    await sleep(200);

    expect(received).toStrictEqual([{ v: 1 }, { v: 2 }]);

    await socket.disconnect();
    await localServer.stopServer();
  });

  it("should receive rapid messages in order", async () => {
    const socket = new Socket({ url });
    await waitForConnection(socket);

    const listener = socket.createListener<{ i: number }>()({ topic: "rapid" });
    const received: number[] = [];
    listener.listen(({ data }) => received.push(data.i));

    await sleep(50);

    const count = 50;
    for (let i = 0; i < count; i += 1) {
      wsServer.sendToAll("rapid", { i });
    }

    await sleep(500);

    expect(received).toHaveLength(count);
    expect(received).toStrictEqual(Array.from({ length: count }, (_, i) => i));

    await socket.disconnect();
  });

  it("should handle large payloads", async () => {
    const socket = new Socket({ url });
    await waitForConnection(socket);

    const listener = socket.createListener<{ items: { id: number; name: string }[] }>()({ topic: "large" });

    const largeData = {
      items: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `item-${i}-${"x".repeat(100)}`,
      })),
    };

    const received: any[] = [];
    listener.listen(({ data }) => received.push(data));

    await sleep(50);
    wsServer.sendToAll("large", largeData);
    await sleep(500);

    expect(received).toHaveLength(1);
    expect(received[0].items).toHaveLength(1000);
    expect(received[0].items[0].id).toBe(0);
    expect(received[0].items[999].id).toBe(999);

    await socket.disconnect();
  });
});
