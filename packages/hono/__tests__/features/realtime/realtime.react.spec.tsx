/**
 * @vitest-environment jsdom
 */
import { useEmitter, useListener } from "@hyper-fetch/react";
import type { EmitterModel, ListenerModel, SocketSdkInstance } from "@hyper-fetch/sockets";
import { createSocketSdk, Socket } from "@hyper-fetch/sockets";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { StrictMode, useEffect } from "react";

import type { HonoSocketPath } from "../../../src";
import type { ChatMessage, RealtimeApp, RealtimeServer } from "../../utils/realtime-server";
import { createRealtimeServer } from "../../utils/realtime-server";

type ChatSchema = {
  chat: { $roomId: { $listener: ListenerModel<{ response: ChatMessage; topic: "chat/:roomId" }> } };
  echo: {
    $listener: ListenerModel<{ response: { text: string }; topic: "echo" }>;
    $emitter: EmitterModel<{ payload: { text: string }; topic: "echo" }>;
  };
  rooms: {
    join: { $emitter: EmitterModel<{ payload: { roomId: string }; topic: "rooms/join" }> };
    leave: { $emitter: EmitterModel<{ payload: { roomId: string }; topic: "rooms/leave" }> };
  };
};

type ChatSdk = SocketSdkInstance<ChatSchema, Socket>;

/**
 * Listens to a room of the multiplexed `/ws` route and keeps the server-side subscription in sync with it:
 * joins on mount and on every (re)connection, leaves on unmount and when the room changes.
 */
const useRoom = (sdk: ChatSdk, roomId: string, onEvent?: (message: ChatMessage) => void) => {
  const room = useListener(sdk.chat.$roomId.$listener.setParams({ roomId }));
  const { connected } = room;

  room.onEvent(({ data }) => onEvent?.(data));

  // The SDK emitters are stable, so they can be used in the effect directly
  useEffect(() => {
    if (!connected) {
      return;
    }
    sdk.rooms.join.$emitter.emit({ payload: { roomId } });
    return () => sdk.rooms.leave.$emitter.emit({ payload: { roomId } });
  }, [sdk, connected, roomId]);

  return room;
};

describe("Hono realtime [ React ]", () => {
  let server: RealtimeServer;
  let sockets: Socket[] = [];

  const createApi = (path: HonoSocketPath<RealtimeApp> = "/ws") => {
    const socket = new Socket({ url: `${server.wsUrl}${path}`, reconnectTime: 10 });
    sockets.push(socket);
    return { socket, sdk: createSocketSdk<typeof socket, ChatSchema>(socket) };
  };

  beforeEach(async () => {
    server = createRealtimeServer();
    await server.start();
  });

  afterEach(async () => {
    cleanup();
    await Promise.all(sockets.map((socket) => socket.disconnect()));
    sockets = [];
    await server.stop();
  });

  describe("when using useListener", () => {
    it("should subscribe on mount and receive the room messages", async () => {
      const { sdk } = createApi();

      const { result } = renderHook(() => useRoom(sdk, "1"));

      await waitFor(() => {
        expect(server.state.rooms.get("1")?.size).toBe(1);
      });
      expect(result.current.connected).toBe(true);
      server.broadcast("1", "hello");

      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ roomId: "1", text: "hello" });
      });
      expect(typeof result.current.timestamp).toBe("number");
    });

    it("should move the server-side subscription when the topic params change", async () => {
      const { sdk } = createApi();
      const onEvent = vi.fn();

      const { result, rerender } = renderHook(({ roomId }) => useRoom(sdk, roomId, onEvent), {
        initialProps: { roomId: "1" },
      });
      await waitFor(() => {
        expect(server.state.rooms.get("1")?.size).toBe(1);
      });

      rerender({ roomId: "2" });

      await waitFor(() => {
        expect(server.state.rooms.get("2")?.size).toBe(1);
        expect(server.state.rooms.has("1")).toBe(false);
      });
      server.broadcast("2", "in room 2");
      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ roomId: "2", text: "in room 2" });
      });
      expect(onEvent).toHaveBeenCalledTimes(1);
    });

    it("should hold exactly one subscription in StrictMode", async () => {
      const { socket, sdk } = createApi();
      const onEvent = vi.fn();
      // Connected before the mount, so StrictMode runs the joining effect twice
      await waitFor(() => {
        expect(socket.adapter.connected).toBe(true);
      });

      const { result } = renderHook(() => useRoom(sdk, "1", onEvent), { wrapper: StrictMode });
      await waitFor(() => {
        expect(server.state.rooms.get("1")?.size).toBe(1);
      });
      // Frames of one connection are handled in order - once the echo is back, the server saw every effect frame
      const onEcho = vi.fn();
      sdk.echo.$listener.listen(onEcho);
      sdk.echo.$emitter.emit({ payload: { text: "barrier" } });
      await waitFor(() => {
        expect(onEcho).toHaveBeenCalledTimes(1);
      });
      // StrictMode runs the effect twice - the cleanup in between left the room, so one join is left
      expect(server.state.joinBalance.get("1")).toBe(1);

      server.broadcast("1", "once");

      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ roomId: "1", text: "once" });
      });
      expect(onEvent).toHaveBeenCalledTimes(1);
      expect(socket.adapter.listeners.get("chat/1")?.size).toBe(1);
    });

    it("should stop the server-side subscription on unmount", async () => {
      const { socket, sdk } = createApi();

      const { unmount } = renderHook(() => useRoom(sdk, "1"));
      await waitFor(() => {
        expect(server.state.rooms.get("1")?.size).toBe(1);
      });

      unmount();

      await waitFor(() => {
        expect(server.state.rooms.has("1")).toBe(false);
      });
      expect(server.state.joinBalance.get("1")).toBe(0);
      expect(socket.adapter.listeners.get("chat/1")?.size ?? 0).toBe(0);
      // The connection is shared by the app, unmounting one listener keeps it open
      expect(server.state.connections.size).toBe(1);
    });

    it("should join again after the Hono server restarts", async () => {
      const { sdk } = createApi();

      const { result } = renderHook(() => useRoom(sdk, "1"));
      await waitFor(() => {
        expect(server.state.rooms.get("1")?.size).toBe(1);
      });

      await server.stop();
      await waitFor(() => {
        expect(result.current.connected).toBe(false);
      });
      await server.start();

      await waitFor(() => {
        expect(server.state.rooms.get("1")?.size).toBe(1);
      });
      server.broadcast("1", "back online");
      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ roomId: "1", text: "back online" });
      });
    });
  });

  describe("when using useEmitter", () => {
    it("should send messages the Hono handler answers", async () => {
      const { sdk } = createApi();

      const { result } = renderHook(() => ({
        echo: useListener(sdk.echo.$listener),
        emitter: useEmitter(sdk.echo.$emitter),
      }));
      await waitFor(() => {
        expect(result.current.emitter.connected).toBe(true);
      });

      result.current.emitter.emit({ payload: { text: "from react" } });

      await waitFor(() => {
        expect(result.current.echo.data).toStrictEqual({ text: "from react" });
      });
    });

    it("should report an emit while disconnected through onEmitError", async () => {
      const { socket, sdk } = createApi();
      await socket.disconnect();
      const onEmitError = vi.fn();

      const { result } = renderHook(() => {
        const emitter = useEmitter(sdk.echo.$emitter);
        emitter.onEmitError(onEmitError);
        return emitter;
      });

      result.current.emit({ payload: { text: "lost" } });

      await waitFor(() => {
        expect(onEmitError).toHaveBeenCalledTimes(1);
      });
      expect(onEmitError.mock.calls[0][0].error.message).toBe("Cannot emit event when connection is not open");
    });
  });
});
