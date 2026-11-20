/**
 * @vitest-environment jsdom
 */
import { useListener } from "@hyper-fetch/react";
import { createSocketSdk, Socket } from "@hyper-fetch/sockets";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { StrictMode } from "react";

import type { OrpcSocketSchema } from "../../src/adapter";
import { OrpcSocketError } from "../../src/socket";
import { OrpcStreamAdapter } from "../../src/stream-adapter";
import { OrpcWebsocketAdapter } from "../../src/websocket-adapter";
import type { RealtimeRouter, RealtimeState } from "./e2e.orpc-realtime-server";
import { createRealtimeHttpServer, createRealtimeState, createRealtimeWsServer } from "./e2e.orpc-realtime-server";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

/** Hooks re-render only for the fields read during the render */
const track = <T extends Record<string, any>>(hook: T) => {
  ["data", "extra", "connected", "status", "error"].forEach((field) => hook[field]);
  return hook;
};

const transports = [
  {
    name: "OrpcStreamAdapter",
    createServer: createRealtimeHttpServer,
    createSocket: (url: string) => new Socket({ url, adapter: OrpcStreamAdapter() }),
  },
  {
    name: "OrpcWebsocketAdapter",
    createServer: createRealtimeWsServer,
    createSocket: (url: string) => new Socket({ url, adapter: OrpcWebsocketAdapter() }),
  },
];

describe.each(transports)("Orpc Realtime [ React $name ]", ({ createServer, createSocket }) => {
  let state: RealtimeState = createRealtimeState();
  let server = createServer(state);
  let socket: ReturnType<typeof createSocket> | undefined;

  const createApi = (url: string) => {
    const created = createSocket(url);
    socket = created;
    return createSocketSdk<typeof created, OrpcSocketSchema<RealtimeRouter>>(created, { camelCaseToKebabCase: false });
  };

  /** Generators of the input that did not finish */
  const activeOf = (id: number) => state.active().filter((run) => (run.input as { id: number }).id === id);

  beforeEach(async () => {
    state = createRealtimeState();
    server = createServer(state);
  });

  afterEach(async () => {
    cleanup();
    await socket?.disconnect();
    socket = undefined;
    await server.stop();
  });

  it("should show the events of the subscription", async () => {
    const sdk = createApi(await server.start());

    const { result } = renderHook(() => track(useListener(sdk.planet.onUpdate.$listener.setPayload({ id: 1 }))));
    await waitFor(() => expect(activeOf(1)).toHaveLength(1));
    state.publish({ id: 1, name: "Earth" });

    await waitFor(() => expect(result.current.data).toStrictEqual({ id: 1, name: "Earth" }));
    expect(result.current.extra).toStrictEqual({ id: "1", retry: undefined });
  });

  it("should subscribe again when the payload changes", async () => {
    const sdk = createApi(await server.start());

    const { result, rerender } = renderHook(
      ({ id }) => track(useListener(sdk.planet.onUpdate.$listener.setPayload({ id }))),
      { initialProps: { id: 1 } },
    );
    await waitFor(() => expect(activeOf(1)).toHaveLength(1));
    state.publish({ id: 1, name: "Earth" });
    await waitFor(() => expect(result.current.data).toStrictEqual({ id: 1, name: "Earth" }));

    rerender({ id: 2 });

    await waitFor(() => expect(activeOf(2)).toHaveLength(1));
    await waitFor(() => expect(activeOf(1)).toHaveLength(0));
    state.publish({ id: 1, name: "Old" });
    state.publish({ id: 2, name: "Mars" });
    await waitFor(() => expect(result.current.data).toStrictEqual({ id: 2, name: "Mars" }));
    expect(state.runs.filter((run) => (run.input as { id: number }).id === 2)).toHaveLength(1);
  });

  it("should hold one server subscription in StrictMode", async () => {
    const sdk = createApi(await server.start());
    const onEvent = vi.fn();

    const { result } = renderHook(
      () => {
        const listener = track(useListener(sdk.planet.onUpdate.$listener.setPayload({ id: 1 })));
        listener.onEvent(({ data }) => onEvent(data));
        return listener;
      },
      { wrapper: StrictMode },
    );

    // The subscription of the first StrictMode mount is aborted, its generator finishes
    await waitFor(() => expect(activeOf(1)).toHaveLength(1));
    await waitFor(() => expect(state.runs.filter((run) => run.finished)).toHaveLength(state.runs.length - 1));
    state.publish({ id: 1, name: "Earth" });

    await waitFor(() => expect(result.current.data).toStrictEqual({ id: 1, name: "Earth" }));
    expect(onEvent).toHaveBeenCalledOnce();
  });

  /** Statuses rendered in order, without repeats - React may render two quick changes at once */
  const renderedStatuses = (statuses: string[]) => statuses.filter((status, index) => status !== statuses[index - 1]);

  it("should be listening once the server confirms the subscription", async () => {
    const sdk = createApi(await server.start());

    const { result } = renderHook(() => track(useListener(sdk.planet.onUpdate.$listener.setPayload({ id: 1 }))));

    expect(result.current.status).toBe("starting");
    await waitFor(() => expect(result.current.status).toBe("listening"));
    expect(activeOf(1)).toHaveLength(1);
  });

  it("should go from starting to listening to ended for a finite iterator", async () => {
    const sdk = createApi(await server.start());
    const statuses: string[] = [];
    const onStart = vi.fn();

    const { result } = renderHook(() => {
      const listener = track(useListener(sdk.countdown.$listener.setPayload({ from: 2 })));
      listener.onStart(onStart);
      statuses.push(listener.status);
      return listener;
    });

    await waitFor(() => expect(result.current.status).toBe("ended"));
    expect(onStart).toHaveBeenCalledOnce();
    expect(result.current.data).toStrictEqual({ value: 1 });
    expect(result.current.error).toBeNull();
    expect(["idle", "starting", "listening", "ended"]).toIncludeAllMembers(renderedStatuses(statuses));
    expect(renderedStatuses(statuses).slice(0, 2)).toStrictEqual(["idle", "starting"]);
  });

  it("should go to failed with the OrpcSocketError when the iterator fails", async () => {
    const sdk = createApi(await server.start());
    const statuses: string[] = [];
    const onStart = vi.fn();

    const { result } = renderHook(() => {
      const listener = track(useListener(sdk.overheat.$listener));
      listener.onStart(onStart);
      statuses.push(listener.status);
      return listener;
    });

    await waitFor(() => expect(result.current.status).toBe("failed"));
    expect(onStart).toHaveBeenCalledOnce();
    expect(result.current.error).toBeInstanceOf(OrpcSocketError);
    expect(result.current.error).toMatchObject({ topic: "overheat", code: "OVERHEATED", defined: true });
    expect(result.current.data).toStrictEqual({ celsius: 100 });
    expect(renderedStatuses(statuses).slice(0, 2)).toStrictEqual(["idle", "starting"]);
  });

  it("should stop the server subscription on unmount", async () => {
    const sdk = createApi(await server.start());

    const { unmount } = renderHook(() => track(useListener(sdk.planet.onUpdate.$listener.setPayload({ id: 1 }))));
    await waitFor(() => expect(activeOf(1)).toHaveLength(1));

    unmount();

    await waitFor(() => expect(state.active()).toHaveLength(0));
    expect(state.runs.every((run) => run.finished)).toBeTrue();
  });
});
