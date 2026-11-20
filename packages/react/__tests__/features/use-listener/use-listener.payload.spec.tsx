import type { ListenerCallbackType, ListenerOfAdapter } from "@hyper-fetch/sockets";
import { Socket, SocketAdapter } from "@hyper-fetch/sockets";
import { act, render, renderHook, screen } from "@testing-library/react";
import { useListener } from "hooks/use-listener";
import React, { StrictMode, useState } from "react";

type Message = { text: string };
type RoomInput = { roomId: string };

type Subscription = {
  listener: ListenerOfAdapter<any>;
  callback: ListenerCallbackType<any, any>;
};

/** Adapter with one server subscription per (topic, payload), like the tRPC and oRPC socket adapters */
const createPayloadSocket = () => {
  const subscriptions: Subscription[] = [];
  let onEvent:
    | ((event: { topic: string; data: unknown; extra: undefined; callbacks?: ReadonlySet<any> }) => void)
    | null = null;

  const adapter = new SocketAdapter({ name: "payload-test", defaultConnected: true }).setConnector((bindings) => {
    ({ onEvent } = bindings);
    return {
      connect: () => {},
      reconnect: () => {},
      disconnect: () => {},
      emit: () => {},
      listen: (listener, callback) => {
        const subscription = { listener, callback };
        subscriptions.push(subscription);
        return bindings.onListen({
          listener,
          callback,
          onUnmount: () => subscriptions.splice(subscriptions.indexOf(subscription), 1),
        });
      },
    };
  });

  const socket = new Socket({ url: "ws://payload", adapter });

  const serverPush = (payload: RoomInput, data: Message) => {
    const key = JSON.stringify(payload);
    const callbacks = new Set(
      subscriptions.filter((sub) => JSON.stringify(sub.listener.payload) === key).map((sub) => sub.callback),
    );
    act(() => {
      onEvent?.({ topic: "chat.onMessage", data, extra: undefined, callbacks });
    });
  };

  const payloads = () => subscriptions.map((sub) => sub.listener.payload);

  return { socket, subscriptions, serverPush, payloads };
};

describe("useListener [ Payload ]", () => {
  let setup: ReturnType<typeof createPayloadSocket>;
  let onMessage: ReturnType<typeof createOnMessage>;

  const createOnMessage = (socket: ReturnType<typeof createPayloadSocket>["socket"]) =>
    socket.createListener<Message, RoomInput>()({ topic: "chat.onMessage" });

  beforeEach(() => {
    setup = createPayloadSocket();
    onMessage = createOnMessage(setup.socket);
  });

  it("should subscribe with the payload of the listener", () => {
    renderHook(() => useListener(onMessage.setPayload({ roomId: "1" })));

    expect(setup.payloads()).toStrictEqual([{ roomId: "1" }]);
  });

  it("should receive only the messages of its payload", () => {
    const view = renderHook(() => useListener(onMessage.setPayload({ roomId: "1" })));

    setup.serverPush({ roomId: "2" }, { text: "other room" });
    expect(view.result.current.data).toBeNull();

    setup.serverPush({ roomId: "1" }, { text: "my room" });
    expect(view.result.current.data).toStrictEqual({ text: "my room" });
  });

  it("should keep the subscription when an equal payload is created on every render", () => {
    const view = renderHook(() => useListener(onMessage.setPayload({ roomId: "1" })));

    view.rerender();
    view.rerender();

    expect(setup.subscriptions).toHaveLength(1);
  });

  it("should move the subscription when the payload changes", () => {
    const view = renderHook(({ roomId }) => useListener(onMessage.setPayload({ roomId })), {
      initialProps: { roomId: "1" },
    });

    view.rerender({ roomId: "2" });

    expect(setup.payloads()).toStrictEqual([{ roomId: "2" }]);
    setup.serverPush({ roomId: "1" }, { text: "old room" });
    expect(view.result.current.data).toBeNull();
    setup.serverPush({ roomId: "2" }, { text: "new room" });
    expect(view.result.current.data).toStrictEqual({ text: "new room" });
  });

  it("should unsubscribe on unmount", () => {
    const view = renderHook(() => useListener(onMessage.setPayload({ roomId: "1" })));

    view.unmount();

    expect(setup.subscriptions).toHaveLength(0);
  });

  it("should route messages between components listening with different payloads", () => {
    const Room = ({ roomId }: { roomId: string }) => {
      const { data } = useListener(onMessage.setPayload({ roomId }));
      return <div data-testid={`room-${roomId}`}>{data?.text ?? "empty"}</div>;
    };
    render(
      <>
        <Room roomId="1" />
        <Room roomId="2" />
      </>,
    );

    setup.serverPush({ roomId: "2" }, { text: "second" });

    expect(screen.getByTestId("room-1").textContent).toBe("empty");
    expect(screen.getByTestId("room-2").textContent).toBe("second");
  });

  it("should switch rooms from a state change", () => {
    let setRoom: (roomId: string) => void = () => {};
    const Room = () => {
      const [roomId, setRoomId] = useState("1");
      setRoom = setRoomId;
      const { data } = useListener(onMessage.setPayload({ roomId }));
      return <div data-testid="room">{data?.text ?? "empty"}</div>;
    };
    render(<Room />);

    act(() => setRoom("2"));
    setup.serverPush({ roomId: "2" }, { text: "switched" });

    expect(screen.getByTestId("room").textContent).toBe("switched");
    expect(setup.payloads()).toStrictEqual([{ roomId: "2" }]);
  });

  describe("When rendered in StrictMode", () => {
    it("should hold a single subscription", () => {
      renderHook(() => useListener(onMessage.setPayload({ roomId: "1" })), { wrapper: StrictMode });

      expect(setup.subscriptions).toHaveLength(1);
    });

    it("should hold a single subscription after the payload changes", () => {
      const view = renderHook(({ roomId }) => useListener(onMessage.setPayload({ roomId })), {
        initialProps: { roomId: "1" },
        wrapper: StrictMode,
      });

      view.rerender({ roomId: "2" });

      expect(setup.payloads()).toStrictEqual([{ roomId: "2" }]);
    });

    it("should leave no subscription after unmount", () => {
      const view = renderHook(() => useListener(onMessage.setPayload({ roomId: "1" })), { wrapper: StrictMode });

      view.unmount();

      expect(setup.subscriptions).toHaveLength(0);
    });
  });

  describe("When typing", () => {
    it("should reject a listener without its required payload", () => {
      const useMissing = () =>
        // @ts-expect-error the payload is required
        useListener(onMessage);
      const useSet = () => useListener(onMessage.setPayload({ roomId: "1" }));
      expectTypeOf(useSet).returns.toHaveProperty("data").toEqualTypeOf<Message | null>();
      expect(useMissing).toBeFunction();
    });

    it("should accept a listener without a payload", () => {
      const plain = setup.socket.createListener<Message>()({ topic: "news" });
      const usePlain = () => useListener(plain);
      expectTypeOf(usePlain).returns.toHaveProperty("data").toEqualTypeOf<Message | null>();
      expect(true).toBeTrue();
    });
  });
});
