/**
 * @vitest-environment node
 */
import { Socket } from "@hyper-fetch/sockets";
import type { DocumentNode } from "graphql";
import gql from "graphql-tag";

import type { GraphqlWsAdapterOptionsType, GraphqlWsExtraType } from "../../src";
import { GraphqlSubscriptionError, GraphqlWsAdapter } from "../../src";
import type { Message, ServerState } from "./e2e.graphql-ws-server";
import { createE2EGraphqlWsServer, createServerState } from "./e2e.graphql-ws-server";

/** The decoration graphql-codegen and gql.tada add to documents */
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

const WhoAmIDocument = gql`
  subscription WhoAmI {
    whoAmI
  }
` as TypedDocument<{ whoAmI: string | null }, { [key: string]: never }>;

describe("Graphql Ws Adapter [ E2E ]", () => {
  let state: ServerState = createServerState();
  let server = createE2EGraphqlWsServer(state);
  let url = "";
  const sockets: Socket<ReturnType<typeof GraphqlWsAdapter>>[] = [];

  const createSocket = (adapterOptions?: GraphqlWsAdapterOptionsType, socketUrl = url) => {
    const socket = new Socket({ url: socketUrl, adapter: GraphqlWsAdapter(), adapterOptions, reconnectTime: 10 });
    sockets.push(socket);
    const errors: Error[] = [];
    socket.onError(({ error }) => {
      errors.push(error as Error);
    });
    const onMessage = socket.createListener()({ topic: "OnMessage", options: { document: OnMessageDocument } });
    const countdown = socket.createListener()({ topic: "Countdown", options: { document: CountdownDocument } });
    const whoAmI = socket.createListener()({ topic: "WhoAmI", options: { document: WhoAmIDocument } });
    return { socket, errors, onMessage, countdown, whoAmI };
  };

  const publish = (id: string, room: string, text: string) => state.publish({ id, room, text });
  const waitForSubscriptions = async (count: number) => {
    await vi.waitFor(() => expect(state.active("onMessage")).toHaveLength(count));
  };

  beforeEach(async () => {
    state = createServerState();
    server = createE2EGraphqlWsServer(state);
    url = await server.startServer();
  });

  afterEach(async () => {
    await Promise.all(sockets.map((socket) => socket.disconnect()));
    sockets.length = 0;
    await server.stopServer();
  });

  describe("when subscribing", () => {
    it("should receive the events of the variables", async () => {
      const { onMessage, errors } = createSocket();
      const callback = vi.fn<(event: { data: unknown; extra: GraphqlWsExtraType }) => void>();

      onMessage.listen(callback, { payload: { room: "a" } });
      await waitForSubscriptions(1);
      publish("1", "b", "other room");
      publish("2", "a", "hello");

      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(callback).toHaveBeenCalledWith({
        data: { onMessage: { id: "2", text: "hello" } },
        extra: { errors: undefined, extensions: {}, payload: { room: "a" } },
      });
      expect(errors).toStrictEqual([]);
    });

    it("should share one server subscription between the listeners of the same variables", async () => {
      const { onMessage } = createSocket();
      const first = vi.fn();
      const second = vi.fn();

      const stopFirst = onMessage.setPayload({ room: "a" }).listen(first);
      const stopSecond = onMessage.setPayload({ room: "a" }).listen(second);
      await waitForSubscriptions(1);
      publish("1", "a", "hello");
      await vi.waitFor(() => expect(second).toHaveBeenCalledTimes(1));

      expect(first).toHaveBeenCalledTimes(1);
      expect(state.subscriptions).toHaveLength(1);

      stopFirst();
      stopSecond();
      await waitForSubscriptions(0);
    });

    it("should stop the server subscription when the listener stops", async () => {
      const { onMessage } = createSocket();

      const stop = onMessage.setPayload({ room: "a" }).listen(vi.fn());
      await waitForSubscriptions(1);
      stop();

      await waitForSubscriptions(0);
      expect(state.subscriptions[0].finished).toBeTrue();
    });

    it("should end the listener when the server completes the subscription", async () => {
      const { countdown, errors } = createSocket();
      const callback = vi.fn();
      const onEnd = vi.fn();

      countdown.setPayload({ from: 3 }).listen(({ data }) => callback(data), { onEnd });

      await vi.waitFor(() => expect(onEnd).toHaveBeenCalledWith({ topic: "Countdown", error: null }));
      expect(callback.mock.calls.map(([data]) => data)).toStrictEqual([
        { countdown: 3 },
        { countdown: 2 },
        { countdown: 1 },
      ]);
      expect(errors).toStrictEqual([]);
    });

    it("should end the listener with the validation errors of the document", async () => {
      const { socket, errors } = createSocket();
      const onEnd = vi.fn();

      socket.createListener()({ topic: "subscription { unknownField }" }).listen(vi.fn(), { onEnd });

      await vi.waitFor(() => expect(onEnd).toHaveBeenCalledTimes(1));
      const [{ error }] = onEnd.mock.calls[0];
      expect(error).toBeInstanceOf(GraphqlSubscriptionError);
      expect(error.errors[0].message).toBe('Cannot query field "unknownField" on type "Subscription".');
      expect(errors).toStrictEqual([error]);
      expect(socket.adapter.connected).toBeTrue();
    });

    it("should deliver the execution errors of an event with it", async () => {
      const { socket, errors } = createSocket();
      const callback = vi.fn<(event: { data: unknown; extra: GraphqlWsExtraType }) => void>();

      socket.createListener()({ topic: "subscription Failing { failing }" }).listen(callback);

      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      const [{ data, extra }] = callback.mock.calls[0];
      expect(data).toStrictEqual({ failing: null });
      expect(extra.errors).toStrictEqual([
        { message: "Could not resolve the event", locations: [{ line: 1, column: 24 }], path: ["failing"] },
      ]);
      expect(errors).toStrictEqual([]);
    });
  });

  describe("when sending connection params", () => {
    it("should pass the connection params to the server context", async () => {
      const { whoAmI } = createSocket({ connectionParams: { token: "ann" } });
      const callback = vi.fn();

      whoAmI.listen(({ data }) => callback(data));

      await vi.waitFor(() => expect(callback).toHaveBeenCalledWith({ whoAmI: "ann" }));
      expect(state.connectionParams).toStrictEqual([{ token: "ann" }]);
    });

    it("should refresh the connection params when the server forbids the connection", async () => {
      await server.stopServer();
      state = createServerState();
      server = createE2EGraphqlWsServer(state, {
        onConnect: (ctx) => ctx.connectionParams?.token === "fresh",
      });
      url = await server.startServer();
      const tokens = ["expired", "fresh"];
      const { whoAmI, errors } = createSocket({ connectionParams: () => ({ token: tokens.shift() ?? "fresh" }) });
      const callback = vi.fn();

      whoAmI.listen(({ data }) => callback(data));

      await vi.waitFor(() => expect(callback).toHaveBeenCalledWith({ whoAmI: "fresh" }));
      expect(state.connectionParams).toStrictEqual([{ token: "expired" }, { token: "fresh" }]);
      expect(errors.map(({ message }) => message)).toStrictEqual([
        "The server closed the connection with 4403: Forbidden",
      ]);
    });
  });

  describe("when the connection drops", () => {
    it("should subscribe again and keep receiving after a server restart", async () => {
      const { socket, onMessage } = createSocket();
      const callback = vi.fn();
      const reconnected = vi.fn();
      onMessage.setPayload({ room: "a" }).listen(({ data }) => callback(data));
      await waitForSubscriptions(1);
      socket.onConnected(reconnected);

      server.dropConnections(1012, "Service Restart");
      await vi.waitFor(() => expect(reconnected).toHaveBeenCalledTimes(1));
      await waitForSubscriptions(1);
      publish("1", "a", "after restart");

      await vi.waitFor(() => expect(callback).toHaveBeenCalledWith({ onMessage: { id: "1", text: "after restart" } }));
      expect(state.subscriptions).toHaveLength(2);
      expect(state.subscriptions[0].finished).toBeTrue();
    });

    it("should come back when the server was down", async () => {
      const port = new URL(url).port;
      const { socket, onMessage } = createSocket();
      const callback = vi.fn();
      onMessage.setPayload({ room: "a" }).listen(({ data }) => callback(data));
      await waitForSubscriptions(1);

      await server.stopServer();
      await vi.waitFor(() => expect(socket.adapter.connected).toBeFalse());
      state = createServerState();
      server = createE2EGraphqlWsServer(state);
      await server.startServer(Number(port));

      await waitForSubscriptions(1);
      publish("1", "a", "back");
      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    });

    it("should stay closed after the server closes with 4401", async () => {
      const { socket } = createSocket();
      await vi.waitFor(() => expect(socket.adapter.connected).toBeTrue());

      server.dropConnections(4401, "Unauthorized");
      await vi.waitFor(() => expect(socket.adapter.connected).toBeFalse());
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      expect(server.clients).toBe(0);
      expect(socket.adapter.connecting).toBeFalse();
    });
  });

  describe("when the connection is lazy", () => {
    it("should hold a connection only while there are subscriptions", async () => {
      const { onMessage, socket } = createSocket({ lazy: true });
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
      expect(server.clients).toBe(0);

      const stop = onMessage.setPayload({ room: "a" }).listen(vi.fn());
      await waitForSubscriptions(1);
      expect(server.clients).toBe(1);

      stop();
      await vi.waitFor(() => expect(server.clients).toBe(0));
      expect(socket.adapter.connected).toBeFalse();
    });
  });

  describe("when keeping the connection alive", () => {
    it("should keep a connection the server pings", async () => {
      await server.stopServer();
      state = createServerState();
      server = createE2EGraphqlWsServer(state, {}, { keepAlive: 20 });
      url = await server.startServer();
      const { socket, onMessage } = createSocket();
      const callback = vi.fn();
      onMessage.setPayload({ room: "a" }).listen(callback);
      await waitForSubscriptions(1);

      await new Promise((resolve) => {
        setTimeout(resolve, 150);
      });
      publish("1", "a", "still here");

      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(socket.adapter.reconnectionAttempts).toBe(0);
    });

    it("should get pongs for its own pings", async () => {
      const { socket, onMessage } = createSocket({ keepAlive: { enabled: true, intervalMs: 20, pongTimeoutMs: 100 } });
      const disconnected = vi.fn();
      socket.onDisconnected(disconnected);
      const callback = vi.fn();
      onMessage.setPayload({ room: "a" }).listen(callback);
      await waitForSubscriptions(1);

      await new Promise((resolve) => {
        setTimeout(resolve, 200);
      });
      publish("1", "a", "alive");

      await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
      expect(disconnected).not.toHaveBeenCalled();
    });
  });
});
