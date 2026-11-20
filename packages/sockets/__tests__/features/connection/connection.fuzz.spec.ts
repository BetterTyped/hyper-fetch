import type { Socket } from "socket";

import type { FakeAdapterType } from "../../utils/fake-transport";
import { FakeTransport, createFakeSocket, settle } from "../../utils/fake-transport";

/**
 * Seeded random sequences of everything that can happen to a connection - the server opening, dropping and
 * recovering transports, stale transports reporting late, the network and the focus changing, and the user calling
 * connect, disconnect and reconnect. The invariants are checked after every step, so a failing seed points at the
 * exact sequence that broke them.
 */

const seeds = 300;
const steps = 80;

const reconnectTime = 1000;
const maxReconnectTime = 30_000;
const connectionTimeout = 4000;
const minUptime = 5000;

/** xorshift32 - small, fast and good enough to explore sequences reproducibly */
const createRandom = (seed: number) => {
  let state = seed;
  return () => {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    // The sign bit makes the state negative half of the time - fold it into [0, 1)
    return Math.abs(state % 1_000_000) / 1_000_000;
  };
};

type OperationType =
  | "ready"
  | "lost"
  | "interrupt"
  | "staleLost"
  | "staleReady"
  | "offline"
  | "online"
  | "focus"
  | "connect"
  | "disconnect"
  | "reconnect"
  | "advance";

const operations: OperationType[] = [
  "ready",
  "ready",
  "lost",
  "lost",
  "interrupt",
  "staleLost",
  "staleReady",
  "offline",
  "online",
  "focus",
  "connect",
  "disconnect",
  "reconnect",
  "advance",
  "advance",
  "advance",
];

const closeCodes = [1000, 1001, 1006, 1011, 4000, 4401];

describe("Reconnection engine [ Random sequences ]", () => {
  let socket: Socket<FakeAdapterType> | null = null;

  beforeEach(() => {
    FakeTransport.reset();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  });

  afterEach(async () => {
    await socket?.destroy();
    socket = null;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it.each(Array.from({ length: seeds }, (_, seed) => seed + 1))(
    "should keep the invariants for seed %i",
    async (seed) => {
      const random = createRandom(seed);
      vi.spyOn(Math, "random").mockImplementation(random);
      const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)];

      const limit = random() < 0.5 ? Infinity : Math.floor(random() * 6);
      const current = createFakeSocket({
        reconnect: limit,
        reconnectTime,
        maxReconnectTime,
        connectionTimeout,
        minUptime,
        adapterOptions: { autoConnect: random() < 0.7 },
      });
      socket = current;
      current.onError(() => null);

      const history: string[] = [];
      const events: string[] = [];
      current.events.onConnected(() => events.push("connected"));
      current.events.onDisconnected(() => events.push("disconnected"));

      const check = (step: number) => {
        const where = `seed ${seed}, step ${step}: ${history.join(" > ")}`;
        const open = FakeTransport.open;

        // One live transport at most - every replaced one is closed
        expect(open.length, where).toBeLessThanOrEqual(1);
        // Connected means a transport carries the connection
        if (current.adapter.connected) {
          expect(open, where).toHaveLength(1);
          expect(current.adapter.connecting, where).toBeFalse();
        }
        // Never connected twice in a row without a disconnection in between
        const last = events.lastIndexOf("connected");
        if (last > 0) {
          expect(
            events.slice(0, last).lastIndexOf("connected") < events.slice(0, last).lastIndexOf("disconnected") ||
              events.slice(0, last).lastIndexOf("connected") === -1,
            where,
          ).toBeTrue();
        }
        if (Number.isFinite(limit)) {
          expect(current.adapter.reconnectionAttempts, where).toBeLessThanOrEqual(limit);
        }
      };

      await settle();
      check(0);

      for (let step = 1; step <= steps; step += 1) {
        const operation = pick(operations);
        history.push(operation);
        const latest = FakeTransport.last;
        const stale = FakeTransport.instances.filter((transport) => transport !== latest);

        const where = `seed ${seed}, step ${step}: ${history.join(" > ")}`;
        const run: Record<OperationType, () => unknown> = {
          ready: () => latest?.serverReady(),
          lost: () => latest?.serverLost({ code: pick(closeCodes) }),
          interrupt: () => latest?.serverInterrupt(),
          staleLost: () => (stale.length > 0 ? pick(stale).serverLost({ code: 1006 }) : null),
          staleReady: () => (stale.length > 0 ? pick(stale).serverReady() : null),
          offline: () => current.appManager.setOnline(false),
          online: () => current.appManager.setOnline(true),
          focus: () => current.appManager.setFocused(true),
          connect: () => {
            // Not awaited - it resolves only once a transport opens, which is up to the next steps
            current.connect();
          },
          reconnect: async () => {
            const before = FakeTransport.instances.length;
            current.reconnect();
            await settle();
            if (current.appManager.isOnline) {
              // reconnect() always starts an attempt while online
              expect(FakeTransport.instances.length, where).toBe(before + 1);
            }
          },
          disconnect: async () => {
            await current.disconnect();
            await settle();
            // Nothing is left behind - no transport, no timer
            expect(FakeTransport.open, where).toHaveLength(0);
            expect(vi.getTimerCount(), where).toBe(0);
          },
          advance: () => vi.advanceTimersByTimeAsync(Math.floor(random() * (maxReconnectTime + connectionTimeout))),
        };
        // eslint-disable-next-line no-await-in-loop
        await run[operation]();

        // eslint-disable-next-line no-await-in-loop
        await settle();
        check(step);
      }

      // Never wedged - whatever happened, the socket connects again when asked to
      current.appManager.setOnline(true);
      current.connect();
      await settle();
      FakeTransport.last?.serverReady();
      await settle();
      if (!current.adapter.connected) {
        // The socket was connecting already - the attempt in progress takes the call
        FakeTransport.last?.serverReady();
      }
      expect(current.adapter.connected, `seed ${seed}: ${history.join(" > ")}`).toBeTrue();
    },
  );
});
