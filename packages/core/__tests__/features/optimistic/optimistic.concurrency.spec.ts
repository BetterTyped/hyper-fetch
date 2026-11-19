import { waitFor } from "@testing-library/dom";

import type { ClientInstance } from "client";
import { optimistic } from "optimistic";
import type { OptimisticOperation } from "optimistic";
import type { RequestInstance } from "request";
import type { Stats, Todo } from "../../utils/optimistic.utils";
import { createControlledClient, createTodo, permutations, readCache, seedCache } from "../../utils/optimistic.utils";

type State = "pending" | "success" | "error";
type Message = { id: number; status: "sending" | "failed" };

/**
 * A documented rollback pattern, applied by mutation `index`. `expected` tells what the target holds for the given
 * state of every mutation - the change stays while pending or after success, and is reverted after an error.
 */
type Pattern = {
  name: string;
  seed: (targets: Targets) => void;
  operation: (targets: Targets, index: number) => OptimisticOperation<any, RequestInstance>;
  read: (targets: Targets) => unknown;
  expected: (states: State[]) => unknown;
};

type Targets = {
  client: ClientInstance;
  getTodos: RequestInstance;
  getStats: RequestInstance;
  getMessages: RequestInstance;
};

const ITEMS = [1, 2, 3];
const sortById = <T extends { id: number }>(list: T[] | undefined) => (list ?? []).toSorted((a, b) => a.id - b.id);

const patterns: Pattern[] = [
  {
    name: "re-add from previous",
    seed: ({ client, getTodos }) => seedCache(client, getTodos, ITEMS.map((id) => createTodo(id))),
    operation: ({ getTodos }, index) =>
      optimistic(getTodos as RequestInstance)
        .remove(ITEMS[index])
        .rollback(({ data, previous }: { data: Todo[]; previous: Todo[] }) => {
          const removed = previous.find((todo) => todo.id === ITEMS[index]);
          return removed ? [...data, removed] : data;
        }),
    read: ({ client, getTodos }) => sortById(readCache<Todo[]>(client, getTodos)),
    expected: (states) =>
      ITEMS.filter((_, index) => states[index] === undefined || states[index] === "error").map((id) =>
        createTodo(id),
      ),
  },
  {
    name: "restore one item",
    seed: ({ client, getTodos }) => seedCache(client, getTodos, ITEMS.map((id) => createTodo(id))),
    operation: ({ getTodos }, index) =>
      optimistic(getTodos as RequestInstance)
        .patch(ITEMS[index], { done: true })
        .rollback(({ data, previous }: { data: Todo[]; previous: Todo[] }) => {
          const before = previous.find((todo) => todo.id === ITEMS[index]);
          return data.map((todo) => (todo.id === ITEMS[index] && before ? before : todo));
        }),
    read: ({ client, getTodos }) => readCache<Todo[]>(client, getTodos),
    expected: (states) =>
      ITEMS.map((id, index) =>
        createTodo(id, { done: states[index] === "pending" || states[index] === "success" }),
      ),
  },
  {
    name: "opposite increment",
    seed: ({ client, getStats }) => seedCache(client, getStats, { total: 10, done: 0 }),
    operation: ({ getStats }, index) =>
      optimistic(getStats as RequestInstance)
        .increment("total", index + 1)
        .rollback(({ data }: { data: Stats }) => ({ ...data, total: data.total - (index + 1) })),
    read: ({ client, getStats }) => readCache<Stats>(client, getStats),
    expected: (states) => ({
      total: states.reduce((sum, state, index) => (state === "error" ? sum : sum + index + 1), 10),
      done: 0,
    }),
  },
  {
    name: "mark as failed",
    seed: ({ client, getMessages }) => seedCache(client, getMessages, []),
    operation: ({ getMessages }, index) =>
      optimistic(getMessages as RequestInstance)
        .insert({ id: ITEMS[index], status: "sending" })
        .rollback(({ data, reason }: { data: Message[]; reason: string }) =>
          reason === "error"
            ? data.map((message) => (message.id === ITEMS[index] ? { ...message, status: "failed" } : message))
            : data.filter((message) => message.id !== ITEMS[index]),
        ),
    read: ({ client, getMessages }) => sortById(readCache<Message[]>(client, getMessages)),
    expected: (states) =>
      states.flatMap((state, index) =>
        state ? [{ id: ITEMS[index], status: state === "error" ? "failed" : "sending" }] : [],
      ),
  },
];

const createSetup = (pattern: Pattern) => {
  const { client, calls } = createControlledClient();
  const targets: Targets = {
    client,
    getTodos: client.createRequest<{ response: Todo[] }>()({ endpoint: "/todos" }),
    getStats: client.createRequest<{ response: Stats }>()({ endpoint: "/stats" }),
    getMessages: client.createRequest<{ response: Message[] }>()({ endpoint: "/messages" }),
  };
  pattern.seed(targets);
  const invalidate = vi.spyOn(client.cache, "invalidate");
  const mutation = client.createRequest<{ response: null }>()({ endpoint: "/mutations/:index", method: "POST" });

  /** Sends mutation `index` and waits until it reaches the network */
  const send = async (index: number) => {
    let requestId = "";
    const promise = mutation.send({
      params: { index },
      optimistic: [pattern.operation(targets, index)],
      onBeforeSent: (data) => {
        requestId = data.requestId;
      },
    });
    await waitFor(
      () => {
        expect(calls.some((call) => call.requestId === requestId)).toBeTrue();
      },
      { interval: 1 },
    );
    const call = calls.find((item) => item.requestId === requestId)!;
    return { promise, call };
  };

  return { targets, invalidate, send };
};

const outcomeCombinations = (count: number): ("success" | "error")[][] => {
  if (count === 0) {
    return [[]];
  }
  return outcomeCombinations(count - 1).flatMap((rest) => [
    ["success" as const, ...rest],
    ["error" as const, ...rest],
  ]);
};

const scenarios = [2, 3].flatMap((count) => {
  const indexes = Array.from({ length: count }, (_, index) => index);
  return permutations(indexes).flatMap((order) =>
    outcomeCombinations(count).map((outcomes) => ({ count, order, outcomes })),
  );
});

describe("Optimistic [ Concurrency ]", () => {
  describe.each(patterns)("when using the $name pattern", (pattern) => {
    it.each(scenarios)(
      "should hold the right value after each settle ($count mutations, order $order, outcomes $outcomes)",
      async ({ count, order, outcomes }) => {
        const { targets, invalidate, send } = createSetup(pattern);
        const states: State[] = [];
        const sent = [];

        for (let index = 0; index < count; index += 1) {
          // eslint-disable-next-line no-await-in-loop
          sent.push(await send(index));
          states[index] = "pending";
          expect(pattern.read(targets)).toStrictEqual(pattern.expected(states));
        }

        for (const [step, index] of order.entries()) {
          const outcome = outcomes[index];
          sent[index].call.respond(outcome === "success" ? { data: null } : { error: new Error("Failed") });
          // eslint-disable-next-line no-await-in-loop
          await sent[index].promise;
          states[index] = outcome;

          expect(pattern.read(targets)).toStrictEqual(pattern.expected(states));
          // The refresh waits for the last pending mutation on the key
          expect(invalidate).toHaveBeenCalledTimes(step === count - 1 ? 1 : 0);
        }
      },
    );
  });

  describe("when two mutations change the same field", () => {
    const createToggles = () => {
      const { client, calls } = createControlledClient();
      const getTodos = client.createRequest<{ response: Todo[] }>()({ endpoint: "/todos" });
      seedCache(client, getTodos, [createTodo(1)]);
      const toggle = client
        .createRequest<{ response: Todo; payload: { done: boolean } }>()({ endpoint: "/todos/:id", method: "PATCH" })
        .setParams({ id: 1 })
        .setOptimistic(({ payload }) => [
          optimistic(getTodos)
            .patch(1, payload)
            .rollback(({ data, previous }) => {
              const before = previous.find((todo) => todo.id === 1);
              return data.map((todo) => (todo.id === 1 && before ? before : todo));
            }),
        ]);
      const done = () => readCache<Todo[]>(client, getTodos)?.[0].done;
      return { client, calls, getTodos, toggle, done };
    };

    it("should restore the value from before the failed toggle, then refresh to the server value", async () => {
      const { client, calls, getTodos, toggle, done } = createToggles();
      const invalidate = vi.spyOn(client.cache, "invalidate");

      const first = toggle.send({ payload: { done: true } });
      const second = toggle.send({ payload: { done: false } });
      await waitFor(() => expect(calls).toHaveLength(2), { interval: 1 });
      expect(done()).toBeFalse();

      // The later toggle succeeded, the earlier one fails and restores what it saw: `false`
      calls[1].respond({ data: createTodo(1) });
      await second;
      expect(done()).toBeFalse();
      calls[0].respond({ error: new Error("Failed") });
      await first;
      expect(done()).toBeFalse();
      expect(invalidate).toHaveBeenCalledTimes(1);

      const refresh = getTodos.send();
      await waitFor(() => expect(calls).toHaveLength(3), { interval: 1 });
      calls[2].respond({ data: [createTodo(1, { done: false })] });
      await refresh;
      expect(done()).toBeFalse();
    });

    it("should document the rollback of the later toggle overwriting the earlier success", async () => {
      const { calls, getTodos, toggle, done } = createToggles();

      const first = toggle.send({ payload: { done: true } });
      const second = toggle.send({ payload: { done: false } });
      await waitFor(() => expect(calls).toHaveLength(2), { interval: 1 });

      calls[0].respond({ data: createTodo(1, { done: true }) });
      await first;
      // The later toggle fails and restores its own previous value - the earlier, successful `true`
      calls[1].respond({ error: new Error("Failed") });
      await second;
      expect(done()).toBeTrue();

      // The server holds `true` too, so the refresh confirms it
      const refresh = getTodos.send();
      await waitFor(() => expect(calls).toHaveLength(3), { interval: 1 });
      calls[2].respond({ data: [createTodo(1, { done: true })] });
      await refresh;
      expect(done()).toBeTrue();
    });
  });

  describe("when mutations target different keys", () => {
    it("should refresh each key once its own last mutation settled", async () => {
      const { client, calls } = createControlledClient();
      const getTodos = client.createRequest<{ response: Todo[] }>()({ endpoint: "/todos" });
      const getStats = client.createRequest<{ response: Stats }>()({ endpoint: "/stats" });
      seedCache(client, getTodos, [createTodo(1)]);
      seedCache(client, getStats, { total: 1, done: 0 });
      const invalidate = vi.spyOn(client.cache, "invalidate");
      const mutation = client.createRequest<{ response: null }>()({ endpoint: "/mutation", method: "POST" });

      const both = mutation.send({
        optimistic: [optimistic(getTodos).patch(1, { done: true }), optimistic(getStats).increment("done", 1)],
      });
      const statsOnly = mutation.send({ optimistic: [optimistic(getStats).increment("total", 1)] });
      await waitFor(() => expect(calls).toHaveLength(2), { interval: 1 });

      calls[0].respond({ data: null });
      await both;
      expect(invalidate).toHaveBeenCalledTimes(1);
      expect(invalidate).toHaveBeenCalledWith(getTodos);

      calls[1].respond({ data: null });
      await statsOnly;
      expect(invalidate).toHaveBeenCalledTimes(2);
      expect(invalidate).toHaveBeenLastCalledWith(getStats);
    });
  });
});
