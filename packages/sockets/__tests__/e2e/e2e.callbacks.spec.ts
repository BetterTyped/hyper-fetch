/**
 * @vitest-environment node
 */
import { Socket } from "@hyper-fetch/sockets";
import { createWebsocketE2EServer, sleep, waitForConnection } from "@hyper-fetch/testing";

describe("E2E [ WebSocket Callbacks & Interceptors ]", () => {
  it("should fire onConnected callback", async () => {
    const { startServer, stopServer } = createWebsocketE2EServer();
    const url = await startServer();

    let fired = false;
    const socket = new Socket({ url, adapterOptions: { autoConnect: false } });
    socket.onConnected(() => {
      fired = true;
    });

    await socket.connect();
    await waitForConnection(socket);

    expect(fired).toBe(true);

    await socket.disconnect();
    await stopServer();
  });

  it("should fire onDisconnected callback", async () => {
    const { startServer, stopServer } = createWebsocketE2EServer();
    const url = await startServer();

    const socket = new Socket({ url });
    await waitForConnection(socket);

    let fired = false;
    socket.onDisconnected(() => {
      fired = true;
    });

    await socket.disconnect();
    await sleep(100);

    expect(fired).toBe(true);

    await stopServer();
  });

  it("should fire onReconnect callback on each attempt", async () => {
    const { startServer, stopServer, terminateAllClients } = createWebsocketE2EServer();
    const url = await startServer();

    const socket = new Socket({ url, reconnectTime: 150, reconnect: 3 });
    await waitForConnection(socket);

    let reconnectCount = 0;
    socket.onReconnect(() => {
      reconnectCount += 1;
    });

    terminateAllClients();
    await sleep(1000);

    expect(reconnectCount).toBeGreaterThanOrEqual(1);

    await socket.disconnect();
    await stopServer();
  });

  it("should fire onReconnectFailed when attempts are exhausted", async () => {
    const wsServer = createWebsocketE2EServer();
    const url = await wsServer.startServer();

    const socket = new Socket({ url, reconnect: 1, reconnectTime: 200 });
    await waitForConnection(socket);

    let failedFired = false;
    socket.onReconnectFailed(() => {
      failedFired = true;
    });

    // Stop server completely so reconnect fails
    await wsServer.stopServer();
    await sleep(3000);

    expect(failedFired).toBe(true);
  });

  it("should fire onError callback on connection errors", async () => {
    const { startServer, stopServer, terminateAllClients } = createWebsocketE2EServer();
    const url = await startServer();

    const socket = new Socket({ url, reconnectTime: 200 });
    await waitForConnection(socket);

    const errors: Error[] = [];
    socket.onError(({ error }: { error: Error }) => {
      errors.push(error);
    });

    terminateAllClients();
    await sleep(500);

    expect(errors.length).toBeGreaterThanOrEqual(1);

    await socket.disconnect();
    await stopServer();
  });

  it("should intercept incoming messages with onMessage", async () => {
    const { startServer, stopServer, sendToAll } = createWebsocketE2EServer();
    const url = await startServer();

    const socket = new Socket({ url, adapterOptions: { autoConnect: false } });
    socket.onMessage(({ event }: any) => {
      return {
        ...event,
        data: { ...event.data, intercepted: true },
        extra: event.extra,
      };
    });

    await socket.connect();
    await waitForConnection(socket);

    const listener = socket.createListener<{ value: number; intercepted?: boolean }>()({ topic: "intercept-test" });

    const received: any[] = [];
    listener.listen(({ data }) => received.push(data));

    await sleep(50);
    sendToAll("intercept-test", { value: 42 });
    await sleep(200);

    expect(received.length).toBeGreaterThanOrEqual(1);

    await socket.disconnect();
    await stopServer();
  });

  it("should intercept outgoing messages with onSend", async () => {
    const { startServer, stopServer, waitForMessage } = createWebsocketE2EServer();
    const url = await startServer();

    const socket = new Socket({ url, adapterOptions: { autoConnect: false } });
    socket.onSend(({ emitter }) => {
      return {
        ...emitter,
        payload: { ...(emitter.payload as any), modified: true },
      };
    });

    await socket.connect();
    await waitForConnection(socket);

    const emitter = socket.createEmitter<{ value: number }>()({ topic: "send-intercept" });

    const messagePromise = waitForMessage();
    await emitter.setPayload({ value: 10 }).emit();
    const received = await messagePromise;

    expect(received.data).toMatchObject({ value: 10, modified: true });

    await socket.disconnect();
    await stopServer();
  });

  it("should emit events accessible via socket.events bus", async () => {
    const { startServer, stopServer, sendToAll } = createWebsocketE2EServer();
    const url = await startServer();

    const socket = new Socket({ url, adapterOptions: { autoConnect: false } });

    const connectedEvents: any[] = [];
    const disconnectedEvents: any[] = [];
    const listenerEvents: any[] = [];

    socket.events.onConnected(() => connectedEvents.push(true));
    socket.events.onDisconnected(() => disconnectedEvents.push(true));
    socket.events.onListenerEvent(({ topic, data }: any) => listenerEvents.push({ topic, data }));

    await socket.connect();
    await waitForConnection(socket);
    expect(connectedEvents).toHaveLength(1);

    const listener = socket.createListener<{ x: number }>()({ topic: "event-bus" });
    listener.listen(() => {});

    await sleep(50);
    sendToAll("event-bus", { x: 1 });
    await sleep(200);

    expect(listenerEvents.length).toBeGreaterThanOrEqual(1);
    expect(listenerEvents[0]).toMatchObject({ topic: "event-bus", data: { x: 1 } });

    await socket.disconnect();
    await sleep(100);

    expect(disconnectedEvents).toHaveLength(1);

    await stopServer();
  });

  it("should support chaining multiple callbacks", async () => {
    const { startServer, stopServer } = createWebsocketE2EServer();
    const url = await startServer();

    const calls: string[] = [];

    const socket = new Socket({ url, adapterOptions: { autoConnect: false } });
    socket
      .onConnected(() => calls.push("connected-1"))
      .onConnected(() => calls.push("connected-2"))
      .onDisconnected(() => calls.push("disconnected-1"))
      .onDisconnected(() => calls.push("disconnected-2"));

    await socket.connect();
    await waitForConnection(socket);

    expect(calls).toStrictEqual(["connected-1", "connected-2"]);

    await socket.disconnect();
    await sleep(100);

    expect(calls).toStrictEqual(["connected-1", "connected-2", "disconnected-1", "disconnected-2"]);

    await stopServer();
  });
});
