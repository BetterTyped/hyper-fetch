import { AppManager } from "@hyper-fetch/core";
import { Socket } from "@hyper-fetch/sockets";

import type { GraphqlWsAdapterOptionsType } from "../../../src";
import { GRAPHQL_TRANSPORT_WS_PROTOCOL, GraphqlWsAdapter, shouldReconnectGraphqlWs } from "../../../src";
import {
  ControlledWebSocket,
  acknowledgeWebSocket,
  flushPromises,
  installControlledWebSocket,
  openWebSocket,
  uninstallControlledWebSocket,
  waitForWebSocket,
} from "../../utils/controlled-websocket";

const url = "ws://localhost:4000/graphql";

describe("Graphql Ws Adapter [ Connection ]", () => {
  let appManager = new AppManager();
  // The lower end of the reconnection jitter - every delay is exactly `reconnectTime`
  let random = vi.spyOn(Math, "random");

  const createSocket = (
    adapterOptions?: GraphqlWsAdapterOptionsType,
    {
      reconnectTime = 100,
      connectionTimeout = 300,
      shouldReconnect,
    }: {
      reconnectTime?: number;
      connectionTimeout?: number;
      shouldReconnect?: ConstructorParameters<typeof Socket>[0]["shouldReconnect"];
    } = {},
  ) => {
    const socket = new Socket({
      url,
      adapter: GraphqlWsAdapter(),
      adapterOptions: adapterOptions ?? { autoConnect: false },
      reconnectTime,
      connectionTimeout,
      shouldReconnect,
      appManager: () => appManager,
    });
    const errors: Error[] = [];
    socket.onError(({ error }) => {
      errors.push(error as Error);
    });
    const onTick = socket.createListener<{ tick: number }>()({ topic: "subscription OnTick { tick }" });
    return { socket, errors, onTick };
  };

  let setup = createSocket();

  beforeEach(() => {
    random = vi.spyOn(Math, "random").mockReturnValue(0);
    installControlledWebSocket();
    appManager = new AppManager();
    setup = createSocket();
  });

  afterEach(async () => {
    await setup.socket.disconnect();
    vi.useRealTimers();
    uninstallControlledWebSocket();
    random.mockRestore();
  });

  describe("when connecting", () => {
    it("should connect on creation by default", async () => {
      setup = createSocket({});

      const ws = await waitForWebSocket(1);

      expect(ws.url).toBe(url);
      expect(setup.socket.adapter.connecting).toBeTrue();
    });

    it("should ask for the graphql-transport-ws subprotocol", async () => {
      setup.socket.connect();

      const ws = await waitForWebSocket(1);

      expect(ws.protocols).toBe(GRAPHQL_TRANSPORT_WS_PROTOCOL);
      expect(GRAPHQL_TRANSPORT_WS_PROTOCOL).toBe("graphql-transport-ws");
    });

    it("should add the query params of the socket to the url", async () => {
      setup = createSocket();
      setup.socket.setQueryParams({ client: "web" });
      setup.socket.connect();

      const ws = await waitForWebSocket(1);

      expect(ws.url).toBe(`${url}?client=web`);
    });

    it("should use the WebSocket class from the options", async () => {
      class CustomWebSocket extends ControlledWebSocket {}
      setup = createSocket({ autoConnect: false, WebSocket: CustomWebSocket as unknown as typeof WebSocket });
      setup.socket.connect();

      const ws = await waitForWebSocket(1);

      expect(ws).toBeInstanceOf(CustomWebSocket);
    });

    it("should send connection_init without a payload when there are no connection params", async () => {
      setup.socket.connect();

      const ws = await openWebSocket();

      expect(ws.messages).toStrictEqual([{ type: "connection_init" }]);
    });

    it("should stay connecting until the server acknowledges the connection", async () => {
      const connected = vi.fn();
      setup.socket.onConnected(connected);
      setup.socket.connect();
      const ws = await openWebSocket();

      expect(setup.socket.adapter.connected).toBeFalse();
      expect(setup.socket.adapter.connecting).toBeTrue();
      expect(connected).not.toHaveBeenCalled();

      ws.serverAck({ server: "yoga" });
      await flushPromises();

      expect(setup.socket.adapter.connected).toBeTrue();
      expect(connected).toHaveBeenCalledTimes(1);
    });

    it("should resolve connect() once the connection is acknowledged", async () => {
      const resolved = vi.fn();
      setup.socket.connect().then(resolved);
      const ws = await openWebSocket();
      await flushPromises();

      expect(resolved).not.toHaveBeenCalled();
      ws.serverAck();
      await flushPromises();

      expect(resolved).toHaveBeenCalledTimes(1);
    });

    it("should ignore a repeated acknowledgement", async () => {
      const connected = vi.fn();
      setup.socket.onConnected(connected);
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();
      setup.onTick.listen(vi.fn());

      ws.serverAck();
      await flushPromises();

      expect(connected).toHaveBeenCalledTimes(1);
      expect(ws.subscriptions).toHaveLength(1);
    });

    it("should time out when the server does not acknowledge in time", async () => {
      vi.useFakeTimers();
      setup.socket.connect();
      const ws = await openWebSocket();

      await vi.advanceTimersByTimeAsync(300);

      expect(setup.socket.adapter.connected).toBeFalse();
      expect(ws.closeCalls).toStrictEqual([{ code: 1000, reason: "Normal Closure" }]);
      expect(setup.errors.map(({ message }) => message)).toStrictEqual([
        "Connection timeout - no connection within 300ms",
      ]);

      await vi.advanceTimersByTimeAsync(100);
      expect(ControlledWebSocket.instances).toHaveLength(2);
    });
  });

  it("should connect without adapter options", async () => {
    setup = { ...setup, socket: new Socket({ url, adapter: GraphqlWsAdapter(), appManager: () => appManager }) };

    const ws = await acknowledgeWebSocket(1);

    expect(ws.messages).toStrictEqual([{ type: "connection_init" }]);
    expect(setup.socket.adapter.connected).toBeTrue();
  });

  it("should not send anything when a connected callback closes the connection", async () => {
    const listener = setup.onTick;
    listener.listen(vi.fn());
    setup.socket.onConnected(() => {
      setup.socket.disconnect();
    });
    setup.socket.connect();

    const ws = await acknowledgeWebSocket();

    expect(ws.subscriptions).toHaveLength(0);
    expect(setup.socket.adapter.connected).toBeFalse();
  });

  it("should ignore a transport that opens after its attempt was closed", async () => {
    setup.socket.connect();
    const ws = await waitForWebSocket(1);
    // Some runtimes throw when closing a transport that never connected - it may still open later
    vi.spyOn(ws, "close").mockImplementation(() => {
      throw new Error("WebSocket was closed before the connection was established");
    });

    await setup.socket.disconnect();
    ws.serverOpen();
    await flushPromises();

    expect(ws.sent).toStrictEqual([]);
    expect(setup.socket.adapter.connecting).toBeFalse();
  });

  it("should replace the connection on reconnect and send the subscriptions again", async () => {
    setup.onTick.listen(vi.fn());
    setup.socket.connect();
    const ws = await acknowledgeWebSocket();

    setup.socket.reconnect();
    const next = await acknowledgeWebSocket(2);

    expect(ws.closeCalls).toStrictEqual([{ code: 1000, reason: "Normal Closure" }]);
    expect(next.subscriptions.map(({ id }) => id)).toStrictEqual(["2"]);
  });

  describe("when sending connection params", () => {
    it("should send the connection params with connection_init", async () => {
      setup = createSocket({ autoConnect: false, connectionParams: { token: "abc" } });
      setup.socket.connect();

      const ws = await openWebSocket();

      expect(ws.messages).toStrictEqual([{ type: "connection_init", payload: { token: "abc" } }]);
    });

    it("should run a connection params function on every connection attempt", async () => {
      vi.useFakeTimers();
      let token = 0;
      const connectionParams = vi.fn(() => {
        token += 1;
        return { token };
      });
      setup = createSocket({ autoConnect: false, connectionParams });
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      ws.serverClose({ code: 1006 });
      await vi.advanceTimersByTimeAsync(100);
      const next = await openWebSocket(2);

      expect(connectionParams).toHaveBeenCalledTimes(2);
      expect(ws.messages[0]).toStrictEqual({ type: "connection_init", payload: { token: 1 } });
      expect(next.messages[0]).toStrictEqual({ type: "connection_init", payload: { token: 2 } });
    });

    it("should wait for async connection params", async () => {
      let resolveParams: (params: { token: string }) => void = () => null;
      setup = createSocket({
        autoConnect: false,
        connectionParams: () =>
          new Promise((resolve) => {
            resolveParams = resolve;
          }),
      });
      setup.socket.connect();
      const ws = await openWebSocket();

      expect(ws.messages).toStrictEqual([]);
      resolveParams({ token: "late" });
      await flushPromises();

      expect(ws.messages).toStrictEqual([{ type: "connection_init", payload: { token: "late" } }]);
    });

    it("should send no payload when the connection params function returns nothing", async () => {
      // eslint-disable-next-line unicorn/no-useless-undefined -- a function that returns no params is the case
      setup = createSocket({ autoConnect: false, connectionParams: () => undefined });
      setup.socket.connect();

      const ws = await openWebSocket();

      expect(ws.messages).toStrictEqual([{ type: "connection_init" }]);
    });

    it("should close with 4005 and not retry when the connection params fail", async () => {
      vi.useFakeTimers();
      const failure = new Error("No token");
      setup = createSocket({
        autoConnect: false,
        connectionParams: () => Promise.reject(failure),
      });
      setup.socket.connect();
      const ws = await openWebSocket();
      await flushPromises();

      expect(ws.closeCalls).toStrictEqual([{ code: 4005, reason: "No token" }]);
      expect(setup.errors).toHaveLength(1);
      expect(setup.errors[0].message).toBe("Could not get the connection params");
      expect(setup.errors[0].cause).toBe(failure);

      await vi.advanceTimersByTimeAsync(1000);
      expect(ControlledWebSocket.instances).toHaveLength(1);
    });

    it("should report connection params rejected with a value that is not an error", async () => {
      // eslint-disable-next-line prefer-promise-reject-errors -- a rejection that is not an Error is the case
      setup = createSocket({ autoConnect: false, connectionParams: () => Promise.reject("No session") });
      setup.socket.connect();
      const ws = await openWebSocket();
      await flushPromises();

      expect(ws.closeCalls).toStrictEqual([{ code: 4005, reason: "No session" }]);
      expect((setup.errors[0].cause as Error).message).toBe("No session");
    });

    it("should drop the connection params of an attempt that is gone", async () => {
      let resolveParams: (params: { token: string }) => void = () => null;
      setup = createSocket({
        autoConnect: false,
        connectionParams: () =>
          new Promise((resolve) => {
            resolveParams = resolve;
          }),
      });
      setup.socket.connect();
      const ws = await openWebSocket();

      await setup.socket.disconnect();
      resolveParams({ token: "late" });
      await flushPromises();

      expect(ws.sent).toStrictEqual([]);
    });

    it("should not report failing connection params of an attempt that is gone", async () => {
      let rejectParams: (error: Error) => void = () => null;
      setup = createSocket({
        autoConnect: false,
        connectionParams: () =>
          new Promise((_, reject) => {
            rejectParams = reject;
          }),
      });
      setup.socket.connect();
      await openWebSocket();

      await setup.socket.disconnect();
      rejectParams(new Error("Too late"));
      await flushPromises();

      expect(setup.errors).toStrictEqual([]);
    });

    it("should use the connection params set by an onConnect interceptor", async () => {
      setup.socket.onConnect(({ connection }) => ({
        ...connection,
        adapterOptions: { ...connection.adapterOptions, connectionParams: { token: "fresh" } },
      }));
      setup.socket.connect();

      const ws = await openWebSocket();

      expect(ws.url).toBe(url);
      expect(ws.messages).toStrictEqual([{ type: "connection_init", payload: { token: "fresh" } }]);
    });
  });

  describe("when the server breaks the protocol", () => {
    it.each([
      ["a frame that is not JSON", "not json"],
      ["a message without a type", JSON.stringify({ id: "1" })],
      ["an unknown message type", JSON.stringify({ type: "data", id: "1" })],
      ["a subscribe message", JSON.stringify({ type: "subscribe", id: "1", payload: { query: "{ a }" } })],
      ["next without an id", JSON.stringify({ type: "next", payload: {} })],
      ["next without a payload", JSON.stringify({ type: "next", id: "1" })],
      ["error without GraphQL errors", JSON.stringify({ type: "error", id: "1", payload: [] })],
      ["complete with an empty id", JSON.stringify({ type: "complete", id: "" })],
      ["a ping with a string payload", JSON.stringify({ type: "ping", payload: "hi" })],
      ["a binary frame", new ArrayBuffer(1)],
    ])("should close with 4004 on %s and not retry", async (_, frame) => {
      vi.useFakeTimers();
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      ws.serverSend(frame);

      expect(ws.closeCalls[0].code).toBe(4004);
      // The client closed it, so only the reason is reported - not the close that follows
      expect(setup.errors.map(({ message }) => message)).toStrictEqual([
        "Received a malformed GraphQL over WebSocket message",
      ]);
      expect(setup.socket.adapter.connected).toBeFalse();

      await vi.advanceTimersByTimeAsync(1000);
      expect(ControlledWebSocket.instances).toHaveLength(1);
    });

    it("should close with 4004 when the first message is not the acknowledgement", async () => {
      setup.socket.connect();
      const ws = await openWebSocket();

      ws.serverNext("1", { data: {} });

      expect(ws.closeCalls).toStrictEqual([{ code: 4004, reason: "First message cannot be of type next" }]);
    });

    it("should cut a close reason that is too long", async () => {
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      ws.serverMessage({ type: "x".repeat(200) });

      expect(ws.closeCalls).toStrictEqual([{ code: 4004, reason: "Bad response" }]);
    });
  });

  describe("when the connection closes", () => {
    it.each([4500, 4005, 4400, 4004, 4401, 4406, 4409, 4429, 1002, 1003, 1007, 1008, 1011])(
      "should not reconnect after %i",
      async (code) => {
        vi.useFakeTimers();
        setup.socket.connect();
        const ws = await acknowledgeWebSocket();

        ws.serverClose({ code, reason: "Closed" });
        await vi.advanceTimersByTimeAsync(1000);

        expect(ControlledWebSocket.instances).toHaveLength(1);
        expect(setup.socket.adapter.connected).toBeFalse();
      },
    );

    it.each([4403, 4408, 4504, 4499, 1001, 1005, 1006, 1012, 1013, 1014])("should reconnect after %i", async (code) => {
      vi.useFakeTimers();
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      ws.serverClose({ code });
      await vi.advanceTimersByTimeAsync(100);

      expect(ControlledWebSocket.instances).toHaveLength(2);
    });

    it("should stay closed after a normal closure", async () => {
      vi.useFakeTimers();
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      ws.serverClose({ code: 1000, wasClean: true });
      await vi.advanceTimersByTimeAsync(1000);

      expect(ControlledWebSocket.instances).toHaveLength(1);
    });

    it("should report the code and reason of a protocol close", async () => {
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      ws.serverClose({ code: 4401, reason: "Unauthorized" });

      expect(setup.errors.map(({ message }) => message)).toStrictEqual([
        "The server closed the connection with 4401: Unauthorized",
      ]);
    });

    it("should report a protocol close without a reason", async () => {
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      ws.serverClose({ code: 4400 });

      expect(setup.errors[0].message).toBe("The server closed the connection with 4400: no reason given");
    });

    it("should report the meaning of a standard close", async () => {
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      ws.serverClose({ code: 1006 });

      expect(setup.errors[0].message).toContain("closed abnormally");
    });

    it("should let the socket's shouldReconnect decide", async () => {
      vi.useFakeTimers();
      const shouldReconnect = vi.fn(() => true);
      setup = createSocket({ autoConnect: false }, { shouldReconnect });
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      ws.serverClose({ code: 4401, reason: "Unauthorized" });
      await vi.advanceTimersByTimeAsync(100);

      expect(shouldReconnect).toHaveBeenCalledWith({ code: 4401, reason: "Unauthorized" });
      expect(ControlledWebSocket.instances).toHaveLength(2);
    });

    it("should treat a failed handshake reported only with an error as an abnormal closure", async () => {
      vi.useFakeTimers();
      setup.socket.connect();
      const ws = await waitForWebSocket(1);

      ws.serverRefuseWithoutClose();
      await vi.advanceTimersByTimeAsync(100);

      expect(ControlledWebSocket.instances).toHaveLength(2);
    });

    it("should ignore an error of an open connection - its close follows", async () => {
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      ws.serverRefuseWithoutClose();

      expect(setup.socket.adapter.connected).toBeTrue();
      expect(setup.errors).toStrictEqual([]);
    });

    it("should close the transport with 1000 on disconnect", async () => {
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      await setup.socket.disconnect();

      expect(ws.closeCalls).toStrictEqual([{ code: 1000, reason: "Normal Closure" }]);
      expect(setup.errors).toStrictEqual([]);
    });

    it("should finish disconnecting when closing the transport throws", async () => {
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();
      vi.spyOn(ws, "close").mockImplementation(() => {
        throw new Error("Close failed");
      });

      await setup.socket.disconnect();

      expect(setup.socket.adapter.connected).toBeFalse();
      expect(setup.socket.adapter.forceClosed).toBeTrue();
    });
  });

  describe("when the server pings", () => {
    it("should answer with pong", async () => {
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      ws.serverMessage({ type: "ping" });

      expect(ws.messages.at(-1)).toStrictEqual({ type: "pong" });
    });

    it("should send the payload of the ping back", async () => {
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      ws.serverMessage({ type: "ping", payload: { at: 1 } });

      expect(ws.messages.at(-1)).toStrictEqual({ type: "pong", payload: { at: 1 } });
    });

    it("should answer a ping before the acknowledgement", async () => {
      setup.socket.connect();
      const ws = await openWebSocket();

      ws.serverMessage({ type: "ping" });

      expect(ws.messages).toStrictEqual([{ type: "connection_init" }, { type: "pong" }]);
      expect(setup.socket.adapter.connecting).toBeTrue();
    });

    it("should ignore a pong it did not ask for", async () => {
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      ws.serverMessage({ type: "pong" });

      expect(ws.messages).toStrictEqual([{ type: "connection_init" }]);
      expect(setup.errors).toStrictEqual([]);
    });
  });

  describe("when keeping the connection alive", () => {
    const keepAlive = { enabled: true, intervalMs: 1000, pongTimeoutMs: 500 };

    it("should not ping by default", async () => {
      vi.useFakeTimers();
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      await vi.advanceTimersByTimeAsync(60_000);

      expect(ws.messages).toStrictEqual([{ type: "connection_init" }]);
    });

    it("should ping a quiet connection", async () => {
      vi.useFakeTimers();
      setup = createSocket({ autoConnect: false, keepAlive });
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      await vi.advanceTimersByTimeAsync(999);
      expect(ws.messages.at(-1)).toStrictEqual({ type: "connection_init" });
      await vi.advanceTimersByTimeAsync(1);

      expect(ws.messages.at(-1)).toStrictEqual({ type: "ping" });
    });

    it("should use the default timings", async () => {
      vi.useFakeTimers();
      setup = createSocket({ autoConnect: false, keepAlive: { enabled: true } }, { connectionTimeout: 60_000 });
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      await vi.advanceTimersByTimeAsync(10_000);
      expect(ws.messages.at(-1)).toStrictEqual({ type: "ping" });
      await vi.advanceTimersByTimeAsync(4999);
      expect(setup.socket.adapter.connected).toBeTrue();
      await vi.advanceTimersByTimeAsync(1);

      expect(setup.socket.adapter.connected).toBeFalse();
    });

    it("should postpone the ping while messages arrive", async () => {
      vi.useFakeTimers();
      setup = createSocket({ autoConnect: false, keepAlive });
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      await vi.advanceTimersByTimeAsync(800);
      ws.serverMessage({ type: "pong" });
      await vi.advanceTimersByTimeAsync(800);

      expect(ws.messages).toStrictEqual([{ type: "connection_init" }]);
    });

    it("should reconnect when the pong does not arrive in time", async () => {
      vi.useFakeTimers();
      setup = createSocket({ autoConnect: false, keepAlive });
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      await vi.advanceTimersByTimeAsync(1500);

      expect(setup.socket.adapter.connected).toBeFalse();
      expect(ws.closeCalls).toHaveLength(1);
      expect(setup.errors.map(({ message }) => message)).toStrictEqual([
        "Keep-alive timeout - the server did not answer the ping in time",
      ]);
      await vi.advanceTimersByTimeAsync(100);
      expect(ControlledWebSocket.instances).toHaveLength(2);
    });

    it("should keep the connection when the pong arrives", async () => {
      vi.useFakeTimers();
      setup = createSocket({ autoConnect: false, keepAlive });
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      await vi.advanceTimersByTimeAsync(1000);
      ws.serverMessage({ type: "pong" });
      await vi.advanceTimersByTimeAsync(1000);

      expect(setup.socket.adapter.connected).toBeTrue();
      expect(ws.messages.filter(({ type }) => type === "ping")).toHaveLength(2);
    });

    it("should stop pinging after disconnect", async () => {
      vi.useFakeTimers();
      setup = createSocket({ autoConnect: false, keepAlive });
      setup.socket.connect();
      const ws = await acknowledgeWebSocket();

      await setup.socket.disconnect();
      await vi.advanceTimersByTimeAsync(5000);

      expect(ws.messages).toStrictEqual([{ type: "connection_init" }]);
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe("when the connection is lazy", () => {
    const lazy = { lazy: true } satisfies GraphqlWsAdapterOptionsType;

    it("should not connect without subscriptions, even with autoConnect", async () => {
      setup = createSocket({ ...lazy, autoConnect: true });
      await flushPromises();

      expect(ControlledWebSocket.instances).toHaveLength(0);
    });

    it("should connect when the first subscription starts", async () => {
      setup = createSocket(lazy);

      setup.onTick.listen(vi.fn());
      const ws = await acknowledgeWebSocket(1);

      expect(ws.subscriptions).toHaveLength(1);
    });

    it("should open one connection for many subscriptions", async () => {
      setup = createSocket(lazy);

      setup.onTick.listen(vi.fn());
      setup.socket.createListener()({ topic: "subscription { other }" }).listen(vi.fn());
      const ws = await acknowledgeWebSocket(1);

      expect(ControlledWebSocket.instances).toHaveLength(1);
      expect(ws.subscriptions).toHaveLength(2);
    });

    it("should close the connection when the last subscription stops", async () => {
      setup = createSocket(lazy);
      const stop = setup.onTick.listen(vi.fn());
      const ws = await acknowledgeWebSocket(1);

      stop();
      await flushPromises();

      expect(ws.messages.at(-1)).toStrictEqual({ id: "1", type: "complete" });
      expect(ws.closeCalls).toStrictEqual([{ code: 1000, reason: "Normal Closure" }]);
      expect(setup.socket.adapter.connected).toBeFalse();
    });

    it("should close the connection when the server ends the last subscription", async () => {
      setup = createSocket(lazy);
      setup.onTick.listen(vi.fn());
      const ws = await acknowledgeWebSocket(1);

      ws.serverComplete("1");
      await flushPromises();

      expect(ws.closeCalls).toHaveLength(1);
    });

    it("should keep the connection for lazyCloseTimeout and reuse it", async () => {
      vi.useFakeTimers();
      setup = createSocket({ ...lazy, lazyCloseTimeout: 1000 });
      const stop = setup.onTick.listen(vi.fn());
      const ws = await acknowledgeWebSocket(1);

      stop();
      await vi.advanceTimersByTimeAsync(999);
      setup.onTick.listen(vi.fn());
      await vi.advanceTimersByTimeAsync(5000);

      expect(ControlledWebSocket.instances).toHaveLength(1);
      expect(ws.closeCalls).toHaveLength(0);
      expect(ws.subscriptions.map(({ id }) => id)).toStrictEqual(["1", "2"]);
    });

    it("should close after lazyCloseTimeout", async () => {
      vi.useFakeTimers();
      setup = createSocket({ ...lazy, lazyCloseTimeout: 1000 });
      const stop = setup.onTick.listen(vi.fn());
      const ws = await acknowledgeWebSocket(1);

      stop();
      await vi.advanceTimersByTimeAsync(1000);

      expect(ws.closeCalls).toHaveLength(1);
    });

    it("should connect again for a subscription after the lazy close", async () => {
      setup = createSocket(lazy);
      const stop = setup.onTick.listen(vi.fn());
      await acknowledgeWebSocket(1);
      stop();
      await flushPromises();

      setup.onTick.listen(vi.fn());
      const next = await acknowledgeWebSocket(2);

      expect(next.subscriptions).toHaveLength(1);
    });

    it("should close a connection that is not acknowledged yet when its subscriptions stop", async () => {
      setup = createSocket(lazy);
      const stop = setup.onTick.listen(vi.fn());
      const ws = await openWebSocket(1);

      stop();
      await flushPromises();

      expect(ws.closeCalls).toHaveLength(1);
      expect(ws.subscriptions).toHaveLength(0);
    });

    it("should not reopen a connection closed by hand", async () => {
      setup = createSocket(lazy);
      setup.onTick.listen(vi.fn());
      await acknowledgeWebSocket(1);

      await setup.socket.disconnect();
      setup.socket.createListener()({ topic: "subscription { other }" }).listen(vi.fn());
      await flushPromises();

      expect(ControlledWebSocket.instances).toHaveLength(1);
    });

    it("should leave recovery to the reconnection while it retries", async () => {
      vi.useFakeTimers();
      setup = createSocket(lazy);
      setup.onTick.listen(vi.fn());
      const ws = await acknowledgeWebSocket(1);

      ws.serverClose({ code: 1006 });
      setup.socket.createListener()({ topic: "subscription { other }" }).listen(vi.fn());
      await flushPromises();
      expect(ControlledWebSocket.instances).toHaveLength(1);

      await vi.advanceTimersByTimeAsync(100);
      const next = await acknowledgeWebSocket(2);
      expect(next.subscriptions).toHaveLength(2);
    });

    it("should stop reconnecting when the last subscription stops while it retries", async () => {
      vi.useFakeTimers();
      setup = createSocket(lazy);
      const stop = setup.onTick.listen(vi.fn());
      const ws = await acknowledgeWebSocket(1);

      ws.serverClose({ code: 1006 });
      stop();
      await vi.advanceTimersByTimeAsync(1000);

      expect(ControlledWebSocket.instances).toHaveLength(1);
    });

    it("should open a lazy connection on reconnect without subscriptions", async () => {
      setup = createSocket(lazy);

      setup.socket.reconnect();
      const ws = await acknowledgeWebSocket(1);

      expect(setup.socket.adapter.connected).toBeTrue();
      expect(ws.subscriptions).toHaveLength(0);
    });

    it("should cancel a pending lazy close on disconnect and destroy", async () => {
      vi.useFakeTimers();
      setup = createSocket({ ...lazy, lazyCloseTimeout: 1000 });
      const stop = setup.onTick.listen(vi.fn());
      await acknowledgeWebSocket(1);

      stop();
      setup.socket.destroy();

      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe("when the environment can't connect", () => {
    it("should report a missing WebSocket", async () => {
      globalThis.WebSocket = undefined as unknown as typeof WebSocket;

      await setup.socket.connect();

      expect(setup.errors.map(({ message }) => message)).toStrictEqual([
        "WebSocket is not available in this environment",
      ]);
      expect(setup.socket.adapter.connecting).toBeFalse();
    });

    it("should report a WebSocket constructor that throws", async () => {
      ControlledWebSocket.constructorError = new SyntaxError("Invalid url");

      await setup.socket.connect();

      expect(setup.errors.map(({ message }) => message)).toStrictEqual(["Invalid url"]);
      expect(setup.socket.adapter.connecting).toBeFalse();
    });
  });

  describe("when deciding about reconnecting", () => {
    it.each([
      [{}, true],
      [{ error: new Error("Timeout") }, true],
      [{ code: 1000 }, false],
      [{ code: 1006 }, true],
      [{ code: 1002 }, false],
      [{ code: 4401 }, false],
      [{ code: 4403 }, true],
      [{ code: 4499 }, true],
      [{ code: 3000 }, true],
    ])("should decide %j as %s", (loss, expected) => {
      expect(shouldReconnectGraphqlWs(loss)).toBe(expected);
    });
  });
});
