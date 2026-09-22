import { createWebsocketMockingServer, waitForConnection } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/dom";

import { WebsocketAdapter } from "../../../src/adapter-websockets/websocket-adapter";
import { createSocket } from "../../utils/socket.utils";

type ConstructedWebsocket = { url: string; protocols: string | string[] | undefined };

describe("Websocket Adapter [ Connect ]", () => {
  const { url, getServer, startServer, stopServer } = createWebsocketMockingServer();
  let constructed: ConstructedWebsocket[] = [];

  // The mocking server swaps the global WebSocket every time it (re)starts,
  // so the spy has to be installed after each startServer() call.
  const installWebSocketSpy = () => {
    const BaseWebSocket = window.WebSocket;
    class SpyWebSocket extends BaseWebSocket {
      constructor(u: string | URL, protocols?: string | string[]) {
        super(u, protocols);
        constructed.push({ url: String(u), protocols });
      }
    }
    window.WebSocket = SpyWebSocket;
  };

  beforeEach(() => {
    vi.resetAllMocks();
    constructed = [];
    startServer();
    installWebSocketSpy();
  });

  afterEach(() => {
    stopServer();
  });

  it("should pass static protocols to the WebSocket constructor", async () => {
    const socket = createSocket({
      url,
      adapter: WebsocketAdapter(),
      adapterOptions: { protocols: ["authorization", "token-A"] },
    });

    await waitForConnection(socket);

    expect(constructed).toEqual([{ url, protocols: ["authorization", "token-A"] }]);
  });

  it("should connect with url, query params and protocols returned from onConnect", async () => {
    const connectSpy = vi.fn();
    const socket = createSocket({
      url,
      adapter: WebsocketAdapter(),
      queryParams: { room: "lobby" },
      adapterOptions: { protocols: "v1" },
    }).onConnect(({ connection, attempt }) => {
      connectSpy({ connection, attempt });
      return {
        ...connection,
        queryParams: { room: "lobby", token: "token-A" },
        adapterOptions: { ...connection.adapterOptions, protocols: ["authorization", "token-A"] },
      };
    });

    await waitForConnection(socket);

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(connectSpy).toHaveBeenCalledWith({
      connection: { url, queryParams: { room: "lobby" }, adapterOptions: { protocols: "v1" } },
      attempt: 0,
    });
    expect(constructed).toEqual([{ url: `${url}?room=lobby&token=token-A`, protocols: ["authorization", "token-A"] }]);
  });

  it("should support async onConnect interceptors", async () => {
    const socket = createSocket({ url, adapter: WebsocketAdapter() }).onConnect(async ({ connection }) => {
      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });
      return { ...connection, adapterOptions: { protocols: ["authorization", "token-A"] } };
    });

    await waitForConnection(socket);

    expect(constructed).toEqual([{ url, protocols: ["authorization", "token-A"] }]);
    expect(socket.adapter.connected).toBe(true);
  });

  it("should run onConnect on manual reconnect with the latest values", async () => {
    let token = "token-A";
    const connectSpy = vi.fn();
    const socket = createSocket({ url, adapter: WebsocketAdapter() }).onConnect(({ connection, attempt }) => {
      connectSpy(attempt);
      return { ...connection, adapterOptions: { protocols: ["authorization", token] } };
    });

    await waitForConnection(socket);
    expect(constructed.map((ws) => ws.protocols)).toEqual([["authorization", "token-A"]]);

    // Token refreshed while the connection is alive - nothing reconnects yet
    token = "token-B";
    expect(connectSpy).toHaveBeenCalledTimes(1);

    await socket.adapter.reconnect();
    await waitForConnection(socket);

    expect(connectSpy).toHaveBeenCalledTimes(2);
    expect(constructed.map((ws) => ws.protocols)).toEqual([
      ["authorization", "token-A"],
      ["authorization", "token-B"],
    ]);
  });

  it("should run onConnect on automatic reconnect with the reconnection attempt number", async () => {
    let token = "token-A";
    const attempts: number[] = [];
    const socket = createSocket({ url, adapter: WebsocketAdapter(), reconnectTime: 10 }).onConnect(
      ({ connection, attempt }) => {
        attempts.push(attempt);
        return { ...connection, adapterOptions: { protocols: ["authorization", token] } };
      },
    );
    const disconnectedSpy = vi.fn();
    socket.events.onDisconnected(disconnectedSpy);

    await waitForConnection(socket);

    token = "token-B";
    getServer().close({ code: 1006, reason: "Abnormal closure", wasClean: false });

    await waitFor(
      () => {
        expect(disconnectedSpy).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );

    startServer();
    installWebSocketSpy();

    await waitFor(
      () => {
        expect(constructed.length).toBeGreaterThanOrEqual(2);
      },
      { timeout: 2000 },
    );

    expect(attempts[0]).toBe(0);
    expect(attempts[1]).toBe(1);
    expect(constructed.at(-1)?.protocols).toEqual(["authorization", "token-B"]);
  });

  it("should fail the attempt and emit an error when an onConnect interceptor throws", async () => {
    const errorSpy = vi.fn();
    const connectedSpy = vi.fn();
    const socket = createSocket({
      url,
      adapter: WebsocketAdapter(),
      adapterOptions: { autoConnect: false },
    }).onConnect(async () => {
      throw new Error("Cannot get token");
    });
    socket.events.onError(errorSpy);
    socket.events.onConnected(connectedSpy);

    await expect(socket.adapter.connect()).resolves.toBe(false);

    expect(constructed).toEqual([]);
    expect(socket.adapter.connecting).toBe(false);
    expect(socket.adapter.connected).toBe(false);
    expect(connectedSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0].error.message).toBe("Cannot get token");
  });

  it("should fail the attempt and emit an error when the connection details are invalid", async () => {
    const errorSpy = vi.fn();
    const socket = createSocket({
      url,
      adapter: WebsocketAdapter(),
      adapterOptions: { autoConnect: false },
    }).onConnect(({ connection }) => ({ ...connection, url: "not-a-websocket-url" }));
    socket.events.onError(errorSpy);

    await expect(socket.adapter.connect()).resolves.toBe(false);

    expect(socket.adapter.connecting).toBe(false);
    expect(socket.adapter.connected).toBe(false);
    expect(errorSpy).toHaveBeenCalledTimes(1);

    // The adapter must be usable again after a failed attempt
    socket.unstable_onConnectCallbacks = [];
    await expect(socket.adapter.connect()).resolves.toBe(true);
  });

  it("should cancel the attempt when disconnect is called while onConnect is pending", async () => {
    let resolveConnection: () => void = () => null;
    let interceptorStarted: () => void = () => null;
    const disconnectedSpy = vi.fn();
    const socket = createSocket({
      url,
      adapter: WebsocketAdapter(),
      adapterOptions: { autoConnect: false },
    }).onConnect(
      ({ connection }) =>
        new Promise((resolve) => {
          resolveConnection = () => resolve(connection);
          interceptorStarted();
        }),
    );
    socket.events.onDisconnected(disconnectedSpy);

    const started = new Promise<void>((resolve) => {
      interceptorStarted = resolve;
    });
    const connectPromise = socket.adapter.connect();
    expect(socket.adapter.connecting).toBe(true);
    await started;

    await socket.adapter.disconnect();
    resolveConnection();

    await expect(connectPromise).resolves.toBe(false);
    expect(constructed).toEqual([]);
    expect(socket.adapter.connecting).toBe(false);
    expect(socket.adapter.connected).toBe(false);
    expect(disconnectedSpy).toHaveBeenCalledTimes(1);
  });

  it("should discard a superseded attempt when a newer connect starts while onConnect is pending", async () => {
    const resolvers: ((value: string) => void)[] = [];
    const socket = createSocket({
      url,
      adapter: WebsocketAdapter(),
      adapterOptions: { autoConnect: false },
    }).onConnect(
      ({ connection }) =>
        new Promise((resolve) => {
          resolvers.push((token) =>
            resolve({ ...connection, adapterOptions: { protocols: ["authorization", token] } }),
          );
        }),
    );

    const first = socket.adapter.connect();
    await waitFor(() => expect(resolvers).toHaveLength(1));
    await socket.adapter.disconnect();
    const second = socket.adapter.connect();
    await waitFor(() => expect(resolvers).toHaveLength(2));

    resolvers[1]("token-B");
    resolvers[0]("token-A");

    await expect(first).resolves.toBe(false);
    await expect(second).resolves.toBe(true);
    expect(constructed.map((ws) => ws.protocols)).toEqual([["authorization", "token-B"]]);
  });

  it("should keep the open connection when connect is called again", async () => {
    const connectSpy = vi.fn(({ connection }) => connection);
    const socket = createSocket({ url, adapter: WebsocketAdapter() }).onConnect(connectSpy);

    await waitForConnection(socket);

    await expect(socket.adapter.connect()).resolves.toBe(true);

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(constructed).toHaveLength(1);
    expect(socket.adapter.connected).toBe(true);
  });
});
