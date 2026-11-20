import { getReconnectDelay } from "connection";
import type { Socket } from "socket";

import type { FakeAdapterType } from "../../utils/fake-transport";
import { FakeTransport, createFakeSocket, settle } from "../../utils/fake-transport";

const reconnectTime = 1000;
const maxReconnectTime = 30_000;
const connectionTimeout = 4000;
const minUptime = 5000;

type FakeSocketOptions = Parameters<typeof createFakeSocket>[0];

describe("Reconnection engine", () => {
  const sockets: Socket<FakeAdapterType>[] = [];
  let random = vi.spyOn(Math, "random");

  const createSocket = (options?: FakeSocketOptions) => {
    const socket = createFakeSocket({ reconnectTime, maxReconnectTime, connectionTimeout, minUptime, ...options });
    socket.onError(() => null);
    sockets.push(socket);
    return socket;
  };

  /** A socket with a ready connection */
  const createConnectedSocket = async (options?: FakeSocketOptions) => {
    const socket = createSocket(options);
    await settle();
    FakeTransport.last.serverReady();
    return socket;
  };

  const track = (socket: Socket<FakeAdapterType>) => {
    const events: string[] = [];
    socket.events.onConnected(() => events.push("connected"));
    socket.events.onDisconnected(() => events.push("disconnected"));
    socket.events.onReconnecting(({ attempts }) => events.push(`reconnecting:${attempts}`));
    socket.events.onReconnectingFailed(({ attempts }) => events.push(`failed:${attempts}`));
    return events;
  };

  /** Advances the clock and lets the attempt that follows open its transport */
  const advance = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms);
    await settle();
  };

  beforeEach(() => {
    FakeTransport.reset();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    // The lower end of the jitter - every delay is exactly the minimum unless a test says otherwise
    random = vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(async () => {
    await Promise.all(sockets.map((socket) => socket.destroy()));
    sockets.length = 0;
    random.mockRestore();
    vi.useRealTimers();
  });

  describe("When computing the reconnection delay", () => {
    it("should start at the minimum and never go below it", () => {
      expect(getReconnectDelay({ attempt: 0, min: 1000, max: 30_000, random: () => 0 })).toBe(1000);
      expect(getReconnectDelay({ attempt: 7, min: 1000, max: 30_000, random: () => 0 })).toBe(1000);
    });

    it("should double the jitter window with every attempt", () => {
      const delays = [0, 1, 2, 3].map((attempt) =>
        getReconnectDelay({ attempt, min: 1000, max: 30_000, random: () => 1 }),
      );

      expect(delays).toStrictEqual([2000, 3000, 5000, 9000]);
    });

    it("should never exceed the maximum", () => {
      expect(getReconnectDelay({ attempt: 10, min: 1000, max: 30_000, random: () => 1 })).toBe(30_000);
    });

    it("should stay finite for huge attempt numbers", () => {
      expect(getReconnectDelay({ attempt: 1e9, min: 1000, max: 30_000, random: () => 1 })).toBe(30_000);
    });

    it("should use the minimum when the maximum is lower", () => {
      expect(getReconnectDelay({ attempt: 3, min: 5000, max: 1000, random: () => 1 })).toBe(5000);
    });

    it("should spread the delays of many clients over the window", () => {
      random.mockRestore();
      const delays = Array.from({ length: 200 }, () => getReconnectDelay({ attempt: 3, min: 1000, max: 30_000 }));

      expect(Math.min(...delays)).toBeGreaterThanOrEqual(1000);
      expect(Math.max(...delays)).toBeLessThanOrEqual(9000);
      expect(new Set(delays).size).toBeGreaterThan(100);
    });
  });

  describe("When connecting", () => {
    it("should connect on creation with autoConnect", async () => {
      const socket = createSocket();
      await settle();

      expect(FakeTransport.instances).toHaveLength(1);
      expect(socket.adapter.connecting).toBeTrue();
    });

    it("should not connect on creation without autoConnect", async () => {
      createSocket({ adapterOptions: { autoConnect: false } });
      await settle();

      expect(FakeTransport.instances).toHaveLength(0);
    });

    it("should be connected only once the transport is ready", async () => {
      const socket = createSocket();
      await settle();
      expect(socket.adapter.connected).toBeFalse();

      FakeTransport.last.serverReady();

      expect(socket.adapter.connected).toBeTrue();
      expect(socket.adapter.connecting).toBeFalse();
    });

    it("should leave no timer when a connected callback disconnects", async () => {
      const socket = createSocket();
      socket.onConnected(() => {
        socket.disconnect();
      });
      await settle();

      FakeTransport.last.serverReady();
      await settle();

      expect(socket.adapter.connected).toBeFalse();
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should resolve connect() when the connection is ready", async () => {
      const socket = createSocket({ adapterOptions: { autoConnect: false } });

      const connected = socket.connect();
      await settle();
      FakeTransport.last.serverReady();

      await expect(connected).resolves.toBeUndefined();
      expect(socket.adapter.connected).toBeTrue();
    });

    it("should join concurrent connect() calls in one attempt", async () => {
      const socket = createSocket({ adapterOptions: { autoConnect: false } });

      socket.connect();
      socket.connect();
      socket.connect();
      await settle();

      expect(FakeTransport.instances).toHaveLength(1);
    });

    it("should not retry a transport that can't be created", async () => {
      const socket = createSocket({ adapterOptions: { failOpen: true } });
      const onError = vi.fn();
      socket.onError(onError);
      await advance(maxReconnectTime * 2);

      expect(FakeTransport.instances).toHaveLength(0);
      expect(socket.adapter.connecting).toBeFalse();
      expect(onError).toHaveBeenCalledWith({ error: new Error("Cannot open the transport") });
    });
  });

  describe("When the connection timeout passes", () => {
    it("should report the timeout and retry after the reconnection delay", async () => {
      const socket = createSocket();
      const onError = vi.fn();
      socket.onError(onError);
      await settle();
      const first = FakeTransport.last;

      await advance(connectionTimeout);

      expect(first.closed).toBeTrue();
      expect(onError).toHaveBeenCalledWith({
        error: expect.objectContaining({ message: expect.stringContaining("timeout") }),
      });
      expect(FakeTransport.instances).toHaveLength(1);

      await advance(reconnectTime);

      expect(FakeTransport.instances).toHaveLength(2);
    });

    it("should not time out a connection that is ready", async () => {
      await createConnectedSocket();

      await advance(connectionTimeout * 10);

      expect(FakeTransport.instances).toHaveLength(1);
      expect(FakeTransport.last.closed).toBeFalse();
    });

    it("should count the timed out attempts towards the limit", async () => {
      const socket = createSocket({ reconnect: 2 });
      const events = track(socket);
      await settle();

      await advance(connectionTimeout + reconnectTime);
      await advance(connectionTimeout + reconnectTime);
      await advance(connectionTimeout + reconnectTime);

      expect(events.filter((event) => event.startsWith("failed"))).toStrictEqual(["failed:2"]);
      expect(FakeTransport.instances).toHaveLength(3);
    });
  });

  describe("When the connection is lost", () => {
    it("should retry after the minimum delay", async () => {
      await createConnectedSocket();

      FakeTransport.last.serverLost();
      await advance(reconnectTime - 1);
      expect(FakeTransport.instances).toHaveLength(1);

      await advance(1);
      expect(FakeTransport.instances).toHaveLength(2);
    });

    it("should back off with growing delays while attempts fail", async () => {
      random.mockReturnValue(1);
      await createConnectedSocket();
      const gaps: number[] = [];
      let lastAttempt = Date.now();

      FakeTransport.last.serverLost();
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const count = FakeTransport.instances.length;
        while (FakeTransport.instances.length === count) {
          // eslint-disable-next-line no-await-in-loop
          await advance(100);
        }
        gaps.push(Date.now() - lastAttempt);
        lastAttempt = Date.now();
        FakeTransport.last.serverLost();
      }

      expect(gaps).toStrictEqual([2000, 3000, 5000, 9000]);
    });

    it("should keep a normal closure of the server closed", async () => {
      const socket = await createConnectedSocket();

      FakeTransport.last.serverLost({ code: 1000 });
      await advance(maxReconnectTime);

      expect(FakeTransport.instances).toHaveLength(1);
      expect(socket.adapter.connected).toBeFalse();
    });

    it("should connect a socket closed normally by the server when the network comes back", async () => {
      const socket = await createConnectedSocket();
      FakeTransport.last.serverLost({ code: 1000 });

      socket.appManager.setOnline(false);
      socket.appManager.setOnline(true);
      await settle();

      expect(FakeTransport.instances).toHaveLength(2);
    });

    it("should retry a normal closure when shouldReconnect allows it", async () => {
      await createConnectedSocket({ shouldReconnect: () => true });

      FakeTransport.last.serverLost({ code: 1000 });
      await advance(reconnectTime);

      expect(FakeTransport.instances).toHaveLength(2);
    });

    it("should retry a loss without a close code", async () => {
      await createConnectedSocket();

      FakeTransport.last.serverLost({ error: new Error("Network") });
      await advance(reconnectTime);

      expect(FakeTransport.instances).toHaveLength(2);
    });

    it("should report one disconnected event per lost connection", async () => {
      const socket = await createConnectedSocket();
      const events = track(socket);

      FakeTransport.last.serverLost();
      FakeTransport.last.serverLost();
      await advance(reconnectTime);
      FakeTransport.last.serverReady();

      expect(events).toStrictEqual(["disconnected", "reconnecting:0", "connected"]);
    });

    it("should stop after the reconnect limit", async () => {
      const socket = await createConnectedSocket({ reconnect: 2 });
      const events = track(socket);

      FakeTransport.last.serverLost();
      await advance(reconnectTime);
      FakeTransport.last.serverLost();
      await advance(reconnectTime * 2);
      FakeTransport.last.serverLost();
      await advance(maxReconnectTime * 2);

      expect(events.filter((event) => event.startsWith("failed"))).toStrictEqual(["failed:2"]);
      expect(FakeTransport.instances).toHaveLength(3);
      expect(FakeTransport.open).toHaveLength(0);
    });
  });

  describe("When the connection is not stable", () => {
    it("should keep counting attempts of connections that drop before minUptime", async () => {
      const socket = await createConnectedSocket({ reconnect: 2 });
      const events = track(socket);

      for (let attempt = 0; attempt < 4; attempt += 1) {
        FakeTransport.last.serverLost({ code: 4401 });
        // eslint-disable-next-line no-await-in-loop
        await advance(reconnectTime);
        FakeTransport.last?.serverReady();
      }

      expect(events).toContain("failed:2");
    });

    it("should reset the attempts once the connection stays up for minUptime", async () => {
      const socket = await createConnectedSocket();

      FakeTransport.last.serverLost();
      await advance(reconnectTime);
      FakeTransport.last.serverReady();
      expect(socket.adapter.reconnectionAttempts).toBe(1);

      await advance(minUptime - 1);
      expect(socket.adapter.reconnectionAttempts).toBe(1);

      await advance(1);
      expect(socket.adapter.reconnectionAttempts).toBe(0);
    });

    it("should start the backoff from the minimum after a stable connection", async () => {
      random.mockReturnValue(1);
      await createConnectedSocket();
      FakeTransport.last.serverLost();
      await advance(2000);
      FakeTransport.last.serverLost();
      await advance(3000);
      FakeTransport.last.serverReady();
      await advance(minUptime);

      FakeTransport.last.serverLost();
      await advance(1999);
      expect(FakeTransport.instances).toHaveLength(3);
      await advance(1);
      expect(FakeTransport.instances).toHaveLength(4);
    });
  });

  describe("When a retry policy is set", () => {
    it("should pass the attempt, elapsed time and reason to reconnectDelay", async () => {
      const reconnectDelay = vi.fn().mockReturnValue(700);
      await createConnectedSocket({ reconnectDelay });

      FakeTransport.last.serverLost({ code: 1006, reason: "gone" });
      await advance(700);
      FakeTransport.last.serverLost({ code: 1011 });

      expect(reconnectDelay.mock.calls).toStrictEqual([
        [{ attempt: 0, elapsed: 0, reason: { code: 1006, reason: "gone" } }],
        [{ attempt: 1, elapsed: 700, reason: { code: 1011 } }],
      ]);
      expect(FakeTransport.instances).toHaveLength(2);
    });

    it("should stop reconnecting when reconnectDelay returns null", async () => {
      const socket = await createConnectedSocket({ reconnectDelay: () => null });
      const events = track(socket);

      FakeTransport.last.serverLost();
      await advance(maxReconnectTime * 2);

      expect(events).toStrictEqual(["disconnected", "failed:0"]);
      expect(FakeTransport.instances).toHaveLength(1);
    });

    it.each([Number.NaN, Number.POSITIVE_INFINITY])("should fall back to the minimum delay for %s", async (delay) => {
      await createConnectedSocket({ reconnectDelay: () => delay });

      FakeTransport.last.serverLost();
      await advance(reconnectTime);

      expect(FakeTransport.instances).toHaveLength(2);
    });

    it("should stop and report an error thrown by reconnectDelay", async () => {
      const socket = await createConnectedSocket({
        reconnectDelay: () => {
          throw new Error("Bad policy");
        },
      });
      const onError = vi.fn();
      socket.onError(onError);

      FakeTransport.last.serverLost();
      await advance(maxReconnectTime);

      expect(onError).toHaveBeenCalledWith({ error: new Error("Bad policy") });
      expect(FakeTransport.instances).toHaveLength(1);
    });
  });

  describe("When deciding which losses are retried", () => {
    it("should not retry a loss the socket's shouldReconnect refuses", async () => {
      const shouldReconnect = vi.fn(({ code }: { code?: number }) => code !== 4401);
      const socket = await createConnectedSocket({ shouldReconnect });

      FakeTransport.last.serverLost({ code: 4401, reason: "Unauthorized" });
      await advance(maxReconnectTime);

      expect(shouldReconnect).toHaveBeenCalledWith({ code: 4401, reason: "Unauthorized" });
      expect(FakeTransport.instances).toHaveLength(1);
      expect(socket.adapter.connected).toBeFalse();
    });

    it("should use the protocol default of the adapter", async () => {
      await createConnectedSocket({ shouldReconnectByProtocol: ({ code }) => code !== 4400 });

      FakeTransport.last.serverLost({ code: 4400 });
      await advance(maxReconnectTime);

      expect(FakeTransport.instances).toHaveLength(1);
    });

    it("should let the socket option win over the protocol default", async () => {
      await createConnectedSocket({
        shouldReconnectByProtocol: () => false,
        shouldReconnect: () => true,
      });

      FakeTransport.last.serverLost({ code: 4400 });
      await advance(reconnectTime);

      expect(FakeTransport.instances).toHaveLength(2);
    });

    it("should stop and report an error thrown by shouldReconnect", async () => {
      const socket = await createConnectedSocket({
        shouldReconnect: () => {
          throw new Error("Bad decision");
        },
      });
      const onError = vi.fn();
      socket.onError(onError);

      FakeTransport.last.serverLost();
      await advance(maxReconnectTime);

      expect(onError).toHaveBeenCalledWith({ error: new Error("Bad decision") });
      expect(FakeTransport.instances).toHaveLength(1);
    });

    it("should connect again by hand after a refused loss", async () => {
      const socket = await createConnectedSocket({ shouldReconnect: () => false });
      FakeTransport.last.serverLost({ code: 4401 });

      socket.connect();
      await settle();

      expect(FakeTransport.instances).toHaveLength(2);
    });
  });

  describe("When the network changes", () => {
    it("should drop the connection when going offline", async () => {
      const socket = await createConnectedSocket();
      const events = track(socket);

      socket.appManager.setOnline(false);

      expect(FakeTransport.last.closed).toBeTrue();
      expect(socket.adapter.connected).toBeFalse();
      expect(events).toStrictEqual(["disconnected"]);
    });

    it("should not attempt or count anything while offline", async () => {
      const socket = await createConnectedSocket({ reconnect: 1 });
      const events = track(socket);

      socket.appManager.setOnline(false);
      await advance(maxReconnectTime * 10);

      expect(FakeTransport.instances).toHaveLength(1);
      expect(socket.adapter.reconnectionAttempts).toBe(0);
      expect(events).toStrictEqual(["disconnected"]);
    });

    it("should connect at once when the network is back", async () => {
      const socket = await createConnectedSocket();
      socket.appManager.setOnline(false);

      socket.appManager.setOnline(true);
      await settle();
      FakeTransport.last.serverReady();

      expect(FakeTransport.instances).toHaveLength(2);
      expect(socket.adapter.connected).toBeTrue();
    });

    it("should cancel a pending retry when going offline", async () => {
      await createConnectedSocket();
      FakeTransport.last.serverLost();

      sockets[0].appManager.setOnline(false);
      await advance(maxReconnectTime);

      expect(FakeTransport.instances).toHaveLength(1);
    });

    it("should recover a socket connected by hand without autoConnect", async () => {
      const socket = createSocket({ adapterOptions: { autoConnect: false } });
      socket.connect();
      await settle();
      FakeTransport.last.serverReady();

      socket.appManager.setOnline(false);
      FakeTransport.last.serverLost();
      await advance(reconnectTime);
      socket.appManager.setOnline(true);
      await settle();

      expect(FakeTransport.instances).toHaveLength(2);
    });

    it("should not connect on the online event a socket that never connected", async () => {
      const socket = createSocket({ adapterOptions: { autoConnect: false } });

      socket.appManager.setOnline(false);
      socket.appManager.setOnline(true);
      await settle();

      expect(FakeTransport.instances).toHaveLength(0);
    });

    it("should stay disconnected on the online event after disconnect()", async () => {
      const socket = await createConnectedSocket();
      await socket.disconnect();

      socket.appManager.setOnline(false);
      socket.appManager.setOnline(true);
      await settle();

      expect(FakeTransport.instances).toHaveLength(1);
    });

    it("should keep a connection that is online twice", async () => {
      const socket = await createConnectedSocket();

      socket.appManager.setOnline(true);
      await settle();

      expect(FakeTransport.instances).toHaveLength(1);
      expect(socket.adapter.connected).toBeTrue();
    });

    it("should connect on the online event after the attempts ran out", async () => {
      const socket = await createConnectedSocket({ reconnect: 0 });
      FakeTransport.last.serverLost();
      await advance(reconnectTime);

      socket.appManager.setOnline(false);
      socket.appManager.setOnline(true);
      await settle();

      expect(FakeTransport.instances).toHaveLength(2);
    });
  });

  describe("When the app gets the focus back", () => {
    it("should skip the rest of the reconnection delay", async () => {
      const socket = await createConnectedSocket({ reconnectTime: 20_000 });
      FakeTransport.last.serverLost();
      await advance(100);

      socket.appManager.setFocused(true);
      await settle();

      expect(FakeTransport.instances).toHaveLength(2);
    });

    it("should leave a ready connection alone", async () => {
      const socket = await createConnectedSocket();

      socket.appManager.setFocused(true);
      await settle();

      expect(FakeTransport.instances).toHaveLength(1);
    });

    it("should not connect a socket disconnected on purpose", async () => {
      const socket = await createConnectedSocket();
      await socket.disconnect();

      socket.appManager.setFocused(true);
      await settle();

      expect(FakeTransport.instances).toHaveLength(1);
    });
  });

  describe("When the transport recovers by itself", () => {
    it("should report the interruption as disconnected and connecting", async () => {
      const socket = await createConnectedSocket();
      const events = track(socket);

      FakeTransport.last.serverInterrupt();

      expect(socket.adapter.connected).toBeFalse();
      expect(socket.adapter.connecting).toBeTrue();
      expect(events).toStrictEqual(["disconnected"]);
    });

    it("should be connected again when the same transport recovers", async () => {
      const socket = await createConnectedSocket();
      FakeTransport.last.serverInterrupt();

      FakeTransport.last.serverReady();

      expect(socket.adapter.connected).toBeTrue();
      expect(FakeTransport.instances).toHaveLength(1);
    });

    it("should replace a transport that does not recover in time", async () => {
      await createConnectedSocket();
      const interrupted = FakeTransport.last;
      interrupted.serverInterrupt();

      await advance(connectionTimeout + reconnectTime);

      expect(interrupted.closed).toBeTrue();
      expect(FakeTransport.instances).toHaveLength(2);
    });
  });

  describe("When disconnecting and reconnecting by hand", () => {
    it("should cancel the pending retry and close the transport on disconnect()", async () => {
      const socket = await createConnectedSocket();
      FakeTransport.last.serverLost();

      await socket.disconnect();
      await advance(maxReconnectTime * 2);

      expect(FakeTransport.instances).toHaveLength(1);
      expect(FakeTransport.open).toHaveLength(0);
    });

    it("should stop an attempt that is still opening", async () => {
      const socket = createSocket();
      await settle();

      await socket.disconnect();
      await advance(connectionTimeout + maxReconnectTime);

      expect(FakeTransport.instances).toHaveLength(1);
      expect(FakeTransport.last.closed).toBeTrue();
      expect(socket.adapter.connecting).toBeFalse();
    });

    it("should skip the reconnection delay on connect()", async () => {
      const socket = await createConnectedSocket({ reconnectTime: 20_000 });
      FakeTransport.last.serverLost();

      socket.connect();
      await settle();

      expect(FakeTransport.instances).toHaveLength(2);
      await advance(20_000);
      expect(FakeTransport.instances).toHaveLength(2);
    });

    it("should replace a ready connection on reconnect()", async () => {
      const socket = await createConnectedSocket();
      const first = FakeTransport.last;

      socket.reconnect();
      await settle();

      expect(first.closed).toBeTrue();
      expect(FakeTransport.instances).toHaveLength(2);
    });

    it("should start a fresh outage on reconnect() after the attempts ran out", async () => {
      const socket = await createConnectedSocket({ reconnect: 1 });
      const events = track(socket);
      FakeTransport.last.serverLost();
      await advance(reconnectTime);
      FakeTransport.last.serverLost();
      await advance(maxReconnectTime);
      expect(events).toContain("failed:1");

      socket.reconnect();
      await settle();

      expect(FakeTransport.instances).toHaveLength(3);
      expect(events.at(-1)).toBe("reconnecting:0");
    });

    it("should never refuse reconnect() by hand, also with no automatic attempts", async () => {
      const socket = await createConnectedSocket({ reconnect: 0 });
      const events = track(socket);

      socket.reconnect();
      await settle();
      socket.reconnect();
      await settle();

      expect(FakeTransport.instances).toHaveLength(3);
      expect(events).not.toContain("failed:0");
      expect(socket.adapter.reconnectionAttempts).toBe(0);
    });

    it("should connect on reconnect() after disconnect()", async () => {
      const socket = await createConnectedSocket();
      await socket.disconnect();

      socket.reconnect();
      await settle();

      expect(FakeTransport.instances).toHaveLength(2);
    });
  });

  describe("When transports report late", () => {
    it("should ignore a replaced transport", async () => {
      const socket = await createConnectedSocket();
      const first = FakeTransport.last;
      socket.reconnect();
      await settle();

      first.serverLost();
      first.serverReady();

      expect(socket.adapter.connected).toBeFalse();
      expect(socket.adapter.connecting).toBeTrue();
      await advance(reconnectTime);
      expect(FakeTransport.instances).toHaveLength(2);
    });

    it("should ignore a transport closed on purpose", async () => {
      const socket = await createConnectedSocket();
      const transport = FakeTransport.last;
      await socket.disconnect();

      transport.serverReady();
      transport.serverLost();
      await advance(maxReconnectTime);

      expect(socket.adapter.connected).toBeFalse();
      expect(FakeTransport.instances).toHaveLength(1);
    });
  });

  describe("When the socket is destroyed", () => {
    it("should react to nothing anymore", async () => {
      const socket = await createConnectedSocket();
      FakeTransport.last.serverLost();

      await socket.destroy();
      socket.appManager.setOnline(false);
      socket.appManager.setOnline(true);
      socket.appManager.setFocused(true);
      await advance(maxReconnectTime * 2);

      expect(FakeTransport.instances).toHaveLength(1);
    });
  });
});
