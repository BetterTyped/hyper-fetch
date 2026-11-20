import { Socket } from "socket";

import {
  ControlledWebSocket,
  flushPromises,
  installControlledWebSocket,
  openWebSocket,
  uninstallControlledWebSocket,
  waitForWebSocket,
} from "../../utils/controlled-websocket";

const url = "ws://lifecycle";

/** Records every connection event of a socket in the order it was emitted */
const trackEvents = (socket: Socket) => {
  const events: string[] = [];
  socket.events.onConnecting(({ connecting }) => events.push(`connecting:${connecting}`));
  socket.events.onConnected(() => events.push("connected"));
  socket.events.onDisconnected(() => events.push("disconnected"));
  socket.events.onReconnecting(({ attempts }) => events.push(`reconnecting:${attempts}`));
  socket.events.onReconnectingFailed(({ attempts }) => events.push(`reconnecting-failed:${attempts}`));
  socket.events.onError(({ error }: any) => events.push(`error:${error.message}`));
  return events;
};

describe("Websocket Adapter [ Lifecycle ]", () => {
  // The lower end of the reconnection jitter - every delay is exactly `reconnectTime`
  let random = vi.spyOn(Math, "random");
  beforeEach(() => {
    random = vi.spyOn(Math, "random").mockReturnValue(0);
  });
  afterEach(() => {
    random.mockRestore();
  });

  const sockets: Socket[] = [];

  const createSocket = (options?: Partial<ConstructorParameters<typeof Socket>[0]>) => {
    const socket = new Socket({ url, ...options });
    sockets.push(socket);
    return socket;
  };

  const createManualSocket = (options?: Partial<ConstructorParameters<typeof Socket>[0]>) => {
    return createSocket({ ...options, adapterOptions: { autoConnect: false, ...options?.adapterOptions } });
  };

  /** Waits for the transport of the attempt in progress and lets the server refuse it */
  const refuseWebSocket = async () => {
    const websocket = await waitForWebSocket();
    websocket.serverRefuse();
    return websocket;
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

  describe("When connecting", () => {
    it("should start in the disconnected state without autoConnect", async () => {
      const socket = createManualSocket();
      await flushPromises();

      expect(socket.adapter.connected).toBeFalse();
      expect(socket.adapter.connecting).toBeFalse();
      expect(ControlledWebSocket.instances).toHaveLength(0);
    });

    it("should mark the socket as connecting synchronously with autoConnect", () => {
      const socket = createSocket();

      expect(socket.adapter.connecting).toBeTrue();
      expect(socket.adapter.connected).toBeFalse();
    });

    it("should emit connecting, then connected in order", async () => {
      const socket = createManualSocket();
      const events = trackEvents(socket);

      const connecting = socket.connect();
      await openWebSocket();
      await connecting;

      expect(events).toStrictEqual(["connecting:true", "connecting:false", "connected"]);
      expect(socket.adapter.connected).toBeTrue();
      expect(socket.adapter.connecting).toBeFalse();
    });

    it("should resolve connect only after the connection is open", async () => {
      const socket = createManualSocket();
      const resolved = vi.fn();

      const connecting = socket.connect().then(resolved);
      const websocket = await waitForWebSocket();
      await flushPromises();
      expect(resolved).not.toHaveBeenCalled();

      websocket.serverOpen();
      await connecting;

      expect(resolved).toHaveBeenCalledTimes(1);
      expect(socket.adapter.connected).toBeTrue();
    });

    it("should wait for the automatic connection when connect is called right after creating the socket", async () => {
      const socket = createSocket();
      const resolved = vi.fn();

      const connecting = socket.connect().then(resolved);
      const websocket = await waitForWebSocket();
      await flushPromises();
      expect(resolved).not.toHaveBeenCalled();

      websocket.serverOpen();
      await connecting;

      expect(socket.adapter.connected).toBeTrue();
      expect(ControlledWebSocket.instances).toHaveLength(1);
    });

    it("should resolve every concurrent connect call with the same result", async () => {
      const socket = createManualSocket();

      const first = socket.adapter.connect();
      const second = socket.adapter.connect();
      const third = socket.adapter.connect();
      await openWebSocket();

      await expect(Promise.all([first, second, third])).resolves.toStrictEqual([true, true, true]);
      expect(ControlledWebSocket.instances).toHaveLength(1);
    });

    it("should open a single transport and emit a single connecting event for concurrent connect calls", async () => {
      const socket = createManualSocket();
      const events = trackEvents(socket);

      socket.connect();
      socket.connect();
      socket.connect();
      await openWebSocket();

      expect(ControlledWebSocket.instances).toHaveLength(1);
      expect(events).toStrictEqual(["connecting:true", "connecting:false", "connected"]);
    });

    it("should resolve joined connect calls with false when the attempt fails", async () => {
      const socket = createManualSocket({ reconnect: 0 });
      socket.onError(() => null);

      const first = socket.adapter.connect();
      const second = socket.adapter.connect();
      const websocket = await waitForWebSocket();
      websocket.serverRefuse();

      await expect(Promise.all([first, second])).resolves.toStrictEqual([false, false]);
    });

    it("should start a fresh attempt after the previous one failed", async () => {
      const socket = createManualSocket({ reconnect: 0 });
      socket.onError(() => null);

      const first = socket.adapter.connect();
      await refuseWebSocket();
      await expect(first).resolves.toBe(false);

      const second = socket.adapter.connect();
      await openWebSocket(2);

      await expect(second).resolves.toBe(true);
      expect(ControlledWebSocket.instances).toHaveLength(2);
    });

    it("should keep the open connection when connect is called again", async () => {
      const socket = createSocket();
      await openWebSocket();
      const events = trackEvents(socket);

      await expect(socket.adapter.connect()).resolves.toBe(true);
      await expect(socket.adapter.connect()).resolves.toBe(true);

      expect(ControlledWebSocket.instances).toHaveLength(1);
      expect(events).toStrictEqual([]);
    });

    it("should connect to the url with stringified query params", async () => {
      createSocket({ url: "ws://lifecycle/path", queryParams: { token: "abc", rooms: [1, 2] } });

      const websocket = await waitForWebSocket();

      expect(websocket.url).toBe("ws://lifecycle/path?token=abc&rooms[]=1&rooms[]=2");
    });

    it("should pass the protocols to the transport", async () => {
      createSocket({ adapterOptions: { protocols: ["v1", "v2"] } });

      const websocket = await waitForWebSocket();

      expect(websocket.protocols).toStrictEqual(["v1", "v2"]);
    });

    it("should report an error when the transport cannot be created", async () => {
      const socket = createManualSocket();
      const events = trackEvents(socket);
      ControlledWebSocket.constructorError = new SyntaxError("The URL is invalid");

      await expect(socket.adapter.connect()).resolves.toBe(false);

      expect(events).toStrictEqual(["connecting:true", "connecting:false", "error:The URL is invalid"]);
      expect(socket.adapter.connecting).toBeFalse();
      expect(socket.adapter.connected).toBeFalse();
    });

    it("should report an error and a disconnection when the server refuses the connection", async () => {
      const socket = createManualSocket({ reconnect: 0 });
      const events = trackEvents(socket);

      const connecting = socket.adapter.connect();
      await refuseWebSocket();

      await expect(connecting).resolves.toBe(false);
      expect(events).toStrictEqual([
        "connecting:true",
        "connecting:false",
        "disconnected",
        "error:The connection was closed abnormally, e.g., without sending or receiving a Close control frame",
      ]);
      expect(socket.adapter.connected).toBeFalse();
      expect(socket.adapter.connecting).toBeFalse();
    });
  });

  describe("When disconnecting", () => {
    it("should close the transport with the normal closure code", async () => {
      const socket = createSocket();
      const websocket = await openWebSocket();

      await socket.disconnect();

      expect(websocket.closeCalls).toStrictEqual([{ code: 1000, reason: undefined }]);
      expect(websocket.readyState).toBe(ControlledWebSocket.CLOSED);
    });

    it("should emit a single disconnected event and no error", async () => {
      const socket = createSocket();
      await openWebSocket();
      const events = trackEvents(socket);

      await socket.disconnect();

      expect(events).toStrictEqual(["connecting:false", "disconnected"]);
    });

    it("should update the state before the transport finished closing", async () => {
      ControlledWebSocket.autoFinishClose = false;
      const socket = createSocket();
      const websocket = await openWebSocket();
      const resolved = vi.fn();

      const disconnecting = socket.disconnect().then(resolved);
      await flushPromises();

      expect(socket.adapter.connected).toBeFalse();
      expect(resolved).not.toHaveBeenCalled();

      websocket.finishClose();
      await disconnecting;

      expect(resolved).toHaveBeenCalledTimes(1);
    });

    it("should be a no-op when the socket was never connected", async () => {
      const socket = createManualSocket();
      const events = trackEvents(socket);

      await expect(socket.adapter.disconnect()).resolves.toBe(true);
      await expect(socket.adapter.disconnect()).resolves.toBe(true);

      expect(events).toStrictEqual([]);
    });

    it("should emit disconnected once when disconnect is called twice", async () => {
      const socket = createSocket();
      await openWebSocket();
      const events = trackEvents(socket);

      await Promise.all([socket.disconnect(), socket.disconnect()]);
      await socket.disconnect();

      expect(events).toStrictEqual(["connecting:false", "disconnected"]);
    });

    it("should cancel a connection that is still opening", async () => {
      const socket = createManualSocket();
      const events = trackEvents(socket);

      const connecting = socket.adapter.connect();
      const websocket = await waitForWebSocket();
      await socket.disconnect();

      await expect(connecting).resolves.toBe(false);
      expect(websocket.readyState).toBe(ControlledWebSocket.CLOSED);
      expect(events).toStrictEqual(["connecting:true", "connecting:false", "disconnected"]);
      expect(socket.adapter.connecting).toBeFalse();
      expect(socket.adapter.connected).toBeFalse();
    });

    it("should not reconnect after disconnecting a connection that is still opening", async () => {
      const socket = createManualSocket({ reconnectTime: 100 });
      const events = trackEvents(socket);

      socket.connect();
      await waitForWebSocket();
      await socket.disconnect();
      events.length = 0;

      await vi.advanceTimersByTimeAsync(1000);

      expect(events).toStrictEqual([]);
      expect(ControlledWebSocket.instances).toHaveLength(1);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should ignore a server that opens the connection after it was cancelled", async () => {
      ControlledWebSocket.autoFinishClose = false;
      const socket = createManualSocket();

      socket.connect();
      const websocket = await waitForWebSocket();
      socket.disconnect();
      const events = trackEvents(socket);
      // The handshake finished at the very moment the client gave up
      websocket.readyState = ControlledWebSocket.OPEN;
      websocket.dispatchEvent(new Event("open"));

      expect(events).toStrictEqual([]);
      expect(socket.adapter.connected).toBeFalse();
      websocket.finishClose();
    });

    it("should ignore frames arriving after disconnect", async () => {
      ControlledWebSocket.autoFinishClose = false;
      const socket = createSocket();
      const websocket = await openWebSocket();
      const spy = vi.fn();
      socket.createListener<number>()({ topic: "late" }).listen(spy);

      socket.disconnect();
      websocket.serverEmit("late", 1);

      expect(spy).not.toHaveBeenCalled();
      websocket.finishClose();
    });

    it("should allow connecting again after a disconnect", async () => {
      const socket = createSocket();
      await openWebSocket();
      await socket.disconnect();
      const events = trackEvents(socket);

      const connecting = socket.connect();
      await openWebSocket(2);
      await connecting;

      expect(events).toStrictEqual(["connecting:true", "connecting:false", "connected"]);
      expect(ControlledWebSocket.active).toHaveLength(1);
    });

    it("should connect again when connect is called while the previous transport is still closing", async () => {
      ControlledWebSocket.autoFinishClose = false;
      const socket = createSocket();
      const first = await openWebSocket();

      socket.disconnect();
      const connecting = socket.connect();
      const second = await openWebSocket(2);
      await connecting;
      // The old transport finishes closing only now - it must not affect the new connection
      first.finishClose();
      ControlledWebSocket.autoFinishClose = true;

      expect(socket.adapter.connected).toBeTrue();
      expect(second.readyState).toBe(ControlledWebSocket.OPEN);
    });

    it("should leave no timers behind", async () => {
      const socket = createSocket({ adapterOptions: { heartbeat: true, pingTimeout: 50, pongTimeout: 50 } });
      await openWebSocket();

      await socket.disconnect();

      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe("When the server closes the connection", () => {
    it.each([
      {
        code: 1001,
        message:
          'An endpoint is "going away", such as a server going down or a browser having navigated away from a page.',
      },
      {
        code: 1006,
        message: "The connection was closed abnormally, e.g., without sending or receiving a Close control frame",
      },
      {
        code: 1011,
        message:
          "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.",
      },
      { code: 4000, message: "Unknown reason" },
    ])("should report close code $code and schedule a reconnect", async ({ code, message }) => {
      const socket = createSocket({ reconnectTime: 100 });
      const websocket = await openWebSocket();
      const events = trackEvents(socket);

      websocket.serverClose({ code });

      expect(events).toStrictEqual(["connecting:false", "disconnected", `error:${message}`]);
      expect(socket.adapter.connected).toBeFalse();
      expect(vi.getTimerCount()).toBe(1);
    });

    it("should reconnect after a normal closure from the server", async () => {
      // Servers, proxies and load balancers close with 1000 on deploys and idle timeouts too
      const socket = createSocket({ reconnectTime: 100 });
      const websocket = await openWebSocket();
      const events = trackEvents(socket);

      websocket.serverClose({ code: 1000, wasClean: true });
      await vi.advanceTimersByTimeAsync(100);

      expect(events.slice(0, 3)).toStrictEqual([
        "connecting:false",
        "disconnected",
        "error:Normal closure, meaning that the purpose for which the connection was established has been fulfilled.",
      ]);
      expect(ControlledWebSocket.instances).toHaveLength(2);
    });

    it("should not reconnect a normal closure refused by shouldReconnect", async () => {
      const socket = createSocket({ reconnectTime: 100, shouldReconnect: ({ code }) => code !== 1000 });
      const websocket = await openWebSocket();
      socket.onError(() => null);

      websocket.serverClose({ code: 1000, wasClean: true });
      await vi.advanceTimersByTimeAsync(1000);

      expect(ControlledWebSocket.instances).toHaveLength(1);
    });

    it("should deliver the message that arrived right before the close", async () => {
      const socket = createSocket();
      const websocket = await openWebSocket();
      const order: string[] = [];
      socket
        .createListener<number>()({ topic: "last" })
        .listen(({ data }) => order.push(`message:${data}`));
      socket.events.onDisconnected(() => order.push("disconnected"));

      websocket.serverEmit("last", 1);
      websocket.serverClose({ code: 1006 });

      expect(order).toStrictEqual(["message:1", "disconnected"]);
    });

    it("should stop emitting through a connection closed by the server", async () => {
      const socket = createSocket();
      const websocket = await openWebSocket();
      const emitterError = vi.fn();
      socket.onError(() => null);
      socket.events.onEmitterError(({ error }) => emitterError(error.message));

      websocket.serverClose({ code: 1006 });
      socket.createEmitter<number>()({ topic: "after-close" }).emit({ payload: 1 });
      await flushPromises();

      expect(websocket.sent).toStrictEqual([]);
      expect(emitterError).toHaveBeenCalledWith("Cannot emit event when connection is not open");
    });
  });

  describe("When using many sockets", () => {
    it("should keep the connection state of every socket separate", async () => {
      const first = createSocket({ url: "ws://first" });
      const second = createSocket({ url: "ws://second" });
      const firstWebsocket = await openWebSocket(1);
      await openWebSocket(2);

      firstWebsocket.serverClose({ code: 1006 });

      expect(first.adapter.connected).toBeFalse();
      expect(second.adapter.connected).toBeTrue();
    });

    it("should route messages only to the listeners of the receiving socket", async () => {
      const first = createSocket({ url: "ws://first" });
      const second = createSocket({ url: "ws://second" });
      const firstWebsocket = await openWebSocket(1);
      await openWebSocket(2);
      const firstSpy = vi.fn();
      const secondSpy = vi.fn();
      first.createListener<number>()({ topic: "shared-topic" }).listen(firstSpy);
      second.createListener<number>()({ topic: "shared-topic" }).listen(secondSpy);

      firstWebsocket.serverEmit("shared-topic", 1);

      expect(firstSpy).toHaveBeenCalledTimes(1);
      expect(secondSpy).not.toHaveBeenCalled();
    });

    it("should keep listeners, callbacks and adapters of every socket separate", () => {
      const first = createManualSocket();
      const second = createManualSocket();
      first.onConnected(() => null).onError(() => null);
      first
        .createListener<number>()({ topic: "topic" })
        .listen(() => null);

      expect(first.adapter).not.toBe(second.adapter);
      expect(first.emitter).not.toBe(second.emitter);
      expect(first.appManager).not.toBe(second.appManager);
      expect(second.unstable_onConnectedCallbacks).toHaveLength(0);
      expect(second.unstable_onErrorCallbacks).toHaveLength(0);
      expect(second.adapter.listeners.size).toBe(0);
    });

    it("should disconnect one socket without touching the other", async () => {
      const first = createSocket({ url: "ws://first" });
      const second = createSocket({ url: "ws://second" });
      await openWebSocket(1);
      const secondWebsocket = await openWebSocket(2);

      await first.disconnect();

      expect(second.adapter.connected).toBeTrue();
      expect(secondWebsocket.closeCalls).toStrictEqual([]);
    });
  });
});
