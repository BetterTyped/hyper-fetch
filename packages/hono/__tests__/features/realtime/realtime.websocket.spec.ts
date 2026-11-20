import type { EmitterModel, ListenerModel, SocketInstance, WebsocketAdapterOptionsType } from "@hyper-fetch/sockets";
import { createSocketSdk, Socket } from "@hyper-fetch/sockets";

import type { HonoWebSocketPath } from "../../../src";
import type { ChatMessage, Notification, Price, RealtimeApp, RealtimeServer } from "../../utils/realtime-server";
import { createRealtimeServer } from "../../utils/realtime-server";

describe("Hono realtime [ WebSocket ]", () => {
  let server: RealtimeServer;
  let sockets: SocketInstance[] = [];

  const createSocket = (
    path: HonoWebSocketPath<RealtimeApp>,
    options?: { queryParams?: Record<string, string>; adapterOptions?: WebsocketAdapterOptionsType },
  ) => {
    // A short reconnect delay keeps the reconnect tests fast, `connectionTimeout` keeps slow handshakes alive
    const socket = new Socket({
      url: `${server.wsUrl}${path}`,
      reconnectTime: 10,
      connectionTimeout: 5000,
      ...options,
    });
    sockets.push(socket);
    return socket;
  };

  const waitForConnected = (socket: SocketInstance) =>
    vi.waitFor(() => {
      expect(socket.adapter.connected).toBe(true);
    });

  /** Joins a room of the multiplexed /ws route and waits until the Hono handler registered the member */
  const joinRoom = async (socket: Socket, roomId: string) => {
    socket.createEmitter<{ roomId: string }>()({ topic: "rooms/join" }).emit({ payload: { roomId } });
    await vi.waitFor(() => {
      expect(server.state.rooms.get(roomId)?.size).toBe(1);
    });
  };

  beforeEach(async () => {
    server = createRealtimeServer();
    await server.start();
  });

  afterEach(async () => {
    await Promise.all(sockets.map((socket) => socket.disconnect()));
    sockets = [];
    await server.stop();
  });

  describe("when listening by topic", () => {
    it("should deliver the frames of the listened topic only", async () => {
      const socket = createSocket("/ws");
      const onEcho = vi.fn();
      const onOther = vi.fn();
      socket.createListener<{ text: string }>()({ topic: "echo" }).listen(onEcho);
      socket.createListener<{ text: string }>()({ topic: "other" }).listen(onOther);
      await waitForConnected(socket);

      socket
        .createEmitter<{ text: string }>()({ topic: "echo" })
        .emit({ payload: { text: "hello" } });

      await vi.waitFor(() => {
        expect(onEcho).toHaveBeenCalledTimes(1);
      });
      expect(onEcho.mock.calls[0][0].data).toStrictEqual({ text: "hello" });
      expect(onOther).not.toHaveBeenCalled();
    });

    it("should match the topic params of the listener", async () => {
      const socket = createSocket("/ws");
      const onRoom = vi.fn();
      socket.createListener<ChatMessage>()({ topic: "chat/:roomId" }).setParams({ roomId: "1" }).listen(onRoom);
      await waitForConnected(socket);
      await joinRoom(socket, "1");
      await joinRoom(socket, "2");

      // Frames arrive in order, so the room 2 frame was already ignored when the room 1 frame arrives
      server.broadcast("2", "not for this listener");
      server.broadcast("1", "hi");

      await vi.waitFor(() => {
        expect(onRoom).toHaveBeenCalledTimes(1);
      });
      expect(onRoom.mock.calls[0][0].data).toStrictEqual({ roomId: "1", text: "hi" });
    });

    it("should stop delivering after the listener is removed", async () => {
      const socket = createSocket("/ws");
      const onEcho = vi.fn();
      const onControl = vi.fn();
      const removeListener = socket.createListener<{ text: string }>()({ topic: "echo" }).listen(onEcho);
      socket.createListener<{ roomId: string }>()({ topic: "rooms/joined" }).listen(onControl);
      await waitForConnected(socket);

      removeListener();
      socket
        .createEmitter<{ text: string }>()({ topic: "echo" })
        .emit({ payload: { text: "hello" } });
      await joinRoom(socket, "1");
      await vi.waitFor(() => {
        expect(onControl).toHaveBeenCalledTimes(1);
      });

      expect(onEcho).not.toHaveBeenCalled();
    });
  });

  describe("when emitting", () => {
    it("should send a { topic, data } frame the Hono handler reads, with the topic params filled in", async () => {
      const socket = createSocket("/ws");
      const onRoom = vi.fn();
      socket.createListener<ChatMessage>()({ topic: "chat/:roomId" }).setParams({ roomId: "7" }).listen(onRoom);
      await waitForConnected(socket);
      await joinRoom(socket, "7");

      socket
        .createEmitter<{ text: string }>()({ topic: "chat/:roomId" })
        .emit({ params: { roomId: "7" }, payload: { text: "from the client" } });

      await vi.waitFor(() => {
        expect(onRoom).toHaveBeenCalledTimes(1);
      });
      expect(onRoom.mock.calls[0][0].data).toStrictEqual({ roomId: "7", text: "from the client" });
    });

    it("should report an emit before the connection opens through the emitter error event", async () => {
      const socket = createSocket("/ws", { adapterOptions: { autoConnect: false } });
      const onEmitError = vi.fn();
      socket.events.onEmitterError(onEmitError);

      socket
        .createEmitter<{ text: string }>()({ topic: "echo" })
        .emit({ payload: { text: "too early" } });

      await vi.waitFor(() => {
        expect(onEmitError).toHaveBeenCalledTimes(1);
      });
      expect(onEmitError.mock.calls[0][0].error.message).toBe("Cannot emit event when connection is not open");
      expect(server.state.connections.size).toBe(0);
    });
  });

  describe("when the subscription needs input", () => {
    it("should start and stop a server-side subscription with messages", async () => {
      const socket = createSocket("/ws");
      const onRoom = vi.fn();
      const removeListener = socket
        .createListener<ChatMessage>()({ topic: "chat/:roomId" })
        .setParams({ roomId: "1" })
        .listen(onRoom);
      await waitForConnected(socket);

      await joinRoom(socket, "1");
      server.broadcast("1", "first");
      await vi.waitFor(() => {
        expect(onRoom).toHaveBeenCalledTimes(1);
      });

      removeListener();
      socket
        .createEmitter<{ roomId: string }>()({ topic: "rooms/leave" })
        .emit({ payload: { roomId: "1" } });

      await vi.waitFor(() => {
        expect(server.state.rooms.has("1")).toBe(false);
      });
      expect(server.state.connections.size).toBe(1);
    });

    it("should pass the subscription input in the query params of the handshake", async () => {
      const socket = createSocket("/notifications", { queryParams: { userId: "1" } });
      const onNotification = vi.fn();
      socket.createListener<Notification>()({ topic: "notification" }).listen(onNotification);
      await vi.waitFor(() => {
        expect(server.state.notificationConnections.get("1")?.size).toBe(1);
      });

      server.notify({ userId: "1", title: "Welcome" });
      await vi.waitFor(() => {
        expect(onNotification).toHaveBeenCalledTimes(1);
      });
      expect(onNotification.mock.calls[0][0].data).toStrictEqual({ userId: "1", title: "Welcome" });

      // New input, new handshake - the listener stays registered across the reconnect
      socket.setQueryParams({ userId: "2" });
      await socket.reconnect();
      await vi.waitFor(() => {
        expect(server.state.notificationConnections.get("2")?.size).toBe(1);
      });
      expect(server.state.notificationConnections.has("1")).toBe(false);

      server.notify({ userId: "2", title: "Hello again" });
      await vi.waitFor(() => {
        expect(onNotification).toHaveBeenCalledTimes(2);
      });
      expect(onNotification.mock.calls[1][0].data).toStrictEqual({ userId: "2", title: "Hello again" });
    });

    it("should open one connection per room on a route with path params", async () => {
      const roomPath = (roomId: string): HonoWebSocketPath<RealtimeApp> => `/chat/${roomId}`;
      const socket = createSocket(roomPath("1"));
      const onMessage = vi.fn();
      socket.createListener<ChatMessage>()({ topic: "message" }).listen(onMessage);
      await waitForConnected(socket);

      socket
        .createEmitter<{ text: string }>()({ topic: "message" })
        .emit({ payload: { text: "in room 1" } });
      await vi.waitFor(() => {
        expect(onMessage).toHaveBeenCalledTimes(1);
      });
      expect(onMessage.mock.calls[0][0].data).toStrictEqual({ roomId: "1", text: "in room 1" });

      // Switching rooms switches the connection
      socket.setUrl(`${server.wsUrl}${roomPath("2")}`);
      await socket.reconnect();
      await vi.waitFor(() => {
        expect(server.state.roomConnections.get("2")?.size).toBe(1);
      });
      expect(server.state.roomConnections.has("1")).toBe(false);
      // Hono runs onOpen before the client gets the open event
      await waitForConnected(socket);

      socket
        .createEmitter<{ text: string }>()({ topic: "message" })
        .emit({ payload: { text: "in room 2" } });
      await vi.waitFor(() => {
        expect(onMessage).toHaveBeenCalledTimes(2);
      });
      expect(onMessage.mock.calls[1][0].data).toStrictEqual({ roomId: "2", text: "in room 2" });
    });
  });

  describe("when the app has its own message format", () => {
    const legacyCodec: WebsocketAdapterOptionsType = {
      decode: (event) => {
        if (typeof event.data !== "string" || !event.data.startsWith("{")) {
          return null;
        }
        const { type, payload } = JSON.parse(event.data);
        return { topic: type, data: payload };
      },
      encode: ({ topic, payload }) => JSON.stringify({ type: topic, payload }),
    };

    it("should read and write { type, payload } frames with a custom codec", async () => {
      const socket = createSocket("/legacy", { adapterOptions: legacyCodec });
      const onPrice = vi.fn();
      const onError = vi.fn();
      socket.onError(onError);
      socket.createListener<Price>()({ topic: "price" }).listen(onPrice);
      await waitForConnected(socket);

      socket
        .createEmitter<{ symbol: string }>()({ topic: "subscribe" })
        .emit({ payload: { symbol: "BTC" } });

      await vi.waitFor(() => {
        expect(onPrice).toHaveBeenCalledTimes(1);
      });
      expect(onPrice.mock.calls[0][0].data).toStrictEqual({ symbol: "BTC", price: 100 });
      expect(server.state.legacyFrames).toStrictEqual([{ type: "subscribe", payload: { symbol: "BTC" } }]);
      // The plain-text "ping" sent before the price is skipped by the decoder, not reported as an error
      expect(onError).not.toHaveBeenCalled();
    });

    it("should report a decoder failure and keep the connection", async () => {
      const socket = createSocket("/legacy", {
        adapterOptions: {
          ...legacyCodec,
          decode: (event) => {
            if (event.data === "ping") {
              throw new Error("Unexpected frame");
            }
            return legacyCodec.decode?.(event) ?? null;
          },
        },
      });
      const onPrice = vi.fn();
      const onError = vi.fn();
      socket.onError(onError);
      socket.createListener<Price>()({ topic: "price" }).listen(onPrice);
      await waitForConnected(socket);

      socket
        .createEmitter<{ symbol: string }>()({ topic: "subscribe" })
        .emit({ payload: { symbol: "BTC" } });

      await vi.waitFor(() => {
        expect(onPrice).toHaveBeenCalledTimes(1);
      });
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0].error.message).toBe("Unexpected frame");
      expect(socket.adapter.connected).toBe(true);
    });
  });

  describe("when the connection drops", () => {
    it.each([
      { name: "with an error code", code: 1011 },
      { name: "without a code", code: undefined },
    ])("should reconnect when the Hono handler closes the socket $name", async ({ code }) => {
      const socket = createSocket("/ws");
      const onEcho = vi.fn();
      const onReconnect = vi.fn();
      socket.onReconnect(onReconnect);
      socket.createListener<{ text: string }>()({ topic: "echo" }).listen(onEcho);
      await waitForConnected(socket);
      const [firstConnection] = server.state.connections;

      server.closeConnections(code);

      await vi.waitFor(() => {
        expect(onReconnect).toHaveBeenCalledTimes(1);
        expect(server.state.connections.size).toBe(1);
        expect(server.state.connections.has(firstConnection)).toBe(false);
      });
      await waitForConnected(socket);

      socket
        .createEmitter<{ text: string }>()({ topic: "echo" })
        .emit({ payload: { text: "after reconnect" } });
      await vi.waitFor(() => {
        expect(onEcho).toHaveBeenCalledTimes(1);
      });
      expect(onEcho.mock.calls[0][0].data).toStrictEqual({ text: "after reconnect" });
    });

    it("should not reconnect when the Hono handler closes the socket normally", async () => {
      const socket = createSocket("/ws");
      const onDisconnected = vi.fn();
      const onReconnect = vi.fn();
      socket.onDisconnected(onDisconnected);
      socket.onReconnect(onReconnect);
      await waitForConnected(socket);

      server.closeConnections(1000);

      await vi.waitFor(() => {
        expect(onDisconnected).toHaveBeenCalledTimes(1);
      });
      expect(socket.adapter.connected).toBe(false);
      expect(onReconnect).not.toHaveBeenCalled();
    });

    it("should reconnect and resubscribe after the Hono server restarts", async () => {
      const socket = createSocket("/ws");
      const join = socket.createEmitter<{ roomId: string }>()({ topic: "rooms/join" });
      const onRoom = vi.fn();
      // The server forgets subscriptions with the connection - join again on every (re)connection
      socket.onConnected(() => join.emit({ payload: { roomId: "1" } }));
      socket.createListener<ChatMessage>()({ topic: "chat/:roomId" }).setParams({ roomId: "1" }).listen(onRoom);
      await vi.waitFor(() => {
        expect(server.state.rooms.get("1")?.size).toBe(1);
      });

      await server.stop();
      await vi.waitFor(() => {
        expect(server.state.rooms.has("1")).toBe(false);
      });
      await server.start();

      await vi.waitFor(() => {
        expect(server.state.rooms.get("1")?.size).toBe(1);
      });
      server.broadcast("1", "back online");
      await vi.waitFor(() => {
        expect(onRoom).toHaveBeenCalledTimes(1);
      });
      expect(onRoom.mock.calls[0][0].data).toStrictEqual({ roomId: "1", text: "back online" });
    });
  });

  describe("when using createSocketSdk", () => {
    type ChatSchema = {
      chat: {
        $roomId: {
          $listener: ListenerModel<{ response: ChatMessage; topic: "chat/:roomId" }>;
          $emitter: EmitterModel<{ payload: { text: string }; topic: "chat/:roomId" }>;
        };
      };
      rooms: {
        join: { $emitter: EmitterModel<{ payload: { roomId: string }; topic: "rooms/join" }> };
        leave: { $emitter: EmitterModel<{ payload: { roomId: string }; topic: "rooms/leave" }> };
      };
    };

    it("should listen and emit through the typed SDK", async () => {
      const socket = createSocket("/ws");
      const sdk = createSocketSdk<typeof socket, ChatSchema>(socket);
      const onRoom = vi.fn();
      sdk.chat.$roomId.$listener.setParams({ roomId: "3" }).listen(onRoom);
      await waitForConnected(socket);

      sdk.rooms.join.$emitter.emit({ payload: { roomId: "3" } });
      await vi.waitFor(() => {
        expect(server.state.rooms.get("3")?.size).toBe(1);
      });
      sdk.chat.$roomId.$emitter.emit({ params: { roomId: "3" }, payload: { text: "typed" } });

      await vi.waitFor(() => {
        expect(onRoom).toHaveBeenCalledTimes(1);
      });
      expect(onRoom.mock.calls[0][0].data).toStrictEqual({ roomId: "3", text: "typed" });

      sdk.rooms.leave.$emitter.emit({ payload: { roomId: "3" } });
      await vi.waitFor(() => {
        expect(server.state.rooms.has("3")).toBe(false);
      });
    });
  });
});
