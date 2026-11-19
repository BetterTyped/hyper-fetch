import { Socket } from "@hyper-fetch/sockets";
import { act, render, renderHook, screen } from "@testing-library/react";
import { useListener } from "hooks/use-listener";
import React, { StrictMode, useState } from "react";

import type { ControlledWebSocket } from "../../../../sockets/__tests__/utils/controlled-websocket";
import {
  ControlledWebSocket as Transport,
  flushPromises,
  installControlledWebSocket,
  openWebSocket,
  uninstallControlledWebSocket,
} from "../../../../sockets/__tests__/utils/controlled-websocket";

type Message = { text: string };

describe("useListener [ Lifecycle ]", () => {
  let socket: Socket;
  let websocket: ControlledWebSocket;
  let listener: ReturnType<typeof createListener>;
  const sockets: Socket[] = [];

  const createSocket = (url = "ws://use-listener") => {
    const instance = new Socket({ url, reconnectTime: 100 });
    sockets.push(instance);
    return instance;
  };

  const createListener = (instance: Socket = socket) => {
    return instance.createListener<Message>()({ topic: "chat/:roomId" });
  };

  /** Number of callbacks the adapter holds for a topic - one per live subscription */
  const subscriptions = (topic: string, instance: Socket = socket) => {
    return instance.adapter.listeners.get(topic)?.size ?? 0;
  };

  const emit = (topic: string, message: Message, transport: ControlledWebSocket = websocket) => {
    act(() => {
      transport.serverEmit(topic, message);
    });
  };

  beforeEach(async () => {
    installControlledWebSocket();
    socket = createSocket();
    websocket = await openWebSocket();
    listener = createListener();
  });

  afterEach(async () => {
    await Promise.all(sockets.map((instance) => instance.disconnect()));
    sockets.length = 0;
    uninstallControlledWebSocket();
  });

  describe("When the component mounts and unmounts", () => {
    it("should subscribe once on mount", () => {
      const listen = vi.spyOn(socket.adapter, "listen");

      renderHook(() => useListener(listener.setParams({ roomId: 1 })));

      expect(listen).toHaveBeenCalledTimes(1);
      expect(subscriptions("chat/1")).toBe(1);
    });

    it("should unsubscribe on unmount", () => {
      const removed = vi.fn();
      socket.events.onListenerRemove(removed);
      const view = renderHook(() => useListener(listener.setParams({ roomId: 1 })));

      view.unmount();

      expect(subscriptions("chat/1")).toBe(0);
      expect(removed).toHaveBeenCalledTimes(1);
    });

    it("should leave no socket event subscriptions after unmount", () => {
      const before = socket.emitter.eventNames().length;
      const view = renderHook(() => useListener(listener.setParams({ roomId: 1 })));

      view.unmount();

      expect(socket.emitter.eventNames()).toHaveLength(before);
    });

    it("should not subscribe again when the component re-renders", () => {
      const listen = vi.spyOn(socket.adapter, "listen");
      const view = renderHook(() => useListener(listener.setParams({ roomId: 1 })));

      view.rerender();
      view.rerender();
      view.rerender();

      expect(listen).toHaveBeenCalledTimes(1);
      expect(subscriptions("chat/1")).toBe(1);
    });

    it("should not update the state after unmount", () => {
      const renders = vi.fn();
      const view = renderHook(() => {
        renders();
        return useListener(listener.setParams({ roomId: 1 })).data;
      });
      view.unmount();
      renders.mockClear();
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => null);

      emit("chat/1", { text: "late" });

      expect(renders).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("should not receive the messages sent before the mount", () => {
      emit("chat/1", { text: "early" });

      const view = renderHook(() => useListener(listener.setParams({ roomId: 1 })));

      expect(view.result.current.data).toBeNull();
      expect(view.result.current.timestamp).toBeNull();
    });
  });

  describe("When messages arrive", () => {
    it("should expose the latest message as data with extra and timestamp", () => {
      const view = renderHook(() => useListener(listener.setParams({ roomId: 1 }), { dependencyTracking: false }));

      emit("chat/1", { text: "first" });
      emit("chat/1", { text: "second" });

      expect(view.result.current.data).toStrictEqual({ text: "second" });
      expect(view.result.current.extra).toBeInstanceOf(MessageEvent);
      expect(view.result.current.timestamp).toBeNumber();
    });

    it("should call onEvent for every message", () => {
      const spy = vi.fn();
      renderHook(() => {
        const { onEvent } = useListener(listener.setParams({ roomId: 1 }));
        onEvent(({ data }) => spy(data));
      });

      emit("chat/1", { text: "first" });
      emit("chat/1", { text: "second" });

      expect(spy.mock.calls).toStrictEqual([[{ text: "first" }], [{ text: "second" }]]);
    });

    it("should call the latest onEvent callback without subscribing again", () => {
      const listen = vi.spyOn(socket.adapter, "listen");
      const calls: string[] = [];
      const view = renderHook(
        ({ label }: { label: string }) => {
          const { onEvent } = useListener(listener.setParams({ roomId: 1 }));
          onEvent(({ data }) => calls.push(`${label}:${data.text}`));
        },
        { initialProps: { label: "first-render" } },
      );

      emit("chat/1", { text: "a" });
      view.rerender({ label: "second-render" });
      emit("chat/1", { text: "b" });

      expect(calls).toStrictEqual(["first-render:a", "second-render:b"]);
      expect(listen).toHaveBeenCalledTimes(1);
    });

    it("should ignore the messages of other topics", () => {
      const view = renderHook(() => useListener(listener.setParams({ roomId: 1 }), { dependencyTracking: false }));

      emit("chat/2", { text: "other room" });

      expect(view.result.current.data).toBeNull();
    });

    it("should re-render only for the values the component reads", () => {
      const renders = vi.fn();
      renderHook(() => {
        renders();
        return useListener(listener.setParams({ roomId: 1 })).connected;
      });
      renders.mockClear();

      emit("chat/1", { text: "first" });
      emit("chat/1", { text: "second" });

      expect(renders).not.toHaveBeenCalled();
    });
  });

  describe("When the listener changes", () => {
    it("should move the subscription to the new topic exactly once", () => {
      const listen = vi.spyOn(socket.adapter, "listen");
      const view = renderHook(
        ({ roomId }: { roomId: number }) => useListener(listener.setParams({ roomId }), { dependencyTracking: false }),
        { initialProps: { roomId: 1 } },
      );

      view.rerender({ roomId: 2 });

      expect(listen).toHaveBeenCalledTimes(2);
      expect(subscriptions("chat/1")).toBe(0);
      expect(subscriptions("chat/2")).toBe(1);
    });

    it("should receive only the messages of the new topic", () => {
      const view = renderHook(
        ({ roomId }: { roomId: number }) => useListener(listener.setParams({ roomId }), { dependencyTracking: false }),
        { initialProps: { roomId: 1 } },
      );
      view.rerender({ roomId: 2 });

      emit("chat/1", { text: "old room" });
      expect(view.result.current.data).toBeNull();

      emit("chat/2", { text: "new room" });
      expect(view.result.current.data).toStrictEqual({ text: "new room" });
    });

    it("should keep the subscription when an equal listener is created on every render", () => {
      const listen = vi.spyOn(socket.adapter, "listen");
      const view = renderHook(() => useListener(createListener().setParams({ roomId: 1 })));

      view.rerender();
      view.rerender();

      expect(listen).toHaveBeenCalledTimes(1);
      expect(subscriptions("chat/1")).toBe(1);
    });

    it("should follow a listener of another socket with the same topic", async () => {
      const otherSocket = createSocket("ws://other-socket");
      const otherWebsocket = await openWebSocket(2);
      const otherListener = createListener(otherSocket);
      const view = renderHook(
        ({ current }: { current: typeof listener }) =>
          useListener(current.setParams({ roomId: 1 }), { dependencyTracking: false }),
        { initialProps: { current: listener } },
      );

      view.rerender({ current: otherListener });

      expect(subscriptions("chat/1", socket)).toBe(0);
      expect(subscriptions("chat/1", otherSocket)).toBe(1);

      emit("chat/1", { text: "old socket" });
      expect(view.result.current.data).toBeNull();

      emit("chat/1", { text: "new socket" }, otherWebsocket);
      expect(view.result.current.data).toStrictEqual({ text: "new socket" });
    });

    it("should subscribe again when listen is called manually", () => {
      const view = renderHook(() => useListener(listener.setParams({ roomId: 1 }), { dependencyTracking: false }));

      act(() => {
        view.result.current.listen();
        view.result.current.listen();
      });
      emit("chat/1", { text: "hello" });

      expect(subscriptions("chat/1")).toBe(1);
      expect(view.result.current.data).toStrictEqual({ text: "hello" });
    });
  });

  describe("When rendered in StrictMode", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <StrictMode>{children}</StrictMode>;

    it("should hold a single subscription", () => {
      renderHook(() => useListener(listener.setParams({ roomId: 1 })), { wrapper });

      expect(subscriptions("chat/1")).toBe(1);
    });

    it("should call onEvent once per message", () => {
      const spy = vi.fn();
      renderHook(
        () => {
          const { onEvent } = useListener(listener.setParams({ roomId: 1 }));
          onEvent(({ data }) => spy(data));
        },
        { wrapper },
      );

      emit("chat/1", { text: "once" });

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should report the connection state of the socket", () => {
      const view = renderHook(() => useListener(listener.setParams({ roomId: 1 }), { dependencyTracking: false }), {
        wrapper,
      });

      expect(view.result.current.connected).toBeTrue();

      act(() => {
        websocket.serverClose({ code: 1000, wasClean: true });
      });

      expect(view.result.current.connected).toBeFalse();
    });

    it("should leave no subscription after unmount", () => {
      const before = socket.emitter.eventNames().length;
      const view = renderHook(() => useListener(listener.setParams({ roomId: 1 })), { wrapper });

      view.unmount();

      expect(subscriptions("chat/1")).toBe(0);
      expect(socket.emitter.eventNames()).toHaveLength(before);
    });
  });

  describe("When many components share a socket", () => {
    const Room = ({ roomId }: { roomId: number }) => {
      const { data } = useListener(listener.setParams({ roomId }));
      return <span data-testid={`room-${roomId}`}>{data?.text ?? "empty"}</span>;
    };

    const SameRoom = ({ id }: { id: string }) => {
      const { data } = useListener(listener.setParams({ roomId: 1 }));
      return <span data-testid={id}>{data?.text ?? "empty"}</span>;
    };

    it("should deliver a message to every component listening to the topic", () => {
      render(
        <>
          <SameRoom id="first" />
          <SameRoom id="second" />
        </>,
      );

      emit("chat/1", { text: "hello" });

      expect(screen.getByTestId("first")).toHaveTextContent("hello");
      expect(screen.getByTestId("second")).toHaveTextContent("hello");
      expect(subscriptions("chat/1")).toBe(2);
    });

    it("should route the messages by topic between components", () => {
      render(
        <>
          <Room roomId={1} />
          <Room roomId={2} />
        </>,
      );

      emit("chat/2", { text: "second room" });

      expect(screen.getByTestId("room-1")).toHaveTextContent("empty");
      expect(screen.getByTestId("room-2")).toHaveTextContent("second room");
    });

    it("should keep the other components subscribed when one unmounts", () => {
      const App = () => {
        const [visible, setVisible] = useState(true);
        return (
          <>
            {visible && <SameRoom id="first" />}
            <SameRoom id="second" />
            <button type="button" onClick={() => setVisible(false)}>
              hide
            </button>
          </>
        );
      };
      render(<App />);

      act(() => {
        screen.getByText("hide").click();
      });
      emit("chat/1", { text: "still here" });

      expect(screen.queryByTestId("first")).toBeNull();
      expect(screen.getByTestId("second")).toHaveTextContent("still here");
      expect(subscriptions("chat/1")).toBe(1);
    });
  });

  describe("When the connection state changes", () => {
    it("should start with the current state of the socket", async () => {
      const idle = new Socket({ url: "ws://idle", adapterOptions: { autoConnect: false } });
      const idleListener = idle.createListener<Message>()({ topic: "chat" });

      const connected = renderHook(() => useListener(listener.setParams({ roomId: 1 }), { dependencyTracking: false }));
      const disconnected = renderHook(() => useListener(idleListener, { dependencyTracking: false }));

      expect(connected.result.current.connected).toBeTrue();
      expect(connected.result.current.connecting).toBeFalse();
      expect(disconnected.result.current.connected).toBeFalse();
      expect(disconnected.result.current.connecting).toBeFalse();
    });

    it("should follow connecting, connected and disconnected", async () => {
      const lazy = createSocket("ws://lazy");
      await flushPromises();
      const lazyListener = lazy.createListener<Message>()({ topic: "chat" });
      const view = renderHook(() => useListener(lazyListener, { dependencyTracking: false }));

      expect(view.result.current.connecting).toBeTrue();
      expect(view.result.current.connected).toBeFalse();

      act(() => {
        Transport.last.serverOpen();
      });
      expect(view.result.current.connecting).toBeFalse();
      expect(view.result.current.connected).toBeTrue();

      await act(async () => {
        await lazy.disconnect();
      });
      expect(view.result.current.connected).toBeFalse();
    });

    it("should become connected again after a reconnect", async () => {
      const view = renderHook(() => useListener(listener.setParams({ roomId: 1 }), { dependencyTracking: false }));

      let reconnecting: Promise<void> = Promise.resolve();
      await act(async () => {
        reconnecting = socket.reconnect();
        await flushPromises();
      });
      expect(view.result.current.connected).toBeFalse();
      expect(view.result.current.connecting).toBeTrue();

      await act(async () => {
        Transport.last.serverOpen();
        await reconnecting;
      });
      expect(view.result.current.connected).toBeTrue();
      expect(view.result.current.connecting).toBeFalse();
      expect(subscriptions("chat/1")).toBe(1);
    });

    it("should keep receiving messages after a reconnect", async () => {
      const view = renderHook(() => useListener(listener.setParams({ roomId: 1 }), { dependencyTracking: false }));

      await act(async () => {
        const reconnecting = socket.reconnect();
        const next = await openWebSocket(2);
        await reconnecting;
        next.serverEmit("chat/1", { text: "after reconnect" });
      });

      expect(view.result.current.data).toStrictEqual({ text: "after reconnect" });
    });

    it("should call the latest connection callbacks", async () => {
      const calls: string[] = [];
      renderHook(() => {
        const { onConnected, onDisconnected, onConnecting, onReconnecting, onReconnectingFailed, onError } =
          useListener(listener.setParams({ roomId: 1 }));
        onConnected(() => calls.push("connected"));
        onDisconnected(() => calls.push("disconnected"));
        onConnecting(() => calls.push("connecting"));
        onReconnecting(({ attempts }) => calls.push(`reconnecting:${attempts}`));
        onReconnectingFailed(({ attempts }) => calls.push(`failed:${attempts}`));
        onError(() => calls.push("error"));
      });

      await act(async () => {
        const reconnecting = socket.reconnect();
        await openWebSocket(2);
        await reconnecting;
      });
      act(() => {
        socket.events.emitReconnectingFailed({ attempts: 3 });
        socket.events.emitError({ error: new Error("Lost") });
      });

      expect(calls).toStrictEqual([
        "reconnecting:0",
        "connecting",
        "disconnected",
        "connecting",
        "connecting",
        "connected",
        "failed:3",
        "error",
      ]);
    });

    it("should catch up when the socket connected between the render and the effect", async () => {
      const lazy = createSocket("ws://lazy");
      const lazyWebsocket = await Promise.resolve()
        .then(() => flushPromises())
        .then(() => Transport.last);
      const lazyListener = lazy.createListener<Message>()({ topic: "chat" });
      const Component = () => {
        // The connection opens while the component renders, before its effects subscribe to the socket
        if (lazyWebsocket.readyState === Transport.CONNECTING) {
          lazyWebsocket.serverOpen();
        }
        const { connected } = useListener(lazyListener);
        return <span data-testid="state">{String(connected)}</span>;
      };

      render(<Component />);

      expect(screen.getByTestId("state")).toHaveTextContent("true");
    });
  });
});
