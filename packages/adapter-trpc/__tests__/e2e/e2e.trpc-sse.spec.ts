/**
 * @vitest-environment node
 */
import { Socket, createSocketSdk } from "@hyper-fetch/sockets";
import superjson from "superjson";

import type { TrpcSocketExtraType, TrpcSocketSchema, TrpcSseAdapterOptionsType } from "../../src";
import { TrpcSocketError, TrpcSseAdapter } from "../../src";
import type {
  Message,
  ServerState,
  SubscriptionsRouter,
  SubscriptionsTransformerRouter,
} from "./e2e.trpc-subscriptions-server";
import {
  createE2ESseServer,
  createServerState,
  createSubscriptionsRouter,
  createSubscriptionsTransformerRouter,
} from "./e2e.trpc-subscriptions-server";

type Event<T> = { data: T; extra: TrpcSocketExtraType };

describe("Trpc SSE Adapter [ E2E ]", () => {
  let state: ServerState = createServerState();
  let server = createE2ESseServer(createSubscriptionsRouter(state));
  let url = "";
  const sockets: Socket<ReturnType<typeof TrpcSseAdapter>>[] = [];

  const createApi = ({ adapterOptions }: { adapterOptions?: TrpcSseAdapterOptionsType } = {}) => {
    const socket = new Socket({ url, adapter: TrpcSseAdapter(), adapterOptions });
    sockets.push(socket);
    const errors: Error[] = [];
    socket.onError(({ error }) => {
      errors.push(error as Error);
    });
    const api = createSocketSdk<typeof socket, TrpcSocketSchema<SubscriptionsRouter>>(socket, {
      camelCaseToKebabCase: false,
    });
    return { socket, api, errors };
  };

  const publish = (id: string, room: string, text: string) => state.publish({ id, room, text });

  const waitForSubscriptions = async (path: string, count: number) => {
    await vi.waitFor(() => expect(state.active(path)).toHaveLength(count));
  };

  beforeEach(async () => {
    state = createServerState();
    server = createE2ESseServer(createSubscriptionsRouter(state));
    url = await server.startServer();
  });

  afterEach(async () => {
    await Promise.all(sockets.map((socket) => socket.disconnect()));
    sockets.length = 0;
    await server.stopServer();
  });

  describe("when subscribing", () => {
    it("should receive the tracked events of the input", async () => {
      const { api, errors } = createApi();
      const callback = vi.fn<(event: Event<Omit<Message, "id">>) => void>();

      api.chat.onMessage.$listener.setPayload({ room: "a" }).listen(callback);
      await waitForSubscriptions("chat.onMessage", 1);
      publish("1", "a", "hello");
      publish("2", "a", "again");

      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(2));
      expect(callback.mock.calls.map(([event]) => event)).toStrictEqual([
        { data: { room: "a", text: "hello" }, extra: { eventId: "1", payload: { room: "a" } } },
        { data: { room: "a", text: "again" }, extra: { eventId: "2", payload: { room: "a" } } },
      ]);
      expect(server.urls).toStrictEqual([`/chat.onMessage?input=${encodeURIComponent('{"room":"a"}')}`]);
      expect(errors).toHaveLength(0);
    });

    it("should receive events that are not tracked", async () => {
      const { api } = createApi();
      const callback = vi.fn<(event: Event<Message>) => void>();

      api.chat.onAny.$listener.setPayload({ room: "b" }).listen(callback);
      await waitForSubscriptions("chat.onAny", 1);
      state.publish({ id: "1", room: "b", text: "hi" });

      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback.mock.calls[0][0]).toStrictEqual({
        data: { id: "1", room: "b", text: "hi" },
        extra: { eventId: null, payload: { room: "b" } },
      });
    });

    it("should share one stream between the listeners of an input and keep inputs apart", async () => {
      const { api } = createApi();
      const first = vi.fn();
      const second = vi.fn();
      const other = vi.fn();

      const stopFirst = api.chat.onMessage.$listener.setPayload({ room: "a" }).listen(first);
      const stopSecond = api.chat.onMessage.$listener.setPayload({ room: "a" }).listen(second);
      api.chat.onMessage.$listener.setPayload({ room: "b" }).listen(other);
      await waitForSubscriptions("chat.onMessage", 2);
      publish("1", "a", "hello");

      await vi.waitFor(() => expect(second).toHaveBeenCalledTimes(1));
      expect(first).toHaveBeenCalledTimes(1);
      expect(other).not.toHaveBeenCalled();
      expect(server.urls).toHaveLength(2);

      stopFirst();
      stopSecond();
      await waitForSubscriptions("chat.onMessage", 1);
      expect(state.active("chat.onMessage")[0].input).toEqual({ room: "b" });
    });

    it("should stop the server subscription when unsubscribing", async () => {
      const { api } = createApi();
      const stop = api.onIdle.$listener.listen(vi.fn());
      await waitForSubscriptions("onIdle", 1);

      stop();

      await waitForSubscriptions("onIdle", 0);
      expect(state.subscriptions[0].finished).toBeTrue();
    });

    it("should stop every server subscription when disconnecting", async () => {
      const { socket, api } = createApi();
      api.onIdle.$listener.listen(vi.fn());
      api.chat.onAny.$listener.listen(vi.fn());
      await waitForSubscriptions("onIdle", 1);
      await waitForSubscriptions("chat.onAny", 1);

      await socket.disconnect();

      await vi.waitFor(() => expect(state.active()).toHaveLength(0));
    });

    it("should add the query params and the connection params", async () => {
      const { socket, api } = createApi({ adapterOptions: { connectionParams: { token: "secret" } } });
      socket.setQueryParams({ tenant: "acme" });
      await socket.reconnect();

      api.chat.onMessage.$listener.setPayload({ room: "a" }).listen(vi.fn());

      await waitForSubscriptions("chat.onMessage", 1);
      expect(new URL(server.urls[0], url).searchParams.get("tenant")).toBe("acme");
      expect(state.contexts).toStrictEqual([{ connectionParams: { token: "secret" } }]);
    });
  });

  describe("when the socket reconnects", () => {
    it("should resume from the last event", async () => {
      const { api, socket } = createApi();
      const callback = vi.fn<(event: Event<Omit<Message, "id">>) => void>();
      api.chat.onMessage.$listener.setPayload({ room: "a" }).listen(callback);
      await waitForSubscriptions("chat.onMessage", 1);
      publish("7", "a", "hello");
      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));

      await socket.reconnect();

      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(2));
      await waitForSubscriptions("chat.onMessage", 1);
      expect(state.subscriptions[0].finished).toBeTrue();
      expect(state.subscriptions[1].input).toStrictEqual({ room: "a", lastEventId: "7" });
      expect(callback).toHaveBeenLastCalledWith({
        data: { room: "a", text: "after 7" },
        extra: { eventId: "7-resumed", payload: { room: "a" } },
      });
    });
  });

  describe("when the server ends a subscription", () => {
    it("should receive every event of a subscription that returns", async () => {
      const { api, errors } = createApi();
      const callback = vi.fn();

      api.onCount.$listener.setPayload({ to: 3 }).listen(({ data }) => callback(data));

      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(3));
      await vi.waitFor(() => expect(state.subscriptions[0].finished).toBeTrue());
      expect(callback.mock.calls).toStrictEqual([[1], [2], [3]]);
      expect(errors).toHaveLength(0);
    });

    it("should report the error of a failing subscription", async () => {
      const { api, errors } = createApi();
      const callback = vi.fn();

      api.onFail.$listener.setPayload({ code: "FORBIDDEN" }).listen(({ data }) => callback(data));

      await vi.waitFor(() => expect(errors).toHaveLength(1));
      expect(callback).toHaveBeenCalledWith("before");
      expect(errors[0]).toBeInstanceOf(TrpcSocketError);
      expect(errors[0]).toMatchObject({
        message: "Failed with FORBIDDEN",
        topic: "onFail",
        shape: { data: { code: "FORBIDDEN", httpStatus: 403 } },
      });
      expect(state.subscriptions[0].finished).toBeTrue();
    });

    it("should report an invalid input", async () => {
      const { socket, errors } = createApi();
      const listener = socket.createListener<unknown, { room: number }>()({ topic: "chat/onMessage" });

      listener.setPayload({ room: 1 }).listen(vi.fn());

      await vi.waitFor(() => expect(errors).toHaveLength(1));
      expect(errors[0]).toMatchObject({ message: "Room has to be a string", shape: { data: { code: "BAD_REQUEST" } } });
      expect(state.subscriptions).toHaveLength(0);
    });
  });

  describe("when following the subscription lifecycle", () => {
    it("should start the listener and end it without an error when the procedure returns", async () => {
      const { api, errors } = createApi();
      const calls: unknown[] = [];

      api.onCount.$listener.setPayload({ to: 2 }).listen(({ data }) => calls.push(data), {
        onStart: () => calls.push("start"),
        onEnd: ({ error }) => calls.push(error ?? "end"),
      });

      await vi.waitFor(() => expect(calls).toContain("end"));
      expect(calls).toStrictEqual(["start", 1, 2, "end"]);
      expect(errors).toHaveLength(0);
      expect(state.subscriptions[0].finished).toBeTrue();
    });

    it("should end the listener with the error of a failing procedure", async () => {
      const { api, errors } = createApi();
      const onEnd = vi.fn();

      api.onFail.$listener.setPayload({ code: "FORBIDDEN" }).listen(vi.fn(), { onEnd });

      await vi.waitFor(() => expect(onEnd).toHaveBeenCalledTimes(1));
      const [{ error }] = onEnd.mock.calls[0];
      expect(error).toBeInstanceOf(TrpcSocketError);
      expect(error).toMatchObject({ message: "Failed with FORBIDDEN", shape: { data: { code: "FORBIDDEN" } } });
      expect(errors).toStrictEqual([error]);
    });

    it("should start a new generator when listening after the end", async () => {
      const { api } = createApi();
      const firstEnd = vi.fn();
      const secondEnd = vi.fn();

      api.onCount.$listener.setPayload({ to: 1 }).listen(vi.fn(), { onEnd: firstEnd });
      await vi.waitFor(() => expect(firstEnd).toHaveBeenCalledTimes(1));
      api.onCount.$listener.setPayload({ to: 1 }).listen(vi.fn(), { onEnd: secondEnd });

      await vi.waitFor(() => expect(secondEnd).toHaveBeenCalledTimes(1));
      expect(state.subscriptions).toHaveLength(2);
      expect(state.subscriptions.every(({ finished }) => finished)).toBeTrue();
    });
  });

  describe("when using a transformer", () => {
    let transformerServer = createE2ESseServer(createSubscriptionsTransformerRouter(state));

    beforeEach(async () => {
      transformerServer = createE2ESseServer(createSubscriptionsTransformerRouter(state));
      url = await transformerServer.startServer();
    });

    afterEach(async () => {
      await Promise.all(sockets.map((socket) => socket.disconnect()));
      await transformerServer.stopServer();
    });

    it("should send and receive dates and sets", async () => {
      const socket = new Socket({ url, adapter: TrpcSseAdapter({ transformer: superjson }) });
      sockets.push(socket);
      const api = createSocketSdk<typeof socket, TrpcSocketSchema<SubscriptionsTransformerRouter>>(socket, {
        camelCaseToKebabCase: false,
      });
      const callback = vi.fn();

      const stop = api.onDate.$listener.setPayload({ since: new Date("2024-01-01T00:00:00.000Z") }).listen(callback);

      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      const [{ data, extra }] = callback.mock.calls[0];
      expect(data).toStrictEqual({ at: new Date("2024-01-01T00:00:01.000Z"), tags: new Set(["a"]) });
      expect(extra.eventId).toBe("1");
      expect(state.subscriptions[0].input).toStrictEqual({ since: new Date("2024-01-01T00:00:00.000Z") });

      stop();
      await vi.waitFor(() => expect(state.subscriptions[0].finished).toBeTrue());
    });
  });
});
