import { Socket } from "socket";

import {
  ControlledWebSocket,
  flushPromises,
  installControlledWebSocket,
  openWebSocket,
  uninstallControlledWebSocket,
  waitForWebSocket,
} from "../../utils/controlled-websocket";

const url = "ws://reconnection";
const reconnectTime = 1000;

describe("Websocket Adapter [ Reconnection ]", () => {
  const sockets: Socket[] = [];

  const createSocket = (options?: Partial<ConstructorParameters<typeof Socket>[0]>) => {
    const socket = new Socket({ url, reconnectTime, ...options });
    sockets.push(socket);
    return socket;
  };

  /** Creates a socket and opens its first connection */
  const createConnectedSocket = async (options?: Partial<ConstructorParameters<typeof Socket>[0]>) => {
    const socket = createSocket(options);
    const websocket = await openWebSocket();
    return { socket, websocket };
  };

  const trackReconnection = (socket: Socket) => {
    const events: string[] = [];
    socket.events.onReconnecting(({ attempts }) => events.push(`reconnecting:${attempts}`));
    socket.events.onReconnectingFailed(({ attempts }) => events.push(`failed:${attempts}`));
    socket.events.onConnected(() => events.push("connected"));
    socket.events.onDisconnected(() => events.push("disconnected"));
    return events;
  };

  /** Moves the clock by the reconnection delay and lets the next attempt create its transport */
  const waitForReconnectAttempt = async () => {
    await vi.advanceTimersByTimeAsync(reconnectTime);
    await flushPromises();
    return ControlledWebSocket.last;
  };

  /** Waits for the next attempt and lets the server refuse it */
  const refuseReconnectAttempt = async () => {
    const attempt = await waitForReconnectAttempt();
    attempt.serverRefuse();
    return attempt;
  };

  /** Waits for the next attempt and lets the server accept it */
  const openReconnectAttempt = async () => {
    const attempt = await waitForReconnectAttempt();
    attempt.serverOpen();
    return attempt;
  };

  beforeEach(() => {
    installControlledWebSocket();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(async () => {
    await Promise.all(sockets.map((socket) => socket.disconnect()));
    sockets.forEach((socket) => socket.appManager.unmount());
    sockets.length = 0;
    vi.useRealTimers();
    uninstallControlledWebSocket();
  });

  describe("When the connection is lost", () => {
    it("should wait for the reconnect time before trying again", async () => {
      const { socket, websocket } = await createConnectedSocket();
      socket.onError(() => null);
      const events = trackReconnection(socket);

      websocket.serverClose({ code: 1006 });
      await vi.advanceTimersByTimeAsync(reconnectTime - 1);

      expect(events).toStrictEqual(["disconnected"]);
      expect(ControlledWebSocket.instances).toHaveLength(1);

      await vi.advanceTimersByTimeAsync(1);
      await flushPromises();

      expect(events).toStrictEqual(["disconnected", "reconnecting:0"]);
      expect(ControlledWebSocket.instances).toHaveLength(2);
    });

    it("should reconnect and become connected again", async () => {
      const { socket, websocket } = await createConnectedSocket();
      socket.onError(() => null);
      const events = trackReconnection(socket);

      websocket.serverClose({ code: 1006 });
      const next = await waitForReconnectAttempt();
      next.serverOpen();

      expect(events).toStrictEqual(["disconnected", "reconnecting:0", "connected"]);
      expect(socket.adapter.connected).toBeTrue();
      expect(ControlledWebSocket.active).toStrictEqual([next]);
    });

    it("should use the reconnect time from the socket options", async () => {
      const { socket, websocket } = await createConnectedSocket({ reconnectTime: 250 });
      socket.onError(() => null);

      websocket.serverClose({ code: 1006 });
      await vi.advanceTimersByTimeAsync(249);
      expect(ControlledWebSocket.instances).toHaveLength(1);

      await vi.advanceTimersByTimeAsync(1);
      await flushPromises();
      expect(ControlledWebSocket.instances).toHaveLength(2);
    });

    it("should call the onReconnect callbacks on every attempt", async () => {
      const onReconnect = vi.fn();
      const { socket, websocket } = await createConnectedSocket();
      socket.onError(() => null).onReconnect(onReconnect);

      websocket.serverClose({ code: 1006 });
      await refuseReconnectAttempt();
      await refuseReconnectAttempt();
      await waitForReconnectAttempt();

      expect(onReconnect).toHaveBeenCalledTimes(3);
    });

    it("should number the attempts until the connection is back", async () => {
      const attempts: number[] = [];
      const { socket, websocket } = await createConnectedSocket();
      socket
        .onError(() => null)
        .onConnect(({ connection, attempt }) => {
          attempts.push(attempt);
          return connection;
        });
      const events = trackReconnection(socket);

      websocket.serverClose({ code: 1006 });
      await refuseReconnectAttempt();
      await refuseReconnectAttempt();
      await openReconnectAttempt();

      expect(attempts).toStrictEqual([1, 2, 3]);
      expect(events).toStrictEqual([
        "disconnected",
        "reconnecting:0",
        "disconnected",
        "reconnecting:1",
        "disconnected",
        "reconnecting:2",
        "connected",
      ]);
      expect(socket.adapter.reconnectionAttempts).toBe(0);
    });

    it("should start counting from zero after a successful reconnection", async () => {
      const { socket, websocket } = await createConnectedSocket();
      socket.onError(() => null);

      websocket.serverClose({ code: 1006 });
      await refuseReconnectAttempt();
      const recovered = await waitForReconnectAttempt();
      recovered.serverOpen();
      const events = trackReconnection(socket);

      recovered.serverClose({ code: 1006 });
      await waitForReconnectAttempt();

      expect(events).toStrictEqual(["disconnected", "reconnecting:0"]);
    });

    it("should hold only one live transport while reconnecting", async () => {
      const { socket, websocket } = await createConnectedSocket();
      socket.onError(() => null);

      websocket.serverClose({ code: 1006 });
      for (let i = 0; i < 5; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const next = await waitForReconnectAttempt();
        expect(ControlledWebSocket.active).toStrictEqual([next]);
        next.serverRefuse();
      }

      expect(ControlledWebSocket.active).toHaveLength(0);
      expect(vi.getTimerCount()).toBe(1);
    });

    it("should survive a flapping connection with one transport and paired events", async () => {
      const { socket, websocket } = await createConnectedSocket();
      socket.onError(() => null);
      const events = trackReconnection(socket);
      let current = websocket;

      for (let i = 0; i < 10; i += 1) {
        current.serverClose({ code: 1006 });
        // eslint-disable-next-line no-await-in-loop
        current = await waitForReconnectAttempt();
        current.serverOpen();
      }

      expect(ControlledWebSocket.instances).toHaveLength(11);
      expect(ControlledWebSocket.active).toStrictEqual([current]);
      expect(events.filter((event) => event === "disconnected")).toHaveLength(10);
      expect(events.filter((event) => event === "connected")).toHaveLength(10);
      expect(events.filter((event) => event === "reconnecting:0")).toHaveLength(10);
      expect(socket.adapter.connected).toBeTrue();
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should keep delivering messages to the same listeners after reconnecting", async () => {
      const { socket, websocket } = await createConnectedSocket();
      socket.onError(() => null);
      const spy = vi.fn();
      socket
        .createListener<number>()({ topic: "ticks" })
        .listen(({ data }) => spy(data));

      websocket.serverEmit("ticks", 1);
      websocket.serverClose({ code: 1006 });
      const next = await waitForReconnectAttempt();
      next.serverOpen();
      next.serverEmit("ticks", 2);

      expect(spy.mock.calls).toStrictEqual([[1], [2]]);
      expect(socket.adapter.listeners.get("ticks")?.size).toBe(1);
    });

    it("should ignore frames of the replaced transport", async () => {
      const { socket, websocket } = await createConnectedSocket();
      socket.onError(() => null);
      const spy = vi.fn();
      socket
        .createListener<number>()({ topic: "ticks" })
        .listen(({ data }) => spy(data));

      const reconnecting = socket.reconnect();
      const next = await openWebSocket(2);
      await reconnecting;
      websocket.serverEmit("ticks", 1);
      next.serverEmit("ticks", 2);

      expect(spy.mock.calls).toStrictEqual([[2]]);
    });
  });

  describe("When the reconnection attempts are limited", () => {
    it("should stop after the configured number of attempts", async () => {
      const onReconnectFailed = vi.fn();
      const { socket, websocket } = await createConnectedSocket({ reconnect: 2 });
      socket.onError(() => null).onReconnectFailed(onReconnectFailed);
      const events = trackReconnection(socket);

      websocket.serverClose({ code: 1006 });
      await refuseReconnectAttempt();
      await refuseReconnectAttempt();
      await vi.advanceTimersByTimeAsync(reconnectTime);
      await flushPromises();

      expect(events).toStrictEqual([
        "disconnected",
        "reconnecting:0",
        "disconnected",
        "reconnecting:1",
        "disconnected",
        "reconnecting:2",
        "failed:2",
      ]);
      expect(onReconnectFailed).toHaveBeenCalledTimes(1);
      expect(ControlledWebSocket.instances).toHaveLength(3);
    });

    it("should leave no timers and no transport after giving up", async () => {
      const { socket, websocket } = await createConnectedSocket({ reconnect: 1 });
      socket.onError(() => null);

      websocket.serverClose({ code: 1006 });
      await refuseReconnectAttempt();
      await vi.advanceTimersByTimeAsync(reconnectTime);
      await flushPromises();
      await vi.advanceTimersByTimeAsync(reconnectTime * 10);

      expect(vi.getTimerCount()).toBe(0);
      expect(ControlledWebSocket.active).toHaveLength(0);
      expect(ControlledWebSocket.instances).toHaveLength(2);
      expect(socket.adapter.connecting).toBeFalse();
    });

    it("should not reconnect at all when reconnect is set to 0", async () => {
      const { socket, websocket } = await createConnectedSocket({ reconnect: 0 });
      socket.onError(() => null);
      const events = trackReconnection(socket);

      websocket.serverClose({ code: 1006 });
      await vi.advanceTimersByTimeAsync(reconnectTime * 5);
      await flushPromises();

      expect(events).toStrictEqual(["disconnected", "reconnecting:0", "failed:0"]);
      expect(ControlledWebSocket.instances).toHaveLength(1);
    });

    it("should count attempts whose handshake never finishes", async () => {
      const socket = createSocket({ reconnect: 2 });
      socket.onError(() => null);
      const events = trackReconnection(socket);
      await waitForWebSocket();

      // The server accepts the TCP connection but never answers the handshake
      await waitForReconnectAttempt();
      await waitForReconnectAttempt();
      await vi.advanceTimersByTimeAsync(reconnectTime);
      await flushPromises();
      await vi.advanceTimersByTimeAsync(reconnectTime * 10);

      expect(events.filter((event) => event.startsWith("reconnecting"))).toStrictEqual([
        "reconnecting:0",
        "reconnecting:1",
        "reconnecting:2",
      ]);
      expect(events.at(-1)).toBe("failed:2");
      expect(ControlledWebSocket.instances).toHaveLength(3);
      expect(ControlledWebSocket.active).toHaveLength(0);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should close the hanging transport before starting the next attempt", async () => {
      const socket = createSocket();
      socket.onError(() => null);
      const hanging = await waitForWebSocket();

      const next = await waitForReconnectAttempt();

      expect(hanging.readyState).toBe(ControlledWebSocket.CLOSED);
      expect(next).not.toBe(hanging);
      expect(ControlledWebSocket.active).toStrictEqual([next]);
    });

    it("should pass the attempt number of a hanging handshake to onConnect", async () => {
      const attempts: number[] = [];
      const socket = createSocket().onConnect(({ connection, attempt }) => {
        attempts.push(attempt);
        return connection;
      });
      socket.onError(() => null);
      await waitForWebSocket();

      await waitForReconnectAttempt();
      await waitForReconnectAttempt();
      await waitForReconnectAttempt();

      expect(attempts).toStrictEqual([0, 1, 2, 3]);
    });

    it("should allow a manual connect after giving up", async () => {
      const { socket, websocket } = await createConnectedSocket({ reconnect: 0 });
      socket.onError(() => null);
      websocket.serverClose({ code: 1006 });
      await vi.advanceTimersByTimeAsync(reconnectTime);
      await flushPromises();

      const connecting = socket.connect();
      await openWebSocket(2);
      await connecting;

      expect(socket.adapter.connected).toBeTrue();
      expect(socket.adapter.reconnectionAttempts).toBe(0);
    });

    it("should retry endlessly by default", async () => {
      const { socket, websocket } = await createConnectedSocket();
      socket.onError(() => null);
      const failed = vi.fn();
      socket.events.onReconnectingFailed(failed);

      websocket.serverClose({ code: 1006 });
      for (let i = 0; i < 25; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await refuseReconnectAttempt();
      }

      expect(failed).not.toHaveBeenCalled();
      expect(ControlledWebSocket.instances).toHaveLength(26);
      expect(socket.adapter.reconnectionAttempts).toBe(25);
    });
  });

  describe("When disconnecting manually", () => {
    it("should cancel the scheduled reconnection", async () => {
      const { socket, websocket } = await createConnectedSocket();
      socket.onError(() => null);
      websocket.serverClose({ code: 1006 });
      const events = trackReconnection(socket);

      await socket.disconnect();
      await vi.advanceTimersByTimeAsync(reconnectTime * 5);

      expect(events).toStrictEqual([]);
      expect(ControlledWebSocket.instances).toHaveLength(1);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should stop a reconnection attempt that is still opening", async () => {
      const { socket, websocket } = await createConnectedSocket();
      socket.onError(() => null);
      websocket.serverClose({ code: 1006 });
      const attempt = await waitForReconnectAttempt();

      await socket.disconnect();
      await vi.advanceTimersByTimeAsync(reconnectTime * 5);

      expect(attempt.readyState).toBe(ControlledWebSocket.CLOSED);
      expect(ControlledWebSocket.instances).toHaveLength(2);
      expect(socket.adapter.connecting).toBeFalse();
      expect(socket.adapter.reconnectionAttempts).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should not reconnect when the transport reports the close late", async () => {
      ControlledWebSocket.autoFinishClose = false;
      const { socket, websocket } = await createConnectedSocket();
      const events = trackReconnection(socket);

      const disconnecting = socket.disconnect();
      websocket.finishClose();
      await disconnecting;
      await vi.advanceTimersByTimeAsync(reconnectTime * 5);

      expect(events).toStrictEqual(["disconnected"]);
      expect(ControlledWebSocket.instances).toHaveLength(1);
    });

    it("should win over a reconnection that is closing the previous transport", async () => {
      ControlledWebSocket.autoFinishClose = false;
      const { socket, websocket } = await createConnectedSocket();
      const events = trackReconnection(socket);

      const reconnecting = socket.reconnect();
      const disconnecting = socket.disconnect();
      websocket.finishClose();
      await Promise.all([reconnecting, disconnecting]);
      await vi.advanceTimersByTimeAsync(reconnectTime * 5);

      expect(events).toStrictEqual(["reconnecting:0", "disconnected"]);
      expect(ControlledWebSocket.instances).toHaveLength(1);
      expect(socket.adapter.connecting).toBeFalse();
      expect(socket.adapter.connected).toBeFalse();
    });

    it("should mark the socket as closed on purpose until it connects again", async () => {
      const { socket } = await createConnectedSocket();

      await socket.disconnect();
      expect(socket.adapter.forceClosed).toBeTrue();

      const connecting = socket.connect();
      await openWebSocket(2);
      await connecting;
      expect(socket.adapter.forceClosed).toBeFalse();
    });
  });

  describe("When reconnecting manually", () => {
    it("should replace the open connection with a new one", async () => {
      const { socket, websocket } = await createConnectedSocket();
      const events = trackReconnection(socket);

      const reconnecting = socket.reconnect();
      const next = await openWebSocket(2);
      await reconnecting;

      expect(websocket.readyState).toBe(ControlledWebSocket.CLOSED);
      expect(events).toStrictEqual(["reconnecting:0", "disconnected", "connected"]);
      expect(ControlledWebSocket.active).toStrictEqual([next]);
    });

    it("should resolve reconnect only after the new connection is open", async () => {
      const { socket } = await createConnectedSocket();
      const resolved = vi.fn();

      const reconnecting = socket.reconnect().then(resolved);
      const next = await waitForWebSocket(2);
      await flushPromises();
      expect(resolved).not.toHaveBeenCalled();

      next.serverOpen();
      await reconnecting;

      expect(resolved).toHaveBeenCalledTimes(1);
      expect(socket.adapter.connected).toBeTrue();
    });

    it("should connect a socket that was disconnected manually", async () => {
      const { socket } = await createConnectedSocket();
      await socket.disconnect();

      const reconnecting = socket.reconnect();
      await openWebSocket(2);
      await reconnecting;

      expect(socket.adapter.connected).toBeTrue();
      expect(socket.adapter.forceClosed).toBeFalse();
    });

    it("should apply the url and query params set before reconnecting", async () => {
      const { socket } = await createConnectedSocket({ queryParams: { token: "old" } });

      socket.setUrl("ws://other-region").setQueryParams({ token: "new" });
      const reconnecting = socket.reconnect();
      const next = await openWebSocket(2);
      await reconnecting;

      expect(next.url).toBe("ws://other-region?token=new");
    });

    it("should replace a connection that is still opening without leaving it behind", async () => {
      const socket = createSocket();
      const first = await waitForWebSocket();

      const reconnecting = socket.reconnect();
      const second = await openWebSocket(2);
      await reconnecting;

      expect(first.readyState).toBe(ControlledWebSocket.CLOSED);
      expect(ControlledWebSocket.active).toStrictEqual([second]);
      expect(socket.adapter.connected).toBeTrue();
    });

    it("should refresh the connection details on every attempt", async () => {
      const tokens = ["token-1", "token-2", "token-3"];
      const { socket, websocket } = await createConnectedSocket();
      socket
        .onError(() => null)
        .onConnect(async ({ connection, attempt }) => ({
          ...connection,
          adapterOptions: { ...connection.adapterOptions, protocols: ["auth", tokens[attempt - 1]] },
        }));

      websocket.serverClose({ code: 1006 });
      const first = await waitForReconnectAttempt();
      first.serverRefuse();
      const second = await waitForReconnectAttempt();
      second.serverRefuse();
      const third = await waitForReconnectAttempt();

      expect(first.protocols).toStrictEqual(["auth", "token-1"]);
      expect(second.protocols).toStrictEqual(["auth", "token-2"]);
      expect(third.protocols).toStrictEqual(["auth", "token-3"]);
    });

    it("should stay disconnected when the onConnect interceptor fails during a reconnection", async () => {
      let shouldFail = false;
      const errors: string[] = [];
      const { socket, websocket } = await createConnectedSocket();
      socket
        .onError<Error>(({ error }) => errors.push(error.message))
        .onConnect(({ connection }) => {
          if (shouldFail) {
            throw new Error("Cannot refresh the token");
          }
          return connection;
        });

      shouldFail = true;
      websocket.serverClose({ code: 1006 });
      await waitForReconnectAttempt();
      await vi.advanceTimersByTimeAsync(reconnectTime * 5);

      expect(errors).toContain("Cannot refresh the token");
      expect(ControlledWebSocket.instances).toHaveLength(1);
      expect(socket.adapter.connecting).toBeFalse();
      expect(socket.adapter.connected).toBeFalse();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe("When the network state changes", () => {
    it("should skip reconnection attempts while offline", async () => {
      const { socket, websocket } = await createConnectedSocket();
      socket.onError(() => null);

      socket.appManager.setOnline(false);
      websocket.serverClose({ code: 1006 });
      await vi.advanceTimersByTimeAsync(reconnectTime * 5);
      await flushPromises();

      expect(ControlledWebSocket.instances).toHaveLength(1);
      expect(socket.adapter.connecting).toBeFalse();
    });

    it("should connect as soon as the network is back", async () => {
      const { socket, websocket } = await createConnectedSocket();
      socket.onError(() => null);
      socket.appManager.setOnline(false);
      websocket.serverClose({ code: 1006 });
      await vi.advanceTimersByTimeAsync(reconnectTime);
      await flushPromises();

      socket.appManager.setOnline(true);
      const next = await openWebSocket(2);

      expect(socket.adapter.connected).toBeTrue();
      expect(ControlledWebSocket.active).toStrictEqual([next]);
    });

    it("should keep the open connection when the online event fires", async () => {
      const { socket } = await createConnectedSocket();

      socket.appManager.setOnline(false);
      socket.appManager.setOnline(true);
      await flushPromises();

      expect(ControlledWebSocket.instances).toHaveLength(1);
      expect(socket.adapter.connected).toBeTrue();
    });

    it("should not open a second transport when the online event fires while connecting", async () => {
      const socket = createSocket();
      await waitForWebSocket();

      socket.appManager.setOnline(true);
      socket.appManager.setOnline(true);
      await flushPromises();

      expect(ControlledWebSocket.instances).toHaveLength(1);
    });

    it("should not connect on the online event without autoConnect", async () => {
      const socket = createSocket({ adapterOptions: { autoConnect: false } });

      socket.appManager.setOnline(false);
      socket.appManager.setOnline(true);
      await flushPromises();

      expect(ControlledWebSocket.instances).toHaveLength(0);
      expect(socket.adapter.connecting).toBeFalse();
    });

    it("should stay disconnected on the online event after a manual disconnect", async () => {
      const { socket } = await createConnectedSocket();
      await socket.disconnect();

      socket.appManager.setOnline(false);
      socket.appManager.setOnline(true);
      await flushPromises();

      expect(ControlledWebSocket.instances).toHaveLength(1);
      expect(socket.adapter.connecting).toBeFalse();
    });

    it("should connect on the online event after the reconnection attempts ran out", async () => {
      const { socket, websocket } = await createConnectedSocket({ reconnect: 0 });
      socket.onError(() => null);
      websocket.serverClose({ code: 1006 });
      await vi.advanceTimersByTimeAsync(reconnectTime);
      await flushPromises();

      socket.appManager.setOnline(false);
      socket.appManager.setOnline(true);
      await openWebSocket(2);

      expect(socket.adapter.connected).toBeTrue();
    });
  });
});
