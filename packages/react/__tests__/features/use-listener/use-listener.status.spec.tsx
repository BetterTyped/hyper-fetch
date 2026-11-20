import type { ListenerCallbackType, ListenerOfAdapter } from "@hyper-fetch/sockets";
import { Socket, SocketAdapter } from "@hyper-fetch/sockets";
import { act, renderHook } from "@testing-library/react";
import { useListener } from "hooks/use-listener";
import React, { StrictMode } from "react";
import { renderToString } from "react-dom/server";

type Message = { text: string };
type RoomInput = { roomId: string };

type Subscription = {
  listener: ListenerOfAdapter<any>;
  callback: ListenerCallbackType<any, any>;
};

/** Adapter whose server confirms and ends subscriptions on demand, like the tRPC and oRPC socket adapters */
const createConfirmingSocket = () => {
  const subscriptions: Subscription[] = [];
  const adapter = new SocketAdapter({ name: "confirming", defaultConnected: true, confirmsSubscriptions: true });
  type Bindings = Parameters<Parameters<typeof adapter.setConnector>[0]>[0];
  let bindings: Bindings | undefined;

  adapter.setConnector((connectorBindings) => {
    bindings = connectorBindings;
    return {
      connect: () => {},
      reconnect: () => {},
      disconnect: () => {},
      emit: () => {},
      listen: (listener, callback) => {
        const subscription = { listener, callback };
        subscriptions.push(subscription);
        return connectorBindings.onListen({
          listener,
          callback,
          onUnmount: () => subscriptions.splice(subscriptions.indexOf(subscription), 1),
        });
      },
    };
  });

  const socket = new Socket({ url: "ws://confirming", adapter });
  const callbacksOf = (payload: RoomInput) =>
    new Set(
      subscriptions
        .filter((sub) => JSON.stringify(sub.listener.payload) === JSON.stringify(payload))
        .map((sub) => sub.callback),
    );

  const server = {
    start: (payload: RoomInput) =>
      act(() => bindings?.onListenerStart({ topic: "chat.onMessage", callbacks: callbacksOf(payload) })),
    push: (payload: RoomInput, data: Message) =>
      act(() =>
        bindings?.onEvent({ topic: "chat.onMessage", data, extra: undefined, callbacks: callbacksOf(payload) }),
      ),
    end: (payload: RoomInput, error: Error | null = null) =>
      act(() => bindings?.onListenerEnd({ topic: "chat.onMessage", callbacks: callbacksOf(payload), error })),
  };

  const onMessage = socket.createListener<Message, RoomInput>()({ topic: "chat.onMessage" });

  return { socket, subscriptions, server, onMessage };
};

/** Reading the state after the events needs every key tracked, like in the other hook specs */
const untracked = { dependencyTracking: false };

describe("useListener [ Status ]", () => {
  let setup: ReturnType<typeof createConfirmingSocket>;

  beforeEach(() => {
    setup = createConfirmingSocket();
  });

  describe("When the adapter does not confirm subscriptions", () => {
    it("should be listening right after the mount", () => {
      const socket = new Socket({ url: "ws://plain", adapterOptions: { autoConnect: false } });
      const listener = socket.createListener<Message>()({ topic: "news" });
      const view = renderHook(() => useListener(listener, untracked));

      expect(view.result.current.status).toBe("listening");
      expect(view.result.current.error).toBeNull();
    });

    it("should be idle when rendered on the server", () => {
      const socket = new Socket({ url: "ws://plain", adapterOptions: { autoConnect: false } });
      const listener = socket.createListener<Message>()({ topic: "news" });
      let status = "";
      const Component = () => {
        ({ status } = useListener(listener));
        return null;
      };

      renderToString(<Component />);

      expect(status).toBe("idle");
    });
  });

  describe("When the server confirms the subscription", () => {
    it("should be starting until the server confirms it", () => {
      const view = renderHook(() => useListener(setup.onMessage.setPayload({ roomId: "1" }), untracked));

      expect(view.result.current.status).toBe("starting");

      setup.server.start({ roomId: "1" });

      expect(view.result.current.status).toBe("listening");
    });

    it("should call onStart with the topic", () => {
      const onStart = vi.fn();
      renderHook(() => {
        const result = useListener(setup.onMessage.setPayload({ roomId: "1" }), untracked);
        result.onStart(onStart);
        return result;
      });

      setup.server.start({ roomId: "1" });

      expect(onStart).toHaveBeenCalledWith({ topic: "chat.onMessage" });
    });

    it("should be starting again after the payload changes", () => {
      const view = renderHook(({ roomId }) => useListener(setup.onMessage.setPayload({ roomId }), untracked), {
        initialProps: { roomId: "1" },
      });
      setup.server.start({ roomId: "1" });

      view.rerender({ roomId: "2" });

      expect(view.result.current.status).toBe("starting");
      setup.server.start({ roomId: "2" });
      expect(view.result.current.status).toBe("listening");
    });
  });

  describe("When the server ends the subscription", () => {
    it("should be ended without an error when it finished", () => {
      const view = renderHook(() => useListener(setup.onMessage.setPayload({ roomId: "1" }), untracked));
      setup.server.start({ roomId: "1" });

      setup.server.end({ roomId: "1" });

      expect(view.result.current.status).toBe("ended");
      expect(view.result.current.error).toBeNull();
    });

    it("should be failed with the error when it failed", () => {
      const error = new Error("Forbidden");
      const view = renderHook(() => useListener(setup.onMessage.setPayload({ roomId: "1" }), untracked));

      setup.server.end({ roomId: "1" }, error);

      expect(view.result.current.status).toBe("failed");
      expect(view.result.current.error).toBe(error);
    });

    it("should keep the last data after the end", () => {
      const view = renderHook(() => useListener(setup.onMessage.setPayload({ roomId: "1" }), untracked));
      setup.server.push({ roomId: "1" }, { text: "last" });

      setup.server.end({ roomId: "1" });

      expect(view.result.current.data).toStrictEqual({ text: "last" });
    });

    it("should stop listening after the end", () => {
      const view = renderHook(() => useListener(setup.onMessage.setPayload({ roomId: "1" }), untracked));

      setup.server.end({ roomId: "1" });

      expect(setup.subscriptions).toHaveLength(0);
      setup.server.push({ roomId: "1" }, { text: "late" });
      expect(view.result.current.data).toBeNull();
    });

    it("should call onEnd with the error", () => {
      const onEnd = vi.fn();
      const error = new Error("Gone");
      renderHook(() => {
        const result = useListener(setup.onMessage.setPayload({ roomId: "1" }), untracked);
        result.onEnd(onEnd);
        return result;
      });

      setup.server.end({ roomId: "1" }, error);

      expect(onEnd).toHaveBeenCalledWith({ topic: "chat.onMessage", error });
    });

    it("should subscribe again with listen and clear the error", () => {
      const view = renderHook(() => useListener(setup.onMessage.setPayload({ roomId: "1" }), untracked));
      setup.server.end({ roomId: "1" }, new Error("Gone"));

      act(() => view.result.current.listen());

      expect(view.result.current.status).toBe("starting");
      expect(view.result.current.error).toBeNull();
      expect(setup.subscriptions).toHaveLength(1);
      setup.server.start({ roomId: "1" });
      setup.server.push({ roomId: "1" }, { text: "back" });
      expect(view.result.current.status).toBe("listening");
      expect(view.result.current.data).toStrictEqual({ text: "back" });
    });

    it("should subscribe again when the payload changes after the end", () => {
      const view = renderHook(({ roomId }) => useListener(setup.onMessage.setPayload({ roomId }), untracked), {
        initialProps: { roomId: "1" },
      });
      setup.server.end({ roomId: "1" });

      view.rerender({ roomId: "2" });

      expect(view.result.current.status).toBe("starting");
      expect(setup.subscriptions.map((sub) => sub.listener.payload)).toStrictEqual([{ roomId: "2" }]);
    });

    it("should not change the status when an old subscription ends after the payload changed", () => {
      const view = renderHook(({ roomId }) => useListener(setup.onMessage.setPayload({ roomId }), untracked), {
        initialProps: { roomId: "1" },
      });
      view.rerender({ roomId: "2" });
      setup.server.start({ roomId: "2" });

      setup.server.end({ roomId: "1" });

      expect(view.result.current.status).toBe("listening");
    });
  });

  describe("When rendered in StrictMode", () => {
    it("should hold one subscription and follow its status", () => {
      const view = renderHook(() => useListener(setup.onMessage.setPayload({ roomId: "1" }), untracked), {
        wrapper: StrictMode,
      });

      expect(setup.subscriptions).toHaveLength(1);
      setup.server.start({ roomId: "1" });
      expect(view.result.current.status).toBe("listening");
      setup.server.end({ roomId: "1" });
      expect(view.result.current.status).toBe("ended");
      expect(setup.subscriptions).toHaveLength(0);
    });
  });

  describe("When tracking dependencies", () => {
    it("should not re-render for the status when the component does not read it", () => {
      let renders = 0;
      renderHook(() => {
        renders += 1;
        const { data } = useListener(setup.onMessage.setPayload({ roomId: "1" }));
        return data;
      });
      const before = renders;

      setup.server.start({ roomId: "1" });
      setup.server.end({ roomId: "1" });

      expect(renders).toBe(before);
    });

    it("should re-render for the status when the component reads it", () => {
      const statuses: string[] = [];
      renderHook(() => {
        const { status } = useListener(setup.onMessage.setPayload({ roomId: "1" }));
        statuses.push(status);
        return status;
      });

      setup.server.start({ roomId: "1" });
      setup.server.end({ roomId: "1" }, new Error("Gone"));

      expect(statuses.at(-1)).toBe("failed");
      expect(statuses).toContain("listening");
    });
  });

  describe("When typing", () => {
    it("should type the status and the error", () => {
      const view = renderHook(() => useListener(setup.onMessage.setPayload({ roomId: "1" })));
      expectTypeOf(view.result.current.status).toEqualTypeOf<"idle" | "starting" | "listening" | "ended" | "failed">();
      expectTypeOf(view.result.current.error).toEqualTypeOf<Error | null>();
      expect(true).toBeTrue();
    });
  });
});
