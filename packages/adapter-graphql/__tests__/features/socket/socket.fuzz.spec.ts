import { AppManager } from "@hyper-fetch/core";
import { Socket } from "@hyper-fetch/sockets";

import { GraphqlWsAdapter } from "../../../src";
import {
  ControlledWebSocket,
  flushPromises,
  installControlledWebSocket,
  uninstallControlledWebSocket,
} from "../../utils/controlled-websocket";

/** Deterministic random numbers, so a failing seed can be replayed */
const createRandom = (seed: number) => {
  let state = seed;
  return () => {
    // mulberry32 - the increment is 0x6D2B79F5
    state = Math.trunc(state + 1_831_565_813);
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    // `>>> 0` reads the 32 bits as unsigned, `Math.trunc` would keep the sign
    // eslint-disable-next-line unicorn/prefer-math-trunc
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
};

const documents = ["subscription A($v: Int) { a(v: $v) }", "subscription B($v: Int) { b(v: $v) }"];
const variables = [undefined, { v: 1 }, { v: 2 }];
const closeCodes = [1000, 1001, 1006, 1011, 4400, 4401, 4403, 4408, 4499, 4500];

type ListenerEntryType = {
  key: string;
  stop: () => void;
  received: string[];
  ended: boolean;
};

/** What the server knows about one transport - built from the frames, the way a server would see them */
type TransportModelType = {
  acknowledged: boolean;
  /** Ids the client subscribed and neither side completed yet, with the key of their subscription */
  live: Map<string, string>;
  /** Ids that are over - completed by the client or ended by the server */
  done: Set<string>;
};

const SEEDS = 300;
const STEPS = 80;

describe("Graphql Ws Adapter [ Fuzz ]", () => {
  let random = vi.spyOn(Math, "random");

  beforeEach(() => {
    random = vi.spyOn(Math, "random").mockReturnValue(0.5);
    installControlledWebSocket();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    uninstallControlledWebSocket();
    random.mockRestore();
  });

  it(`should keep the protocol invariants in ${SEEDS} random runs of ${STEPS} steps`, async () => {
    // Proves the runs reach the interesting states - a fuzz that never acknowledges a connection proves nothing
    const reached = { transports: 0, subscribes: 0, events: 0, resubscribes: 0 };
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      ControlledWebSocket.reset();
      const next = createRandom(seed);
      const pick = <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)];
      const steps: string[] = [];
      const fail = (message: string) => {
        throw new Error(`Seed ${seed}: ${message}\nSteps: ${steps.join(" > ")}`);
      };

      const lazy = next() < 0.3;
      const socket = new Socket({
        url: "ws://localhost/graphql",
        adapter: GraphqlWsAdapter(),
        adapterOptions: { autoConnect: false, lazy, lazyCloseTimeout: lazy && next() < 0.5 ? 50 : 0 },
        reconnectTime: 20,
        maxReconnectTime: 80,
        connectionTimeout: 400,
        appManager: () => new AppManager(),
      });
      socket.onError(() => null);

      const listeners: ListenerEntryType[] = [];
      const models = new Map<ControlledWebSocket, TransportModelType>();
      const usedIds = new Set<string>();
      const modelOf = (ws: ControlledWebSocket) => {
        const model = models.get(ws) ?? { acknowledged: false, live: new Map(), done: new Set() };
        models.set(ws, model);
        return model;
      };
      // Frames of every transport that were checked already
      const checkedFrames = new Map<ControlledWebSocket, number>();

      /** Reads the new client frames of every transport and checks them against what the server would accept */
      const checkClientFrames = () => {
        ControlledWebSocket.instances.forEach((ws) => {
          const model = modelOf(ws);
          const from = checkedFrames.get(ws) ?? 0;
          ws.messages.slice(from).forEach((message) => {
            if (message.type === "subscribe") {
              if (!model.acknowledged) {
                fail(`subscribe ${message.id} before the acknowledgement`);
              }
              if (usedIds.has(message.id)) {
                fail(`id ${message.id} reused`);
              }
              usedIds.add(message.id);
              const key = `${message.payload.query}|${JSON.stringify(message.payload.variables)}`;
              if ([...model.live.values()].includes(key)) {
                fail(`duplicate live subscription ${key}`);
              }
              model.live.set(message.id, key);
            }
            if (message.type === "complete") {
              if (!model.live.has(message.id)) {
                fail(`complete for ${message.id} that is not live`);
              }
              model.live.delete(message.id);
              model.done.add(message.id);
            }
          });
          checkedFrames.set(ws, ws.messages.length);
        });
        if (ControlledWebSocket.active.length > 1) {
          fail("more than one live transport");
        }
      };

      const current = () => ControlledWebSocket.active.at(-1);

      const actions: Record<string, () => void> = {
        listen: () => {
          const query = pick(documents);
          const payload = pick(variables);
          const entry: ListenerEntryType = {
            key: `${query}|${JSON.stringify(payload)}`,
            stop: () => null,
            received: [],
            ended: false,
          };
          const listener = socket.createListener<string, typeof payload>()({ topic: query });
          entry.stop = listener.setPayload(payload).listen(
            ({ data }) => {
              entry.received.push(data);
            },
            {
              onEnd: () => {
                entry.ended = true;
              },
            },
          );
          listeners.push(entry);
        },
        stop: () => {
          const entry = pick(listeners.filter(({ ended }) => !ended));
          if (entry) {
            entry.ended = true;
            entry.stop();
          }
        },
        connect: () => {
          socket.connect();
        },
        disconnect: () => {
          socket.disconnect();
        },
        reconnect: () => {
          socket.reconnect();
        },
        open: () => {
          const ws = current();
          if (ws?.readyState === ControlledWebSocket.CONNECTING) {
            ws.serverOpen();
          }
        },
        ack: () => {
          const ws = current();
          if (ws?.readyState === ControlledWebSocket.OPEN && !modelOf(ws).acknowledged) {
            modelOf(ws).acknowledged = true;
            ws.serverAck();
          }
        },
        close: () => {
          current()?.serverClose({ code: pick(closeCodes) });
        },
        next: () => {
          const ws = current();
          const model = ws && modelOf(ws);
          const id = model && pick([...model.live.keys()]);
          if (ws && model && id) {
            const key = model.live.get(id) as string;
            ws.serverNext(id, { data: `${key}#${id}` });
          }
        },
        complete: () => {
          const ws = current();
          const model = ws && modelOf(ws);
          const id = model && pick([...model.live.keys()]);
          if (ws && model && id) {
            model.live.delete(id);
            model.done.add(id);
            if (next() < 0.5) {
              ws.serverComplete(id);
            } else {
              ws.serverError(id, [{ message: "Failed" }]);
            }
          }
        },
        /** A message of a subscription that is over races with its end - the client must ignore it */
        late: () => {
          const ws = current();
          const model = ws && modelOf(ws);
          const id = model && pick([...model.done]);
          if (ws?.readyState === ControlledWebSocket.OPEN && id) {
            if (next() < 0.5) {
              ws.serverNext(id, { data: "late" });
            } else {
              ws.serverComplete(id);
            }
          }
        },
        ping: () => {
          const ws = current();
          if (ws?.readyState === ControlledWebSocket.OPEN) {
            ws.serverMessage({ type: "ping" });
          }
        },
        malformed: () => {
          const ws = current();
          if (ws?.readyState === ControlledWebSocket.OPEN && next() < 0.2) {
            ws.serverSend("{");
          }
        },
        /** The server accepts the connection and acknowledges it in one go */
        serve: () => {
          actions.open();
          actions.ack();
        },
        wait: () => {
          vi.advanceTimersByTime(Math.floor(next() * 150));
        },
      };
      // A server that mostly answers, so the runs spend their steps on acknowledged connections
      const weights: Record<string, number> = {
        listen: 4,
        stop: 2,
        connect: 1,
        disconnect: 0.5,
        reconnect: 0.5,
        open: 1,
        ack: 1,
        serve: 4,
        close: 1,
        next: 5,
        complete: 1,
        late: 1,
        ping: 0.5,
        malformed: 0.3,
        wait: 1.5,
      };
      const names = Object.entries(weights).flatMap(([name, weight]) =>
        Array.from({ length: Math.round(weight * 2) }, () => name),
      );

      for (let step = 0; step < STEPS; step += 1) {
        const name = pick(names);
        steps.push(name);
        actions[name]();
        // eslint-disable-next-line no-await-in-loop
        await flushPromises();
        checkClientFrames();

        // Events reach only the listeners of their own subscription
        listeners.forEach((entry) => {
          entry.received.forEach((data) => {
            if (!data.startsWith(`${entry.key}#`)) {
              fail(`event ${data} delivered to ${entry.key}`);
            }
          });
        });

        // On an acknowledged transport every running subscription is live exactly once
        const ws = current();
        const model = ws && modelOf(ws);
        if (ws && model?.acknowledged && ws.readyState === ControlledWebSocket.OPEN) {
          const wanted = new Set(listeners.filter(({ ended }) => !ended).map(({ key }) => key));
          const live = new Set(model.live.values());
          wanted.forEach((key) => {
            if (!live.has(key)) {
              fail(`running subscription ${key} is not live on the connection`);
            }
          });
          live.forEach((key) => {
            if (!wanted.has(key)) {
              fail(`live subscription ${key} has no listener`);
            }
          });
        }
      }

      reached.transports += ControlledWebSocket.instances.length;
      reached.subscribes += usedIds.size;
      reached.events += listeners.reduce((sum, { received }) => sum + received.length, 0);
      reached.resubscribes += ControlledWebSocket.instances.slice(1).filter((ws) => ws.subscriptions.length > 0).length;

      // Nothing outlives the socket
      socket.destroy();
      // eslint-disable-next-line no-await-in-loop
      await flushPromises();
      vi.advanceTimersByTime(1000);
      if (ControlledWebSocket.active.length > 0) {
        fail("a transport outlived the socket");
      }
      if (vi.getTimerCount() > 0) {
        fail(`${vi.getTimerCount()} timers outlived the socket`);
      }
    }

    expect(reached.transports).toBeGreaterThan(SEEDS * 2);
    expect(reached.subscribes).toBeGreaterThan(SEEDS * 5);
    expect(reached.events).toBeGreaterThan(SEEDS * 3);
    expect(reached.resubscribes).toBeGreaterThan(SEEDS);
  });
});
