/**
 * @vitest-environment node
 */
import { Socket, createSocketSdk } from "@hyper-fetch/sockets";
import superjson from "superjson";

import type { TrpcSocketExtraType, TrpcSocketSchema, TrpcWebsocketAdapterOptionsType } from "../../src";
import { TrpcSocketError, TrpcWebsocketAdapter } from "../../src";
import type {
  Message,
  ServerState,
  SubscriptionsRouter,
  SubscriptionsTransformerRouter,
} from "./e2e.trpc-subscriptions-server";
import {
  createE2EWebsocketServer,
  createServerState,
  createSubscriptionsRouter,
  createSubscriptionsTransformerRouter,
} from "./e2e.trpc-subscriptions-server";

type Event<T> = { data: T; extra: TrpcSocketExtraType };

describe("Trpc Websocket Adapter [ E2E ]", () => {
  let state: ServerState = createServerState();
  let server = createE2EWebsocketServer(createSubscriptionsRouter(state));
  let url = "";
  const sockets: Socket<ReturnType<typeof TrpcWebsocketAdapter>>[] = [];

  const createApi = ({
    adapterOptions,
    transformer,
  }: { adapterOptions?: TrpcWebsocketAdapterOptionsType; transformer?: typeof superjson } = {}) => {
    const socket = new Socket({
      url,
      adapter: TrpcWebsocketAdapter({ transformer }),
      adapterOptions,
      reconnectTime: 10,
    });
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
    server = createE2EWebsocketServer(createSubscriptionsRouter(state));
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

      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback).toHaveBeenCalledWith({
        data: { room: "a", text: "hello" },
        extra: { eventId: "1", payload: { room: "a" } },
      });
      expect(errors).toHaveLength(0);
    });

    it("should receive events that are not tracked", async () => {
      const { api } = createApi();
      const callback = vi.fn<(event: Event<Message>) => void>();

      api.chat.onAny.$listener.listen(callback);
      await waitForSubscriptions("chat.onAny", 1);
      state.publish({ id: "1", room: "general", text: "hi" });

      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback.mock.calls[0][0].extra).toStrictEqual({ eventId: null, payload: undefined });
      expect(state.subscriptions[0].input).toBeUndefined();
    });

    it("should start the subscriptions once the connection opens", async () => {
      const { socket, api } = createApi({ adapterOptions: { autoConnect: false } });
      api.chat.onMessage.$listener.setPayload({ room: "a" }).listen(vi.fn());
      api.onIdle.$listener.listen(vi.fn());

      expect(state.subscriptions).toHaveLength(0);
      await socket.connect();

      await waitForSubscriptions("chat.onMessage", 1);
      await waitForSubscriptions("onIdle", 1);
    });

    it("should share one server subscription between the listeners of an input", async () => {
      const { api } = createApi();
      const first = vi.fn();
      const second = vi.fn();

      const stopFirst = api.chat.onMessage.$listener.setPayload({ room: "a" }).listen(first);
      const stopSecond = api.chat.onMessage.$listener.listen(second, { payload: { room: "a" } });
      await waitForSubscriptions("chat.onMessage", 1);
      publish("1", "a", "hello");
      await vi.waitFor(() => expect(second).toHaveBeenCalledTimes(1));

      expect(first).toHaveBeenCalledTimes(1);
      expect(state.subscriptions).toHaveLength(1);

      stopFirst();
      publish("2", "a", "again");
      await vi.waitFor(() => expect(second).toHaveBeenCalledTimes(2));
      expect(state.active("chat.onMessage")).toHaveLength(1);

      stopSecond();
      await waitForSubscriptions("chat.onMessage", 0);
      expect(state.subscriptions[0].finished).toBeTrue();
    });

    it("should keep the events of different inputs apart", async () => {
      const { api } = createApi();
      const roomA = vi.fn();
      const roomB = vi.fn();

      api.chat.onMessage.$listener.setPayload({ room: "a" }).listen(({ data }) => roomA(data));
      api.chat.onMessage.$listener.setPayload({ room: "b" }).listen(({ data }) => roomB(data));
      await waitForSubscriptions("chat.onMessage", 2);
      publish("1", "b", "for b");
      publish("2", "a", "for a");

      await vi.waitFor(() => expect(roomA).toHaveBeenCalledTimes(1));
      await vi.waitFor(() => expect(roomB).toHaveBeenCalledTimes(1));
      expect(roomA).toHaveBeenCalledWith({ room: "a", text: "for a" });
      expect(roomB).toHaveBeenCalledWith({ room: "b", text: "for b" });
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
      api.chat.onMessage.$listener.setPayload({ room: "a" }).listen(vi.fn());
      await waitForSubscriptions("onIdle", 1);
      await waitForSubscriptions("chat.onMessage", 1);

      await socket.disconnect();

      await vi.waitFor(() => expect(state.active()).toHaveLength(0));
    });
  });

  describe("when the connection comes back", () => {
    it("should resume from the last event after the connection was lost", async () => {
      const { api, socket } = createApi();
      const callback = vi.fn<(event: Event<Omit<Message, "id">>) => void>();
      api.chat.onMessage.$listener.setPayload({ room: "a" }).listen(callback);
      await waitForSubscriptions("chat.onMessage", 1);
      publish("7", "a", "hello");
      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));

      server.dropConnections();

      await vi.waitFor(() => expect(state.subscriptions).toHaveLength(2));
      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(2));
      expect(state.subscriptions[0].finished).toBeTrue();
      expect(state.subscriptions[1].input).toStrictEqual({ room: "a", lastEventId: "7" });
      expect(callback).toHaveBeenLastCalledWith({
        data: { room: "a", text: "after 7" },
        extra: { eventId: "7-resumed", payload: { room: "a" } },
      });
      expect(socket.adapter.connected).toBeTrue();
    });

    it("should move to a new connection when the server asks to reconnect", async () => {
      const { api, errors } = createApi();
      const callback = vi.fn();
      api.chat.onMessage.$listener.setPayload({ room: "a" }).listen(callback);
      await waitForSubscriptions("chat.onMessage", 1);
      publish("3", "a", "hello");
      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));

      server.broadcastReconnect();

      await vi.waitFor(() => expect(state.subscriptions).toHaveLength(2));
      await waitForSubscriptions("chat.onMessage", 1);
      expect(state.subscriptions[1].input).toStrictEqual({ room: "a", lastEventId: "3" });
      expect(errors).toHaveLength(0);
    });
  });

  describe("when the server ends a subscription", () => {
    it("should receive every event of a subscription that returns", async () => {
      const { api, errors } = createApi();
      const callback = vi.fn();

      const stop = api.onCount.$listener.setPayload({ to: 3 }).listen(({ data }) => callback(data));

      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(3));
      await vi.waitFor(() => expect(state.subscriptions[0].finished).toBeTrue());
      expect(callback.mock.calls).toStrictEqual([[1], [2], [3]]);
      stop();
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
        payload: { code: "FORBIDDEN" },
        shape: { data: { code: "FORBIDDEN", httpStatus: 403, path: "onFail" } },
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

    it("should report an unknown procedure", async () => {
      const { socket, errors } = createApi();

      socket.createListener<unknown>()({ topic: "missing/procedure" }).listen(vi.fn());

      await vi.waitFor(() => expect(errors).toHaveLength(1));
      expect(errors[0]).toMatchObject({ topic: "missing/procedure", shape: { data: { code: "NOT_FOUND" } } });
    });
  });

  describe("when sending connection params", () => {
    it("should pass them to createContext", async () => {
      const { api } = createApi({ adapterOptions: { connectionParams: { token: "secret" } } });

      api.chat.onMessage.$listener.setPayload({ room: "a" }).listen(vi.fn());

      await waitForSubscriptions("chat.onMessage", 1);
      expect(state.contexts).toStrictEqual([{ connectionParams: { token: "secret" } }]);
    });

    it("should send no connection params without the option", async () => {
      const { api } = createApi();

      api.chat.onMessage.$listener.setPayload({ room: "a" }).listen(vi.fn());

      await waitForSubscriptions("chat.onMessage", 1);
      expect(state.contexts).toStrictEqual([{ connectionParams: null }]);
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
    let transformerServer = createE2EWebsocketServer(createSubscriptionsTransformerRouter(state));

    beforeEach(async () => {
      transformerServer = createE2EWebsocketServer(createSubscriptionsTransformerRouter(state));
      url = await transformerServer.startServer();
    });

    afterEach(async () => {
      await Promise.all(sockets.map((socket) => socket.disconnect()));
      await transformerServer.stopServer();
    });

    it("should send and receive dates and sets", async () => {
      const socket = new Socket({ url, adapter: TrpcWebsocketAdapter({ transformer: superjson }) });
      sockets.push(socket);
      const api = createSocketSdk<typeof socket, TrpcSocketSchema<SubscriptionsTransformerRouter>>(socket, {
        camelCaseToKebabCase: false,
      });
      const callback = vi.fn();

      const stop = api.onDate.$listener.setPayload({ since: new Date("2024-01-01T00:00:00.000Z") }).listen(callback);

      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      const [{ data, extra }] = callback.mock.calls[0];
      expect(data.at).toBeInstanceOf(Date);
      expect(data).toStrictEqual({ at: new Date("2024-01-01T00:00:01.000Z"), tags: new Set(["a"]) });
      expect(extra.eventId).toBe("1");
      expect(state.subscriptions[0].input).toStrictEqual({ since: new Date("2024-01-01T00:00:00.000Z") });

      stop();
      await vi.waitFor(() => expect(state.subscriptions[0].finished).toBeTrue());
    });
  });
});
