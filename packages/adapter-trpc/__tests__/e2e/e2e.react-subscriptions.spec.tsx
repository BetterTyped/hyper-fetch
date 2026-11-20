/**
 * @vitest-environment jsdom
 */
import { useListener } from "@hyper-fetch/react";
import { Socket, createSocketSdk } from "@hyper-fetch/sockets";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { StrictMode } from "react";

import type { TrpcSocketSchema } from "../../src";
import { TrpcSocketError, TrpcSseAdapter, TrpcWebsocketAdapter } from "../../src";
import type { ServerState, SubscriptionsRouter } from "./e2e.trpc-subscriptions-server";
import {
  createE2ESseServer,
  createE2EWebsocketServer,
  createServerState,
  createSubscriptionsRouter,
} from "./e2e.trpc-subscriptions-server";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

/** Hooks re-render only for the fields read during the render */
const track = <T extends Record<string, any>>(hook: T) => {
  ["data", "extra", "connected", "connecting", "timestamp", "status", "error"].forEach((field) => hook[field]);
  return hook;
};

const strictMode = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;

describe.each([
  ["WebSocket", createE2EWebsocketServer, TrpcWebsocketAdapter],
  ["SSE", createE2ESseServer, TrpcSseAdapter],
] as const)("Trpc %s Adapter [ React ]", (_name, createServer, createAdapter) => {
  let state: ServerState = createServerState();
  let server = createServer(createSubscriptionsRouter(state));
  let socket = new Socket({ url: "ws://localhost", adapter: createAdapter(), adapterOptions: { autoConnect: false } });

  const createApi = () =>
    createSocketSdk<typeof socket, TrpcSocketSchema<SubscriptionsRouter>>(socket, { camelCaseToKebabCase: false });

  const publish = (id: string, room: string, text: string) => state.publish({ id, room, text });

  beforeEach(async () => {
    state = createServerState();
    server = createServer(createSubscriptionsRouter(state));
    const url = await server.startServer();
    socket = new Socket({ url, adapter: createAdapter(), reconnectTime: 10 });
    await waitFor(() => expect(socket.adapter.connected).toBeTrue());
  });

  afterEach(async () => {
    cleanup();
    await socket.disconnect();
    await server.stopServer();
  });

  it("should receive the events of the subscription", async () => {
    const api = createApi();
    const onEvent = vi.fn();

    const { result } = renderHook(() => {
      const listener = track(useListener(api.chat.onMessage.$listener.setPayload({ room: "a" })));
      listener.onEvent(onEvent);
      return listener;
    });

    await waitFor(() => expect(state.active("chat.onMessage")).toHaveLength(1));
    publish("1", "a", "hello");

    await waitFor(() => expect(result.current.data).toStrictEqual({ room: "a", text: "hello" }));
    expect(result.current.extra).toStrictEqual({ eventId: "1", payload: { room: "a" } });
    expect(result.current.connected).toBeTrue();
    expect(onEvent).toHaveBeenCalledTimes(1);
  });

  it("should subscribe again when the payload changes", async () => {
    const api = createApi();

    const { result, rerender } = renderHook(
      ({ room }) => track(useListener(api.chat.onMessage.$listener.setPayload({ room }))),
      { initialProps: { room: "a" } },
    );
    await waitFor(() => expect(state.active("chat.onMessage")).toHaveLength(1));

    rerender({ room: "b" });

    await waitFor(() => expect(state.subscriptions[0].finished).toBeTrue());
    await waitFor(() => expect(state.active("chat.onMessage")).toHaveLength(1));
    expect(state.active("chat.onMessage")[0].input).toEqual({ room: "b" });

    publish("1", "a", "for a");
    publish("2", "b", "for b");
    await waitFor(() => expect(result.current.data).toStrictEqual({ room: "b", text: "for b" }));
    expect(result.current.extra?.payload).toStrictEqual({ room: "b" });
  });

  it("should hold one server subscription in StrictMode", async () => {
    const api = createApi();
    const onEvent = vi.fn();

    const { result } = renderHook(
      () => {
        const listener = track(useListener(api.chat.onMessage.$listener.setPayload({ room: "a" })));
        listener.onEvent(onEvent);
        return listener;
      },
      { wrapper: strictMode },
    );

    await waitFor(() => expect(state.active("chat.onMessage")).toHaveLength(1));
    publish("1", "a", "hello");
    await waitFor(() => expect(result.current.data).toStrictEqual({ room: "a", text: "hello" }));

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(state.active("chat.onMessage")).toHaveLength(1);
  });

  it("should stop the server subscription on unmount", async () => {
    const api = createApi();

    const { unmount } = renderHook(() => track(useListener(api.onIdle.$listener)));
    await waitFor(() => expect(state.active("onIdle")).toHaveLength(1));

    unmount();

    await waitFor(() => expect(state.active("onIdle")).toHaveLength(0));
    expect(state.subscriptions.every(({ finished }) => finished)).toBeTrue();
  });

  it("should share one server subscription between components with the same payload", async () => {
    const api = createApi();

    const first = renderHook(() => track(useListener(api.chat.onMessage.$listener.setPayload({ room: "a" }))));
    const second = renderHook(() => track(useListener(api.chat.onMessage.$listener.setPayload({ room: "a" }))));
    await waitFor(() => expect(state.active("chat.onMessage")).toHaveLength(1));
    publish("1", "a", "hello");

    await waitFor(() => expect(first.result.current.data?.text).toBe("hello"));
    await waitFor(() => expect(second.result.current.data?.text).toBe("hello"));

    first.unmount();
    publish("2", "a", "again");
    await waitFor(() => expect(second.result.current.data?.text).toBe("again"));
    expect(state.active("chat.onMessage")).toHaveLength(1);
  });

  describe("when following the status", () => {
    /** Every status the hook rendered, without repeats */
    const renderStatuses = <T extends { status: string }>(useHook: () => T) => {
      const statuses: string[] = [];
      const view = renderHook(() => {
        const hook = useHook();
        if (statuses.at(-1) !== hook.status) {
          statuses.push(hook.status);
        }
        return hook;
      });
      return { ...view, statuses };
    };

    it("should go from starting to listening when the server confirms the subscription", async () => {
      const api = createApi();

      const { result, statuses } = renderStatuses(() => track(useListener(api.onIdle.$listener)));

      await waitFor(() => expect(result.current.status).toBe("listening"));
      expect(statuses).toStrictEqual(["idle", "starting", "listening"]);
      expect(result.current.error).toBeNull();
    });

    it("should end when the procedure returns", async () => {
      const api = createApi();

      const { result, statuses } = renderStatuses(() =>
        track(useListener(api.onCount.$listener.setPayload({ to: 2 }))),
      );

      await waitFor(() => expect(result.current.status).toBe("ended"));
      expect(statuses.slice(0, 2)).toStrictEqual(["idle", "starting"]);
      expect(statuses.at(-1)).toBe("ended");
      expect(result.current.data).toBe(2);
      expect(result.current.error).toBeNull();
    });

    it("should fail with the error of the procedure", async () => {
      const api = createApi();

      const { result } = renderStatuses(() =>
        track(useListener(api.onFail.$listener.setPayload({ code: "FORBIDDEN" }))),
      );

      await waitFor(() => expect(result.current.status).toBe("failed"));
      expect(result.current.error).toBeInstanceOf(TrpcSocketError);
      expect(result.current.error).toMatchObject({ message: "Failed with FORBIDDEN" });
      expect(result.current.data).toBe("before");
    });

    it("should subscribe again with listen after the end", async () => {
      const api = createApi();
      const { result } = renderStatuses(() => track(useListener(api.onCount.$listener.setPayload({ to: 1 }))));
      await waitFor(() => expect(result.current.status).toBe("ended"));

      act(() => {
        result.current.listen();
      });

      await waitFor(() => expect(state.subscriptions).toHaveLength(2));
      await waitFor(() => expect(result.current.status).toBe("ended"));
      expect(state.subscriptions.every(({ finished }) => finished)).toBeTrue();
    });
  });
});
