/**
 * @vitest-environment node
 */
import { WebSocket as NodeWebSocket } from "ws";

(globalThis as any).WebSocket = NodeWebSocket;
(globalThis as any).window = globalThis;

import { Socket } from "@hyper-fetch/sockets";
import { createWebsocketE2EServer, sleep, waitForConnection } from "@hyper-fetch/testing";

const wsServer = createWebsocketE2EServer();

describe("E2E [ WebSocket Emitters ]", () => {
  let url: string;

  beforeAll(async () => {
    url = await wsServer.startServer();
  });

  afterAll(async () => {
    await wsServer.stopServer();
  });

  it("should send a message to the server", async () => {
    const socket = new Socket({ url });
    await waitForConnection(socket);

    const emitter = socket.createEmitter<{ greeting: string }>()({ topic: "hello" });

    const messagePromise = wsServer.waitForMessage();
    await emitter.setPayload({ greeting: "world" }).emit();
    const received = await messagePromise;

    expect(received).toStrictEqual({ topic: "hello", data: { greeting: "world" } });

    await socket.disconnect();
  });

  it("should send payload correctly", async () => {
    const socket = new Socket({ url });
    await waitForConnection(socket);

    const emitter = socket.createEmitter<{ items: number[] }>()({ topic: "data" });

    const messagePromise = wsServer.waitForMessage();
    await emitter.setPayload({ items: [1, 2, 3] }).emit();
    const received = await messagePromise;

    expect(received.topic).toBe("data");
    expect(received.data).toStrictEqual({ items: [1, 2, 3] });

    await socket.disconnect();
  });

  it("should resolve topic params before sending", async () => {
    const socket = new Socket({ url });
    await waitForConnection(socket);

    const emitter = socket.createEmitter<{ action: string }>()({ topic: "room/:roomId/action" });

    const messagePromise = wsServer.waitForMessage();
    await emitter.setParams({ roomId: "main" }).setPayload({ action: "join" }).emit();
    const received = await messagePromise;

    expect(received.topic).toBe("room/main/action");
    expect(received.data).toStrictEqual({ action: "join" });

    await socket.disconnect();
  });

  it("should block emit when disconnected", async () => {
    const socket = new Socket({ url, adapterOptions: { autoConnect: false } });

    const emitter = socket.createEmitter<{ v: number }>()({ topic: "blocked" });

    let errorFired = false;
    socket.events.onError(() => {
      errorFired = true;
    });

    // Should not throw but should not send
    await emitter.setPayload({ v: 1 }).emit();
    await sleep(100);

    // The emit was blocked silently (onEmit returns null)
    expect(socket.adapter.connected).toBe(false);
  });

  it("should apply payload mapper before sending", async () => {
    const socket = new Socket({ url });
    await waitForConnection(socket);

    const emitter = socket
      .createEmitter<{ raw: string }>()({ topic: "mapped" })
      .setPayloadMapper((payload: any) => ({
        raw: payload.raw.toUpperCase(),
        transformed: true,
      }));

    const messagePromise = wsServer.waitForMessage();
    await emitter.setPayload({ raw: "hello" }).emit();
    const received = await messagePromise;

    expect(received.topic).toBe("mapped");
    expect(received.data).toStrictEqual({ raw: "HELLO", transformed: true });

    await socket.disconnect();
  });

  it("should emit after reconnection", async () => {
    const localServer = createWebsocketE2EServer();
    const localUrl = await localServer.startServer();

    const socket = new Socket({ url: localUrl, reconnectTime: 200 });
    await waitForConnection(socket);

    const emitter = socket.createEmitter<{ v: number }>()({ topic: "after-reconnect" });

    // Send before disruption
    let messagePromise = localServer.waitForMessage();
    await emitter.setPayload({ v: 1 }).emit();
    const first = await messagePromise;
    expect(first.data).toStrictEqual({ v: 1 });

    // Cause reconnection
    localServer.terminateAllClients();
    await sleep(600);
    await waitForConnection(socket, 3000);

    // Send after reconnection
    messagePromise = localServer.waitForMessage();
    await emitter.setPayload({ v: 2 }).emit();
    const second = await messagePromise;
    expect(second.data).toStrictEqual({ v: 2 });

    await socket.disconnect();
    await localServer.stopServer();
  });

  it("should send multiple messages sequentially", async () => {
    const socket = new Socket({ url });
    await waitForConnection(socket);

    const emitter = socket.createEmitter<{ i: number }>()({ topic: "sequential" });

    const messages: any[] = [];
    wsServer.onMessage((msg) => {
      if (msg.topic === "sequential") messages.push(msg);
    });

    for (let i = 0; i < 5; i++) {
      await emitter.setPayload({ i }).emit();
    }

    await sleep(300);

    expect(messages).toHaveLength(5);
    messages.forEach((msg, idx) => {
      expect(msg.data).toStrictEqual({ i: idx });
    });

    await socket.disconnect();
  });
});
