import { Socket } from "@hyper-fetch/sockets";
import { createWebsocketMockingServer } from "@hyper-fetch/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useSocketState } from "helpers";
import { useEmitter } from "hooks/use-emitter";
import { useListener } from "hooks/use-listener";
import { StrictMode } from "react";

/**
 * StrictMode mounts, unmounts and mounts every effect again in development.
 * Hooks that subscribe only on the "first" mount lose their subscriptions for good,
 * which is exactly how `connected` got stuck on `false` (issue #140).
 */
describe("Sockets hooks [ StrictMode ]", () => {
  const { url, startServer, stopServer, emitListenerEvent } = createWebsocketMockingServer();
  const spy = vi.fn();

  const createSocket = () => new Socket({ url });
  const createListener = (socket = createSocket()) =>
    socket.createListener<{ name: string; age: number }>()({ topic: "some-event" });
  const createEmitter = (socket = createSocket()) =>
    socket.createEmitter<{ name: string; age: number }>()({ topic: "some-event" });

  const hooks = [
    {
      name: "useSocketState",
      render: (socket: Socket, dependencyTracking = false) =>
        renderHook(
          () => {
            const [state, , callbacks, { setRenderKey }] = useSocketState(socket, { dependencyTracking });
            // Hooks do it through the tracked proxy, here we read the state directly
            setRenderKey("connected");
            setRenderKey("connecting");
            return { connected: state.connected, connecting: state.connecting, ...callbacks };
          },
          { wrapper: StrictMode },
        ),
    },
    {
      name: "useListener",
      render: (socket: Socket, dependencyTracking = false) =>
        renderHook(() => useListener(createListener(socket), { dependencyTracking }), { wrapper: StrictMode }),
    },
    {
      name: "useEmitter",
      render: (socket: Socket, dependencyTracking = false) =>
        renderHook(() => useEmitter(createEmitter(socket), { dependencyTracking }), { wrapper: StrictMode }),
    },
  ] as const;

  beforeEach(() => {
    startServer();
    vi.resetAllMocks();
  });

  afterEach(() => {
    stopServer();
  });

  describe.each(hooks)("given $name is rendered in StrictMode", ({ render }) => {
    describe("when socket connects after the mount", () => {
      it("should set connected to true once the real connection opens", async () => {
        const socket = createSocket();
        const view = render(socket);

        expect(view.result.current.connected).toBeFalse();

        await waitFor(() => {
          expect(socket.adapter.connected).toBeTrue();
          expect(view.result.current.connected).toBeTrue();
        });
      });
      it("should set connected to true with dependency tracking", async () => {
        const socket = createSocket();
        const view = render(socket, true);

        expect(view.result.current.connected).toBeFalse();

        await waitFor(() => {
          expect(view.result.current.connected).toBeTrue();
        });
      });
    });
    describe("when connection state changes", () => {
      it("should follow connected, disconnected and connecting events", async () => {
        const socket = createSocket();
        const view = render(socket);
        await waitFor(() => {
          expect(view.result.current.connected).toBeTrue();
        });

        act(() => {
          socket.events.emitDisconnected();
        });
        expect(view.result.current.connected).toBeFalse();

        act(() => {
          socket.events.emitConnecting({ connecting: true });
        });
        expect(view.result.current.connecting).toBeTrue();

        act(() => {
          socket.events.emitConnecting({ connecting: false });
          socket.events.emitConnected();
        });
        expect(view.result.current.connecting).toBeFalse();
        expect(view.result.current.connected).toBeTrue();
      });
      it("should follow a real disconnect and reconnect", async () => {
        const socket = createSocket();
        const view = render(socket);
        await waitFor(() => {
          expect(view.result.current.connected).toBeTrue();
        });

        await act(async () => {
          await socket.disconnect();
        });
        await waitFor(() => {
          expect(view.result.current.connected).toBeFalse();
        });

        await act(async () => {
          await socket.connect();
        });
        await waitFor(() => {
          expect(view.result.current.connected).toBeTrue();
        });
      });
    });
    describe("when using connection callbacks", () => {
      it("should call each callback exactly once per event", async () => {
        const socket = createSocket();
        const view = render(socket);
        await waitFor(() => {
          expect(view.result.current.connected).toBeTrue();
        });
        const onConnected = vi.fn();
        const onDisconnected = vi.fn();
        const onConnecting = vi.fn();
        const onError = vi.fn();
        const onReconnecting = vi.fn();
        const onReconnectingFailed = vi.fn();

        act(() => {
          view.result.current.onConnected(onConnected);
          view.result.current.onDisconnected(onDisconnected);
          view.result.current.onConnecting(onConnecting);
          view.result.current.onError(onError);
          view.result.current.onReconnecting(onReconnecting);
          view.result.current.onReconnectingFailed(onReconnectingFailed);
        });
        act(() => {
          socket.events.emitDisconnected();
          socket.events.emitConnecting({ connecting: true });
          socket.events.emitConnected();
          socket.events.emitError({ error: new Error("Test error") });
          socket.events.emitReconnecting({ attempts: 1 });
          socket.events.emitReconnectingFailed({ attempts: 1 });
        });

        expect(onConnected).toHaveBeenCalledTimes(1);
        expect(onDisconnected).toHaveBeenCalledTimes(1);
        expect(onConnecting).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onReconnecting).toHaveBeenCalledTimes(1);
        expect(onReconnectingFailed).toHaveBeenCalledTimes(1);
      });
    });
    describe("when hook gets unmounted", () => {
      it("should stop reacting to socket events", async () => {
        const socket = createSocket();
        const view = render(socket);
        await waitFor(() => {
          expect(view.result.current.connected).toBeTrue();
        });
        act(() => {
          view.result.current.onConnected(spy);
          view.result.current.onDisconnected(spy);
        });

        view.unmount();
        act(() => {
          socket.events.emitDisconnected();
          socket.events.emitConnected();
        });

        expect(spy).not.toHaveBeenCalled();
      });
    });
  });

  describe("given socket is already connected before the mount", () => {
    it.each(hooks)("should render $name with connected set to true", async ({ render }) => {
      const socket = createSocket();
      await waitFor(() => {
        expect(socket.adapter.connected).toBeTrue();
      });

      const view = render(socket);

      expect(view.result.current.connected).toBeTrue();
      expect(view.result.current.connecting).toBeFalse();
    });
  });

  describe("given useListener is rendered in StrictMode", () => {
    it("should receive events together with the connected state", async () => {
      const listener = createListener();
      const view = renderHook(() => useListener(listener, { dependencyTracking: false }), { wrapper: StrictMode });
      act(() => {
        view.result.current.onEvent(spy);
      });
      await waitFor(() => {
        expect(view.result.current.connected).toBeTrue();
      });

      const message = { name: "Maciej", age: 99 };
      emitListenerEvent(listener, message);

      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual(message);
        expect(view.result.current.connected).toBeTrue();
      });
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should not receive events after unmount", async () => {
      const listener = createListener();
      const view = renderHook(() => useListener(listener, { dependencyTracking: false }), { wrapper: StrictMode });
      act(() => {
        view.result.current.onEvent(spy);
      });
      await waitFor(() => {
        expect(view.result.current.connected).toBeTrue();
      });

      view.unmount();
      emitListenerEvent(listener, { name: "Maciej", age: 99 });
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("given useEmitter is rendered in StrictMode", () => {
    it("should call onEmit exactly once per emitted event", async () => {
      const emitter = createEmitter();
      const view = renderHook(() => useEmitter(emitter, { dependencyTracking: false }), { wrapper: StrictMode });
      await waitFor(() => {
        expect(view.result.current.connected).toBeTrue();
      });
      act(() => {
        view.result.current.onEmit(spy);
      });

      act(() => {
        view.result.current.emit({ payload: { name: "Maciej", age: 99 } } as never);
      });

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
