import { waitFor } from "@testing-library/dom";

import { optimistic } from "optimistic";
import type { OptimisticOperation } from "optimistic";
import type { ControlledCall } from "../../utils/optimistic.utils";
import { createControlledClient, createRandom, readCache, seedCache } from "../../utils/optimistic.utils";

/** `version` grows with every change the server accepts for the item */
type Item = { id: number; value: number; version: number };

type Pending = { call: ControlledCall; promise: Promise<unknown> };
type PendingMutation = Pending & { commitOnServer: () => void };
type PendingFetch = Pending & { snapshot: Item[] };

const SEEDS = Array.from({ length: 40 }, (_, index) => index + 1);
const STEPS = 60;

const sortById = (items: Item[] | undefined) => (items ?? []).toSorted((a, b) => a.id - b.id);
const copy = (items: Item[]) => items.map((item) => ({ ...item }));

/**
 * Random sequences of mutations, their outcomes, fetches answered with the server data of the moment they were
 * handled, and deleted entries - against a simulated server. Every rollback uses a documented pattern.
 */
const run = async (seed: number) => {
  const random = createRandom(seed);
  const { client, calls } = createControlledClient();
  const getItems = client.createRequest<{ response: Item[] }>()({ endpoint: "/items" });
  const mutation = client.createRequest<{ response: null }>()({ endpoint: "/items/:id", method: "POST" });

  let server: Item[] = [1, 2, 3, 4].map((id) => ({ id, value: 0, version: 0 }));
  let nextId = 5;
  seedCache(client, getItems, copy(server));

  /** Lowest version of every item the cache may hold, raised by every fetch response written to the cache */
  const floor = new Map<number, number>();
  const mutations: PendingMutation[] = [];
  const fetches: PendingFetch[] = [];
  const read = () => readCache<Item[]>(client, getItems);

  const checkInvariants = (step: string) => {
    const items = read() ?? [];
    const ids = items.map((item) => item.id);
    expect(new Set(ids).size, `${step}: duplicated items ${ids}`).toBe(ids.length);
    items.forEach((item) => {
      const minimum = floor.get(item.id) ?? 0;
      expect(item.version, `${step}: item ${item.id} went back to an older server version`).toBeGreaterThanOrEqual(
        minimum,
      );
    });
  };

  const waitForCall = async (getRequestId: () => string) => {
    await waitFor(() => expect(calls.some((call) => call.requestId === getRequestId())).toBeTrue(), {
      interval: 1,
    });
    return calls.find((call) => call.requestId === getRequestId())!;
  };

  const startMutation = async () => {
    const kind = random.pick(["patch", "remove", "insert"] as const);
    const id = kind === "insert" ? nextId++ : random.pick([1, 2, 3, 4, 5, 6]);
    const value = random.int(100);
    let operation: OptimisticOperation<Item[], any>;
    let commitOnServer: () => void;

    if (kind === "patch") {
      operation = optimistic(getItems)
        .patch(id, { value })
        .rollback(({ data, previous }) => {
          const before = previous.find((item) => item.id === id);
          return data.map((item) => (item.id === id && before ? before : item));
        });
      commitOnServer = () => {
        server = server.map((item) => (item.id === id ? { ...item, value, version: item.version + 1 } : item));
      };
    } else if (kind === "remove") {
      operation = optimistic(getItems)
        .remove(id)
        .rollback(({ data, previous }) => {
          const removed = previous.find((item) => item.id === id);
          return removed ? [...data, removed] : data;
        });
      commitOnServer = () => {
        server = server.filter((item) => item.id !== id);
      };
    } else {
      operation = optimistic(getItems)
        .insert({ id, value, version: 0 })
        .rollback(({ data }) => data.filter((item) => item.id !== id));
      commitOnServer = () => {
        server = [...server, { id, value, version: 0 }];
      };
    }

    let requestId = "";
    const promise = mutation.send({
      params: { id },
      optimistic: [operation],
      onBeforeSent: (data) => {
        requestId = data.requestId;
      },
    });
    const call = await waitForCall(() => requestId);
    mutations.push({ call, promise, commitOnServer });
  };

  const settleMutation = async (index: number, success: boolean) => {
    const [settled] = mutations.splice(index, 1);
    if (success) {
      settled.commitOnServer();
      settled.call.respond({ data: null });
    } else {
      settled.call.respond({ error: new Error("Rejected") });
    }
    await settled.promise;
  };

  const startFetch = async () => {
    let requestId = "";
    const promise = getItems.send({
      onBeforeSent: (data) => {
        requestId = data.requestId;
      },
    });
    const call = await waitForCall(() => requestId);
    // The server reads its data when it handles the request
    fetches.push({ call, promise, snapshot: copy(server) });
  };

  const answerFetch = async (index: number) => {
    const [answered] = fetches.splice(index, 1);
    let written = false;
    const unmount = client.cache.events.onDataByKey(getItems.cacheKey, () => {
      written = true;
    });
    answered.call.respond({ data: answered.snapshot });
    await answered.promise;
    unmount();
    if (written) {
      expect(sortById(read())).toStrictEqual(sortById(answered.snapshot));
      answered.snapshot.forEach((item) => floor.set(item.id, Math.max(floor.get(item.id) ?? 0, item.version)));
    }
  };

  for (let step = 0; step < STEPS; step += 1) {
    const action = random.int(10);
    const label = `seed ${seed}, step ${step}`;

    if (action < 3 || (mutations.length === 0 && action < 6)) {
      // eslint-disable-next-line no-await-in-loop
      await startMutation();
    } else if (action < 6) {
      // eslint-disable-next-line no-await-in-loop
      await settleMutation(random.int(mutations.length), random.next() < 0.6);
    } else if (action < 8 || fetches.length === 0) {
      // eslint-disable-next-line no-await-in-loop
      await startFetch();
    } else if (action < 9) {
      // eslint-disable-next-line no-await-in-loop
      await answerFetch(random.int(fetches.length));
    } else {
      client.cache.delete(getItems.cacheKey);
    }

    checkInvariants(label);
  }

  // Everything settles in a random order
  while (mutations.length > 0 || fetches.length > 0) {
    if (mutations.length > 0 && (random.next() < 0.5 || fetches.length === 0)) {
      // eslint-disable-next-line no-await-in-loop
      await settleMutation(random.int(mutations.length), random.next() < 0.6);
    } else {
      // eslint-disable-next-line no-await-in-loop
      await answerFetch(random.int(fetches.length));
    }
    checkInvariants(`seed ${seed}, settling`);
  }

  // Nothing is pending anymore, so the refresh is written and the cache matches the server
  await startFetch();
  await answerFetch(0);
  expect(sortById(read())).toStrictEqual(sortById(server));
};

describe("Optimistic [ Randomized invariants ]", () => {
  it.each(SEEDS)("should converge to the server data and never go back in time (seed %i)", async (seed) => {
    await run(seed);
  });
});
