import { Socket } from "@hyper-fetch/sockets";
import { act, render, renderHook, screen } from "@testing-library/react";
import { useEmitter } from "hooks/use-emitter";
import React, { StrictMode, useEffect } from "react";
import { expectTypeOf } from "vitest";

import type { ControlledWebSocket } from "../../../../sockets/__tests__/utils/controlled-websocket";
import {
  ControlledWebSocket as Transport,
  flushPromises,
  installControlledWebSocket,
  openWebSocket,
  uninstallControlledWebSocket,
} from "../../../../sockets/__tests__/utils/controlled-websocket";

type Message = { text: string };

describe("useEmitter [ Lifecycle ]", () => {
  let socket: Socket;
  let websocket: ControlledWebSocket;
  let emitter: ReturnType<typeof createEmitter>;
  const sockets: Socket[] = [];

  const createSocket = (url = "ws://use-emitter", autoConnect = true) => {
    const instance = new Socket({ url, reconnectTime: 100, adapterOptions: { autoConnect } });
    sockets.push(instance);
    return instance;
  };

  const createEmitter = (instance: Socket = socket) => {
    return instance.createEmitter<Message>()({ topic: "chat/:roomId" });
  };

  beforeEach(async () => {
    installControlledWebSocket();
    socket = createSocket();
    websocket = await openWebSocket();
    emitter = createEmitter();
  });

  afterEach(async () => {
    await Promise.all(sockets.map((instance) => instance.disconnect()));
    sockets.length = 0;
    uninstallControlledWebSocket();
  });

  describe("When emitting", () => {
    it("should send the message with the payload and params passed to emit", async () => {
      const view = renderHook(() => useEmitter(emitter));

      await act(async () => {
        view.result.current.emit({ payload: { text: "hi" }, params: { roomId: 1 } });
        await flushPromises();
      });

      expect(websocket.sentMessages).toStrictEqual([{ topic: "chat/1", data: { text: "hi" } }]);
    });

    it("should send the payload prepared on the emitter", async () => {
      const view = renderHook(() => useEmitter(emitter.setParams({ roomId: 1 }).setPayload({ text: "prepared" })));

      await act(async () => {
        view.result.current.emit();
        await flushPromises();
      });

      expect(websocket.sentMessages).toStrictEqual([{ topic: "chat/1", data: { text: "prepared" } }]);
    });

    it("should emit from an event handler", async () => {
      const Component = () => {
        const { emit } = useEmitter(emitter.setParams({ roomId: 1 }));
        return (
          <button type="button" onClick={() => emit({ payload: { text: "clicked" } })}>
            send
          </button>
        );
      };
      render(<Component />);

      await act(async () => {
        screen.getByText("send").click();
        screen.getByText("send").click();
        await flushPromises();
      });

      expect(websocket.sentMessages).toStrictEqual([
        { topic: "chat/1", data: { text: "clicked" } },
        { topic: "chat/1", data: { text: "clicked" } },
      ]);
    });

    it("should emit from an effect", async () => {
      const Component = () => {
        const { emit } = useEmitter(emitter.setParams({ roomId: 1 }));
        useEffect(() => {
          emit({ payload: { text: "mounted" } });
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);
        return null;
      };

      await act(async () => {
        render(<Component />);
        await flushPromises();
      });

      expect(websocket.sentMessages).toStrictEqual([{ topic: "chat/1", data: { text: "mounted" } }]);
    });

    it("should keep the order of messages emitted in one handler", async () => {
      const view = renderHook(() => useEmitter(emitter.setParams({ roomId: 1 })));

      await act(async () => {
        for (let i = 0; i < 20; i += 1) {
          view.result.current.emit({ payload: { text: String(i) } });
        }
        await flushPromises();
      });

      expect(websocket.sentMessages.map((message) => (message.data as Message).text)).toStrictEqual(
        Array.from({ length: 20 }, (_, index) => String(index)),
      );
    });

    it("should type the emit options by the emitter", () => {
      const view = renderHook(() => useEmitter(emitter));

      expectTypeOf(view.result.current.emit).toBeCallableWith({ payload: { text: "hi" }, params: { roomId: 1 } });
      expectTypeOf(view.result.current.connected).toEqualTypeOf<boolean>();
      expectTypeOf(view.result.current.connecting).toEqualTypeOf<boolean>();
      // @ts-expect-error - payload has a wrong shape
      expectTypeOf(view.result.current.emit).toBeCallableWith({ payload: { text: 1 }, params: { roomId: 1 } });
    });
  });

  describe("When using the emit callbacks", () => {
    it("should call onEmit when a message is sent", async () => {
      const spy = vi.fn();
      const view = renderHook(() => {
        const hook = useEmitter(emitter.setParams({ roomId: 1 }));
        hook.onEmit(spy);
        return hook;
      });

      await act(async () => {
        view.result.current.emit({ payload: { text: "hi" } });
        await flushPromises();
      });

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should call the latest onEmit callback", async () => {
      const calls: string[] = [];
      const view = renderHook(
        ({ label }: { label: string }) => {
          const hook = useEmitter(emitter.setParams({ roomId: 1 }));
          hook.onEmit(() => calls.push(label));
          return hook;
        },
        { initialProps: { label: "first-render" } },
      );

      await act(async () => {
        view.result.current.emit({ payload: { text: "a" } });
        await flushPromises();
      });
      view.rerender({ label: "second-render" });
      await act(async () => {
        view.result.current.emit({ payload: { text: "b" } });
        await flushPromises();
      });

      expect(calls).toStrictEqual(["first-render", "second-render"]);
    });

    it("should not call onEmit for other topics", async () => {
      const spy = vi.fn();
      renderHook(() => {
        const hook = useEmitter(emitter.setParams({ roomId: 1 }));
        hook.onEmit(spy);
        return hook;
      });

      await act(async () => {
        emitter.emit({ payload: { text: "other room" }, params: { roomId: 2 } });
        await flushPromises();
      });

      expect(spy).not.toHaveBeenCalled();
    });

    it("should call onEmitError when the message is emitted while disconnected", async () => {
      const errors: string[] = [];
      const view = renderHook(() => {
        const hook = useEmitter(emitter.setParams({ roomId: 1 }));
        hook.onEmitError(({ error }) => errors.push(error.message));
        return hook;
      });
      await act(async () => {
        await socket.disconnect();
      });

      await act(async () => {
        view.result.current.emit({ payload: { text: "lost" } });
        await flushPromises();
      });

      expect(errors).toStrictEqual(["Cannot emit event when connection is not open"]);
      expect(websocket.sent).toStrictEqual([]);
    });

    it("should call onEmitError when the transport fails to send", async () => {
      const errors: string[] = [];
      const view = renderHook(() => {
        const hook = useEmitter(emitter.setParams({ roomId: 1 }));
        hook.onEmitError(({ error }) => errors.push(error.message));
        return hook;
      });
      socket.onError(() => null);
      websocket.send = () => {
        throw new Error("Buffer is full");
      };

      await act(async () => {
        view.result.current.emit({ payload: { text: "lost" } });
        await flushPromises();
      });

      expect(errors).toStrictEqual(["Buffer is full"]);
    });

    it("should not call the callbacks after unmount", async () => {
      const onEmit = vi.fn();
      const onEmitError = vi.fn();
      const before = socket.emitter.eventNames().length;
      const view = renderHook(() => {
        const hook = useEmitter(emitter.setParams({ roomId: 1 }));
        hook.onEmit(onEmit);
        hook.onEmitError(onEmitError);
        return hook;
      });

      view.unmount();
      await act(async () => {
        emitter.emit({ payload: { text: "after unmount" }, params: { roomId: 1 } });
        await flushPromises();
      });

      expect(onEmit).not.toHaveBeenCalled();
      expect(onEmitError).not.toHaveBeenCalled();
      expect(socket.emitter.eventNames()).toHaveLength(before);
    });
  });

  describe("When the emitter changes", () => {
    it("should follow the topic of the new emitter", async () => {
      const spy = vi.fn();
      const view = renderHook(
        ({ roomId }: { roomId: number }) => {
          const hook = useEmitter(emitter.setParams({ roomId }));
          hook.onEmit(spy);
          return hook;
        },
        { initialProps: { roomId: 1 } },
      );
      view.rerender({ roomId: 2 });

      await act(async () => {
        emitter.emit({ payload: { text: "old room" }, params: { roomId: 1 } });
        await flushPromises();
      });
      expect(spy).not.toHaveBeenCalled();

      await act(async () => {
        view.result.current.emit({ payload: { text: "new room" } });
        await flushPromises();
      });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(websocket.sentMessages.at(-1)).toStrictEqual({ topic: "chat/2", data: { text: "new room" } });
    });

    it("should follow an emitter of another socket with the same topic", async () => {
      const otherSocket = createSocket("ws://other-socket");
      const otherWebsocket = await openWebSocket(2);
      const otherEmitter = createEmitter(otherSocket);
      const spy = vi.fn();
      const view = renderHook(
        ({ current }: { current: typeof emitter }) => {
          const hook = useEmitter(current.setParams({ roomId: 1 }));
          hook.onEmit(spy);
          return hook;
        },
        { initialProps: { current: emitter } },
      );
      view.rerender({ current: otherEmitter });

      await act(async () => {
        view.result.current.emit({ payload: { text: "new socket" } });
        await flushPromises();
      });

      expect(otherWebsocket.sentMessages).toStrictEqual([{ topic: "chat/1", data: { text: "new socket" } }]);
      expect(websocket.sent).toStrictEqual([]);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("When rendered in StrictMode", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <StrictMode>{children}</StrictMode>;

    it("should call onEmit once per message", async () => {
      const spy = vi.fn();
      const view = renderHook(
        () => {
          const hook = useEmitter(emitter.setParams({ roomId: 1 }));
          hook.onEmit(spy);
          return hook;
        },
        { wrapper },
      );

      await act(async () => {
        view.result.current.emit({ payload: { text: "once" } });
        await flushPromises();
      });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(websocket.sentMessages).toHaveLength(1);
    });

    it("should report the connection state and leave nothing behind after unmount", async () => {
      const before = socket.emitter.eventNames().length;
      const view = renderHook(() => useEmitter(emitter.setParams({ roomId: 1 }), { dependencyTracking: false }), {
        wrapper,
      });

      expect(view.result.current.connected).toBeTrue();
      await act(async () => {
        await socket.disconnect();
      });
      expect(view.result.current.connected).toBeFalse();

      view.unmount();
      expect(socket.emitter.eventNames()).toHaveLength(before);
    });
  });

  describe("When the connection state changes", () => {
    it("should follow connecting, connected and disconnected", async () => {
      const lazy = createSocket("ws://lazy");
      await flushPromises();
      const lazyEmitter = lazy.createEmitter<Message>()({ topic: "chat" });
      const view = renderHook(() => useEmitter(lazyEmitter, { dependencyTracking: false }));

      expect(view.result.current.connecting).toBeTrue();
      expect(view.result.current.connected).toBeFalse();

      act(() => {
        Transport.last.serverOpen();
      });
      expect(view.result.current.connecting).toBeFalse();
      expect(view.result.current.connected).toBeTrue();

      act(() => {
        Transport.last.serverClose({ code: 1000, wasClean: true });
      });
      expect(view.result.current.connected).toBeFalse();
    });

    it("should share the connection state between hooks of one socket", async () => {
      const first = renderHook(() => useEmitter(emitter.setParams({ roomId: 1 }), { dependencyTracking: false }));
      const second = renderHook(() => useEmitter(emitter.setParams({ roomId: 2 }), { dependencyTracking: false }));

      await act(async () => {
        await socket.disconnect();
      });

      expect(first.result.current.connected).toBeFalse();
      expect(second.result.current.connected).toBeFalse();
    });

    it("should not re-render for connection changes the component does not read", async () => {
      const renders = vi.fn();
      renderHook(() => {
        renders();
        return useEmitter(emitter.setParams({ roomId: 1 })).emit;
      });
      renders.mockClear();

      await act(async () => {
        await socket.disconnect();
      });

      expect(renders).not.toHaveBeenCalled();
    });

    it("should call the latest connection callbacks", async () => {
      const calls: string[] = [];
      renderHook(() => {
        const { onConnected, onDisconnected, onReconnecting } = useEmitter(emitter.setParams({ roomId: 1 }));
        onConnected(() => calls.push("connected"));
        onDisconnected(() => calls.push("disconnected"));
        onReconnecting(({ attempts }) => calls.push(`reconnecting:${attempts}`));
      });

      await act(async () => {
        const reconnecting = socket.reconnect();
        await openWebSocket(2);
        await reconnecting;
      });

      expect(calls).toStrictEqual(["reconnecting:0", "disconnected", "connected"]);
    });
  });
});
