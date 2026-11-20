import { createControlledFetch, flushPromises } from "../../utils/controlled-fetch";
import { createStreamSocket, serialize, streamUrl } from "../../utils/stream-socket";

const defaultPayload = { id: 1 };

describe("Orpc Stream Adapter [ Lifecycle ]", () => {
  let server = createControlledFetch();
  let setup = createStreamSocket();

  const recreate = async (options: Parameters<typeof createStreamSocket>[0]) => {
    await setup.socket.disconnect();
    setup = createStreamSocket(options);
    await flushPromises();
  };

  const subscribe = async (payload: { id: number } = defaultPayload) => {
    const callback = vi.fn();
    const unsubscribe = setup.onUpdate.setPayload(payload).listen(({ data, extra }) => callback(data, extra));
    await flushPromises();
    return { callback, unsubscribe };
  };

  const advance = async (ms: number) => {
    vi.advanceTimersByTime(ms);
    await flushPromises();
  };

  /** The network fails, then the restart delay passes */
  const failAndWait = async (ms: number) => {
    server.last().fail();
    await flushPromises();
    await advance(ms);
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    server = createControlledFetch();
    setup = createStreamSocket();
    await flushPromises();
  });

  afterEach(async () => {
    await setup.socket.disconnect();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("when connecting", () => {
    it("should connect on creation without opening any stream", () => {
      expect(setup.socket.adapter.connected).toBeTrue();
      expect(setup.socket.adapter.connecting).toBeFalse();
      expect(server.calls).toHaveLength(0);
    });

    it("should report the connection events", async () => {
      const connected = vi.fn();
      const connecting = vi.fn();
      setup.socket.events.onConnected(connected);
      setup.socket.events.onConnecting(connecting);

      await setup.socket.disconnect();
      await setup.socket.connect();

      expect(connected).toHaveBeenCalledOnce();
      expect(connecting.mock.calls).toStrictEqual([
        [{ connecting: false }],
        [{ connecting: true }],
        [{ connecting: false }],
      ]);
    });

    it("should start the listeners added before connecting when it connects", async () => {
      await recreate({ adapterOptions: { autoConnect: false } });
      const { callback } = await subscribe();

      expect(setup.socket.adapter.connected).toBeFalse();
      expect(server.calls).toHaveLength(0);

      await setup.socket.connect();
      await flushPromises();
      expect(server.calls).toHaveLength(1);

      server.last().open();
      server.last().send({ data: serialize({ id: 1, name: "a" }) });
      await flushPromises();
      expect(callback).toHaveBeenCalledOnce();
    });

    it("should open the streams with the connection details of the onConnect interceptors", async () => {
      await recreate({ adapterOptions: { autoConnect: false } });
      setup.socket.onConnect(({ connection, attempt }) => ({
        ...connection,
        url: "http://other:4000/rpc",
        adapterOptions: { headers: { authorization: `Bearer ${attempt}` } },
      }));
      await subscribe();

      await setup.socket.connect();
      await flushPromises();

      expect(server.last().url).toBe("http://other:4000/rpc/planet/onUpdate");
      expect(server.last().headers.authorization).toBe("Bearer 0");
    });

    it("should open the streams when an interceptor removes the adapter options", async () => {
      await recreate({ adapterOptions: { autoConnect: false, headers: { authorization: "Bearer 1" } } });
      setup.socket.onConnect(({ connection }) => ({ ...connection, adapterOptions: undefined }));
      await subscribe();

      await setup.socket.connect();
      await flushPromises();

      expect(server.last().headers).toStrictEqual({ "Content-Type": "application/json" });
    });

    it("should join a connection attempt in progress", async () => {
      await recreate({ adapterOptions: { autoConnect: false } });
      let release = () => {};
      setup.socket.onConnect(async ({ connection }) => {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return connection;
      });

      const first = setup.socket.adapter.connect();
      await flushPromises();
      const second = setup.socket.adapter.connect();
      release();

      await expect(Promise.all([first, second])).resolves.toStrictEqual([true, true]);
      expect(setup.socket.adapter.connected).toBeTrue();
    });

    it("should resolve with the current state when it can't connect right now", async () => {
      await expect(setup.socket.adapter.connect()).resolves.toBeTrue();

      await setup.socket.disconnect();
      setup.socket.appManager.setOnline(false);
      await expect(setup.socket.adapter.connect()).resolves.toBeFalse();
    });

    it("should start a listener added by an onConnected callback once", async () => {
      await recreate({ adapterOptions: { autoConnect: false } });
      await subscribe();
      setup.socket.onConnected(() => {
        setup.onUpdate.setPayload({ id: 2 }).listen(vi.fn());
      });

      await setup.socket.connect();
      await flushPromises();

      expect(server.calls.map((call) => call.body)).toStrictEqual([{ json: { id: 2 } }, { json: { id: 1 } }]);
    });
  });

  describe("when disconnecting", () => {
    it("should abort every stream and keep the listeners", async () => {
      const { callback } = await subscribe({ id: 1 });
      await subscribe({ id: 2 });
      server.calls.forEach((call) => call.open());
      const disconnected = vi.fn();
      setup.socket.events.onDisconnected(disconnected);

      await setup.socket.disconnect();
      server.calls[0].send({ data: serialize({ id: 1, name: "late" }) });
      await flushPromises();

      expect(server.calls.every((call) => call.aborted)).toBeTrue();
      expect(setup.socket.adapter.connected).toBeFalse();
      expect(setup.socket.adapter.forceClosed).toBeTrue();
      expect(disconnected).toHaveBeenCalledOnce();
      expect(callback).not.toHaveBeenCalled();
      expect(setup.socket.adapter.listeners.get("planet/onUpdate")?.size).toBe(2);
      expect(setup.errors).toStrictEqual([]);
    });

    it("should not report the disconnect of a socket that was not connected", async () => {
      await recreate({ adapterOptions: { autoConnect: false } });
      const disconnected = vi.fn();
      setup.socket.events.onDisconnected(disconnected);

      await setup.socket.disconnect();

      expect(disconnected).not.toHaveBeenCalled();
    });

    it("should start the streams again with the last event id on connect", async () => {
      await subscribe();
      server.last().open();
      server.last().send({ data: serialize({ id: 1, name: "a" }), id: "5" });
      await flushPromises();

      await setup.socket.disconnect();
      await setup.socket.connect();
      await flushPromises();

      expect(server.calls).toHaveLength(2);
      expect(server.last().headers["last-event-id"]).toBe("5");
    });

    it("should stay disconnected when the app goes online", async () => {
      await subscribe();
      await setup.socket.disconnect();

      setup.socket.appManager.setOnline(false);
      setup.socket.appManager.setOnline(true);
      await flushPromises();

      expect(setup.socket.adapter.connected).toBeFalse();
      expect(server.calls).toHaveLength(1);
    });
  });

  describe("when reconnecting", () => {
    it("should start every stream again with the id of its last event", async () => {
      await subscribe({ id: 1 });
      await subscribe({ id: 2 });
      server.calls[0].open();
      server.calls[0].send({ data: serialize({ id: 1, name: "a" }), id: "10" });
      await flushPromises();
      const reconnecting = vi.fn();
      setup.socket.events.onReconnecting(reconnecting);

      await setup.socket.reconnect();
      await flushPromises();

      expect(reconnecting).toHaveBeenCalledOnce();
      expect(server.calls.slice(0, 2).every((call) => call.aborted)).toBeTrue();
      expect(server.active()).toHaveLength(2);
      expect(server.calls.slice(2).map((call) => [call.body, call.headers["last-event-id"]])).toStrictEqual([
        [{ json: { id: 1 } }, "10"],
        [{ json: { id: 2 } }, undefined],
      ]);
    });

    it("should deliver the events of the new stream only", async () => {
      const { callback } = await subscribe();
      const old = server.last();
      old.open();

      await setup.socket.reconnect();
      await flushPromises();
      server.last().open();
      old.send({ data: serialize({ id: 1, name: "old" }) });
      server.last().send({ data: serialize({ id: 1, name: "new" }) });
      await flushPromises();

      expect(callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "new" }, { id: undefined, retry: undefined });
    });

    it("should not start a stream the server ended", async () => {
      await subscribe();
      server.last().open();
      server.last().send({ data: serialize({ id: 1, name: "a" }), id: "3" });
      server.last().send({ event: "done" });
      await flushPromises();

      await setup.socket.reconnect();
      await flushPromises();

      expect(server.calls).toHaveLength(1);
      expect(setup.socket.adapter.listeners.get("planet/onUpdate")?.size ?? 0).toBe(0);
    });

    it("should connect after a manual disconnect", async () => {
      await subscribe();
      await setup.socket.disconnect();

      await setup.socket.reconnect();
      await flushPromises();

      expect(setup.socket.adapter.connected).toBeTrue();
      expect(server.active()).toHaveLength(1);
    });

    it("should let disconnect called while reconnecting win", async () => {
      await subscribe();

      const reconnecting = setup.socket.reconnect();
      // The previous streams are closed, the new ones are not started yet
      await setup.socket.disconnect();
      await reconnecting;
      await flushPromises();

      expect(setup.socket.adapter.connected).toBeFalse();
      expect(setup.socket.adapter.reconnectionAttempts).toBe(0);
      expect(server.active()).toHaveLength(0);
    });

    it("should not be refused by the reconnect attempts of the socket", async () => {
      await recreate({ reconnect: 0 });
      await subscribe();
      const failed = vi.fn();
      setup.socket.events.onReconnectingFailed(failed);

      await setup.socket.reconnect();
      await flushPromises();

      expect(failed).not.toHaveBeenCalled();
      expect(setup.socket.adapter.connected).toBeTrue();
      expect(server.active()).toHaveLength(1);
    });
  });

  describe("when the transport fails", () => {
    it("should report the failure and start the stream again with the last event id", async () => {
      const { callback } = await subscribe();
      server.last().open();
      server.last().send({ data: serialize({ id: 1, name: "a" }), id: "1" });
      await flushPromises();

      server.last().break(new TypeError("terminated"));
      await flushPromises();

      expect(setup.errors.map(({ message }) => message)).toStrictEqual(["terminated"]);
      expect(server.calls).toHaveLength(1);

      await advance(5000);
      expect(server.calls).toHaveLength(2);
      expect(server.last().headers["last-event-id"]).toBe("1");

      server.last().open();
      server.last().send({ data: serialize({ id: 1, name: "b" }), id: "2" });
      await flushPromises();
      expect(callback.mock.calls.map(([data]) => data.name)).toStrictEqual(["a", "b"]);
    });

    it("should report a failure that is not an error", async () => {
      await subscribe();

      server.last().fail("offline");
      await flushPromises();

      expect(setup.errors.map(({ message }) => message)).toStrictEqual(["offline"]);
    });

    it("should wait the retry delay of the last event", async () => {
      await subscribe();
      server.last().open();
      server.last().send({ data: serialize({ id: 1, name: "a" }), retry: 200 });
      await flushPromises();

      server.last().break();
      await flushPromises();
      await advance(199);
      expect(server.calls).toHaveLength(1);

      await advance(1);
      expect(server.calls).toHaveLength(2);
    });

    it("should report a stream cut in the middle of a message", async () => {
      await subscribe();
      server.last().open();
      server.last().write("data: {");
      server.last().close();
      await flushPromises();

      expect(setup.errors.map(({ message }) => message)).toStrictEqual([
        "The event stream ended before the last message was complete",
      ]);
      await advance(5000);
      expect(server.calls).toHaveLength(2);
    });

    it("should start again when the stream does not open in time", async () => {
      await subscribe();

      await advance(5000);

      expect(server.calls[0].aborted).toBeTrue();
      expect(setup.errors.map(({ message }) => message)).toStrictEqual([
        'The stream of "planet/onUpdate" did not open in 5000ms',
      ]);
      await advance(5000);
      expect(server.calls).toHaveLength(2);
    });

    it("should not time out a stream that opened", async () => {
      await subscribe();
      server.last().open();
      await flushPromises();

      await advance(60_000);

      expect(server.calls).toHaveLength(1);
      expect(server.last().aborted).toBeFalse();
      expect(setup.errors).toStrictEqual([]);
    });

    it("should stop after the reconnect attempts of the socket", async () => {
      await recreate({ reconnect: 2, reconnectTime: 100 });
      await subscribe();

      await failAndWait(100);
      await failAndWait(100);
      await failAndWait(100);

      expect(server.calls).toHaveLength(3);
      expect(setup.errors.map(({ message }) => message)).toStrictEqual([
        "fetch failed",
        "fetch failed",
        "fetch failed",
        'Stopped restarting the stream of "planet/onUpdate" after 2 attempts',
      ]);
    });

    it("should count the attempts from the beginning after the stream opened", async () => {
      await recreate({ reconnect: 1, reconnectTime: 100 });
      await subscribe();

      await failAndWait(100);
      server.last().open();
      await flushPromises();
      server.last().break();
      await flushPromises();
      await advance(100);

      expect(server.calls).toHaveLength(3);
      expect(setup.errors.map(({ message }) => message)).toStrictEqual(["fetch failed", "terminated"]);
    });

    it("should start a stream that failed while offline when the app is online", async () => {
      await subscribe();
      setup.socket.appManager.setOnline(false);
      server.last().fail();
      await flushPromises();
      await advance(5000);
      expect(server.calls).toHaveLength(1);

      setup.socket.appManager.setOnline(true);
      await flushPromises();

      expect(server.calls).toHaveLength(2);
    });

    it("should start a waiting stream right away when the app is online", async () => {
      await subscribe();
      await subscribe({ id: 2 });
      server.calls[0].fail();
      await flushPromises();

      // Going offline aborts the running stream and the wait of the failed one, online starts both again
      setup.socket.appManager.setOnline(false);
      setup.socket.appManager.setOnline(true);
      await flushPromises();
      expect(server.calls).toHaveLength(4);
      expect(server.active().map((call) => call.body)).toStrictEqual([{ json: { id: 1 } }, { json: { id: 2 } }]);

      // The cleared delay does not start it once more
      await advance(5000);
      expect(server.calls).toHaveLength(4);
    });

    it("should not start a stream that waits when its last listener unsubscribes", async () => {
      const { unsubscribe } = await subscribe();
      server.last().fail();
      await flushPromises();

      unsubscribe();
      await advance(5000);

      expect(server.calls).toHaveLength(1);
    });

    it("should not start a stream that waits after disconnecting", async () => {
      await subscribe();
      server.last().fail();
      await flushPromises();

      await setup.socket.disconnect();
      await advance(5000);

      expect(server.calls).toHaveLength(1);
    });
  });

  describe("when the app goes online", () => {
    it("should connect a socket that failed to connect", async () => {
      await setup.socket.disconnect();
      setup = createStreamSocket();
      let failing = true;
      setup.socket.onConnect(({ connection }) => {
        if (failing) {
          throw new Error("No token yet");
        }
        return connection;
      });
      await flushPromises();
      await subscribe();
      expect(setup.socket.adapter.connected).toBeFalse();
      expect(setup.errors.map(({ message }) => message)).toStrictEqual(["No token yet"]);

      failing = false;
      setup.socket.appManager.setOnline(false);
      setup.socket.appManager.setOnline(true);
      await flushPromises();

      expect(setup.socket.adapter.connected).toBeTrue();
      expect(server.calls).toHaveLength(1);
      expect(server.last().url).toBe(`${streamUrl}/planet/onUpdate`);
    });

    it("should abort every stream offline and start them again with the last event id online", async () => {
      const { callback } = await subscribe();
      const first = server.last();
      first.open();
      first.send({ data: serialize({ id: 1, name: "a" }), id: "6" });
      await flushPromises();

      setup.socket.appManager.setOnline(false);
      await flushPromises();
      first.send({ data: serialize({ id: 1, name: "late" }) });
      await advance(60_000);

      expect(first.aborted).toBeTrue();
      expect(setup.socket.adapter.connected).toBeFalse();
      expect(server.calls).toHaveLength(1);

      setup.socket.appManager.setOnline(true);
      await flushPromises();
      server.last().open();
      server.last().send({ data: serialize({ id: 1, name: "b" }) });
      await flushPromises();

      expect(setup.socket.adapter.connected).toBeTrue();
      expect(server.calls).toHaveLength(2);
      expect(server.last().headers["last-event-id"]).toBe("6");
      expect(callback.mock.calls.map(([data]) => data.name)).toStrictEqual(["a", "b"]);
    });

    it("should connect a socket connected by hand without autoConnect again", async () => {
      await recreate({ adapterOptions: { autoConnect: false } });
      await subscribe();
      await setup.socket.connect();
      await flushPromises();

      setup.socket.appManager.setOnline(false);
      setup.socket.appManager.setOnline(true);
      await flushPromises();

      expect(setup.socket.adapter.connected).toBeTrue();
      expect(server.calls).toHaveLength(2);
      expect(server.active()).toHaveLength(1);
    });

    it("should not connect a socket without autoConnect", async () => {
      await recreate({ adapterOptions: { autoConnect: false } });

      setup.socket.appManager.setOnline(false);
      setup.socket.appManager.setOnline(true);
      await flushPromises();

      expect(setup.socket.adapter.connected).toBeFalse();
    });
  });
});
