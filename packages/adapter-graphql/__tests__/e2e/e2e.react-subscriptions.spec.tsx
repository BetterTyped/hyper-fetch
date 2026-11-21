/**
 * @vitest-environment jsdom
 */
import { useListener } from "@hyper-fetch/react";
import { Socket } from "@hyper-fetch/sockets";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { DocumentNode } from "graphql";
import gql from "graphql-tag";
import type { ReactNode } from "react";
import { StrictMode } from "react";

import { GraphqlSubscriptionError, GraphqlWsAdapter } from "../../src";
import type { Message, ServerState } from "./e2e.graphql-ws-server";
import { createE2EGraphqlWsServer, createServerState } from "./e2e.graphql-ws-server";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type TypedDocument<Result, Variables> = DocumentNode & { __apiType?: (variables: Variables) => Result };

const OnMessageDocument = gql`
  subscription OnMessage($room: String!) {
    onMessage(room: $room) {
      id
      text
    }
  }
` as TypedDocument<{ onMessage: Pick<Message, "id" | "text"> }, { room: string }>;

const CountdownDocument = gql`
  subscription Countdown($from: Int!) {
    countdown(from: $from)
  }
` as TypedDocument<{ countdown: number }, { from: number }>;

/** Hooks re-render only for the fields read during the render */
const track = <T extends Record<string, any>>(hook: T) => {
  ["data", "extra", "connected", "connecting", "timestamp", "status", "error"].forEach((field) => hook[field]);
  return hook;
};

const strictMode = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;

describe("Graphql Ws Adapter [ React ]", () => {
  let state: ServerState = createServerState();
  let server = createE2EGraphqlWsServer(state);
  let socket = new Socket({
    url: "ws://localhost",
    adapter: GraphqlWsAdapter(),
    adapterOptions: { autoConnect: false },
  });

  const createListeners = () => ({
    onMessage: socket.createListener()({ topic: "OnMessage", options: { document: OnMessageDocument } }),
    countdown: socket.createListener()({ topic: "Countdown", options: { document: CountdownDocument } }),
    invalid: socket.createListener<unknown>()({ topic: "subscription { unknownField }" }),
  });

  const publish = (id: string, room: string, text: string) => state.publish({ id, room, text });

  beforeEach(async () => {
    state = createServerState();
    server = createE2EGraphqlWsServer(state);
    const url = await server.startServer();
    socket = new Socket({ url, adapter: GraphqlWsAdapter(), reconnectTime: 10 });
    await waitFor(() => expect(socket.adapter.connected).toBeTrue());
  });

  afterEach(async () => {
    cleanup();
    await socket.disconnect();
    await server.stopServer();
  });

  it("should receive the events of the subscription", async () => {
    const { onMessage } = createListeners();
    const onEvent = vi.fn();

    const { result } = renderHook(() => {
      const listener = track(useListener(onMessage.setPayload({ room: "a" })));
      listener.onEvent(onEvent);
      return listener;
    });

    await waitFor(() => expect(state.active("onMessage")).toHaveLength(1));
    publish("1", "a", "hello");

    await waitFor(() => expect(result.current.data).toStrictEqual({ onMessage: { id: "1", text: "hello" } }));
    expect(result.current.extra).toStrictEqual({ errors: undefined, extensions: {}, payload: { room: "a" } });
    expect(result.current.connected).toBeTrue();
    expect(onEvent).toHaveBeenCalledTimes(1);
  });

  it("should subscribe again when the variables change", async () => {
    const { onMessage } = createListeners();

    const { result, rerender } = renderHook(({ room }) => track(useListener(onMessage.setPayload({ room }))), {
      initialProps: { room: "a" },
    });
    await waitFor(() => expect(state.active("onMessage")).toHaveLength(1));

    rerender({ room: "b" });

    await waitFor(() => expect(state.subscriptions[0].finished).toBeTrue());
    await waitFor(() => expect(state.active("onMessage")).toHaveLength(1));
    expect(state.active("onMessage")[0].args).toStrictEqual({ room: "b" });

    publish("1", "a", "for a");
    publish("2", "b", "for b");
    await waitFor(() => expect(result.current.data).toStrictEqual({ onMessage: { id: "2", text: "for b" } }));
  });

  it("should hold one server subscription in StrictMode", async () => {
    const { onMessage } = createListeners();
    const onEvent = vi.fn();

    const { result } = renderHook(
      () => {
        const listener = track(useListener(onMessage.setPayload({ room: "a" })));
        listener.onEvent(onEvent);
        return listener;
      },
      { wrapper: strictMode },
    );

    await waitFor(() => expect(state.active("onMessage")).toHaveLength(1));
    publish("1", "a", "hello");
    await waitFor(() => expect(result.current.data?.onMessage.text).toBe("hello"));

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(state.active("onMessage")).toHaveLength(1);
  });

  it("should stop the server subscription on unmount", async () => {
    const { onMessage } = createListeners();

    const { unmount } = renderHook(() => track(useListener(onMessage.setPayload({ room: "a" }))));
    await waitFor(() => expect(state.active("onMessage")).toHaveLength(1));

    unmount();

    await waitFor(() => expect(state.active("onMessage")).toHaveLength(0));
  });

  it("should share one server subscription between components with the same variables", async () => {
    const { onMessage } = createListeners();

    const first = renderHook(() => track(useListener(onMessage.setPayload({ room: "a" }))));
    const second = renderHook(() => track(useListener(onMessage.setPayload({ room: "a" }))));
    await waitFor(() => expect(state.active("onMessage")).toHaveLength(1));
    publish("1", "a", "hello");

    await waitFor(() => expect(first.result.current.data?.onMessage.text).toBe("hello"));
    await waitFor(() => expect(second.result.current.data?.onMessage.text).toBe("hello"));

    first.unmount();
    publish("2", "a", "again");
    await waitFor(() => expect(second.result.current.data?.onMessage.text).toBe("again"));
    expect(state.active("onMessage")).toHaveLength(1);
  });

  describe("when following the status", () => {
    it("should be listening once the subscription is sent", async () => {
      const { onMessage } = createListeners();

      const { result } = renderHook(() => track(useListener(onMessage.setPayload({ room: "a" }))));

      await waitFor(() => expect(result.current.status).toBe("listening"));
      expect(result.current.error).toBeNull();
    });

    it("should end when the server completes the subscription", async () => {
      const { countdown } = createListeners();

      const { result } = renderHook(() => track(useListener(countdown.setPayload({ from: 2 }))));

      await waitFor(() => expect(result.current.status).toBe("ended"));
      expect(result.current.data).toStrictEqual({ countdown: 1 });
      expect(result.current.error).toBeNull();
    });

    it("should fail with the errors of the server", async () => {
      const { invalid } = createListeners();

      const { result } = renderHook(() => track(useListener(invalid)));

      await waitFor(() => expect(result.current.status).toBe("failed"));
      expect(result.current.error).toBeInstanceOf(GraphqlSubscriptionError);
      expect((result.current.error as GraphqlSubscriptionError).errors[0].message).toBe(
        'Cannot query field "unknownField" on type "Subscription".',
      );
    });

    it("should subscribe again with listen after the end", async () => {
      const { countdown } = createListeners();
      const { result } = renderHook(() => track(useListener(countdown.setPayload({ from: 1 }))));
      await waitFor(() => expect(result.current.status).toBe("ended"));
      const onEvent = vi.fn();
      result.current.onEvent(onEvent);

      act(() => {
        result.current.listen();
      });

      await waitFor(() => expect(onEvent).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(result.current.status).toBe("ended"));
    });
  });
});
