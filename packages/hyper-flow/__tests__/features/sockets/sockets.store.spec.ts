import type { DevtoolsSocketEventData } from "@hyper-fetch/plugin-devtools";
import { SocketEvents } from "@hyper-fetch/plugin-devtools";

import { getMessageSize, MAX_SOCKET_MESSAGES, useSocketsStore } from "@/store/applications/sockets.store";

const event = (overrides: Partial<DevtoolsSocketEventData> = {}): DevtoolsSocketEventData => ({
  socketId: "ws://chat",
  url: "ws://chat",
  adapterName: "websockets",
  timestamp: 1000,
  ...overrides,
});

describe("Sockets store", () => {
  beforeEach(() => {
    useSocketsStore.setState(useSocketsStore.getInitialState(), true);
    useSocketsStore.getState().initialize("App");
  });

  const handle = (name: SocketEvents, overrides: Partial<DevtoolsSocketEventData> = {}) =>
    useSocketsStore.getState().handleEvent("App", name, event(overrides));
  const app = () => useSocketsStore.getState().applications.App;
  const socket = () => app().sockets["ws://chat"];

  it("should follow the connection through its states", () => {
    handle(SocketEvents.REGISTERED, { status: "disconnected" });
    expect(socket().status).toBe("disconnected");

    handle(SocketEvents.CONNECTING);
    expect(socket().status).toBe("connecting");

    handle(SocketEvents.CONNECTED, { timestamp: 2000 });
    expect(socket()).toMatchObject({ status: "connected", connectedAt: 2000 });

    handle(SocketEvents.DISCONNECTED);
    // Sockets count the attempts made before this one
    handle(SocketEvents.RECONNECTING, { attempts: 0 });
    handle(SocketEvents.CONNECTING);
    expect(socket()).toMatchObject({ status: "reconnecting", reconnectAttempts: 1, connectedAt: null });
    expect(app().messages.find((message) => message.event === SocketEvents.RECONNECTING)?.attempts).toBe(1);

    handle(SocketEvents.RECONNECTING, { attempts: 1 });
    expect(socket().reconnectAttempts).toBe(2);

    handle(SocketEvents.RECONNECT_FAILED, { attempts: 3 });
    expect(socket()).toMatchObject({ status: "failed", reconnectAttempts: 3 });

    handle(SocketEvents.CONNECTED, { timestamp: 9000 });
    expect(socket()).toMatchObject({ status: "connected", reconnectAttempts: 0, connectedAt: 9000 });
  });

  it("should count messages, bytes and topics in both directions", () => {
    handle(SocketEvents.MESSAGE_RECEIVED, { topic: "chat", data: { a: 1 } });
    handle(SocketEvents.MESSAGE_RECEIVED, { topic: "chat", data: "hi" });
    handle(SocketEvents.MESSAGE_SENT, { topic: "join", data: { room: "x" } });
    handle(SocketEvents.MESSAGE_FAILED, { topic: "join", data: null, error: { message: "offline" } });
    handle(SocketEvents.ERROR, { error: { message: "boom" } });

    expect(socket()).toMatchObject({
      received: 2,
      sent: 1,
      failed: 1,
      errors: 1,
      // '{"a":1}' is 7 bytes, a text message is sent as is
      bytesReceived: 7 + 2,
      bytesSent: getMessageSize({ room: "x" }),
      topics: { chat: { received: 2, sent: 0 }, join: { received: 0, sent: 1 } },
    });
    expect(app().messages.map((message) => message.kind)).toStrictEqual([
      "error",
      "failed",
      "sent",
      "received",
      "received",
    ]);
  });

  it("should learn about sockets from any event", () => {
    handle(SocketEvents.MESSAGE_RECEIVED, { socketId: "ws://late", url: "ws://late", topic: "x", data: 1 });

    expect(app().sockets["ws://late"]).toMatchObject({ url: "ws://late", received: 1 });
  });

  it("should not log registrations, they only describe the socket", () => {
    handle(SocketEvents.REGISTERED, { status: "connected" });
    handle(SocketEvents.REGISTERED, { status: "connected" });

    expect(app().messages).toHaveLength(0);
    expect(socket().status).toBe("connected");
  });

  it("should keep only the newest messages", () => {
    for (let index = 0; index < MAX_SOCKET_MESSAGES + 5; index++) {
      handle(SocketEvents.MESSAGE_RECEIVED, { topic: "tick", data: index });
    }

    expect(app().messages).toHaveLength(MAX_SOCKET_MESSAGES);
    expect(app().messages[0].data).toBe(MAX_SOCKET_MESSAGES + 4);
    expect(socket().received).toBe(MAX_SOCKET_MESSAGES + 5);
  });

  it("should keep other sockets by reference when one changes", () => {
    handle(SocketEvents.REGISTERED, { socketId: "ws://other", url: "ws://other", status: "connected" });
    handle(SocketEvents.REGISTERED, { status: "connected" });
    const other = app().sockets["ws://other"];

    handle(SocketEvents.MESSAGE_RECEIVED, { topic: "chat", data: 1 });

    expect(app().sockets["ws://other"]).toBe(other);
  });

  it("should ignore events without a socket", () => {
    const before = useSocketsStore.getState();
    useSocketsStore.getState().handleEvent("App", SocketEvents.CONNECTED, {} as DevtoolsSocketEventData);
    expect(useSocketsStore.getState()).toBe(before);
  });
});
