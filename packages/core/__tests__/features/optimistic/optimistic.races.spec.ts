import { waitFor } from "@testing-library/dom";

import { optimistic, resetOptimisticState } from "optimistic";
import type { Todo } from "../../utils/optimistic.utils";
import { createControlledClient, createTodo, readCache, seedCache } from "../../utils/optimistic.utils";

const BEFORE = [createTodo(1), createTodo(2)];
const OPTIMISTIC = [createTodo(1, { done: true }), createTodo(2)];
const AFTER = [createTodo(1, { done: true }), createTodo(2, { title: "changed on server" })];

const createSetup = (options: { seeded?: boolean } = {}) => {
  const { client, calls, waitForCall } = createControlledClient();
  const getTodos = client.createRequest<{ response: Todo[] }>()({ endpoint: "/todos" });
  const toggle = client
    .createRequest<{ response: Todo; payload: Partial<Todo> }>()({ endpoint: "/todos/:todoId", method: "PATCH" })
    .setParams({ todoId: 1 })
    .setOptimistic(({ params, payload }) => [
      optimistic(getTodos)
        .patch(params.todoId, payload)
        .rollback(({ data, previous }) => {
          const before = previous.find((todo) => todo.id === params.todoId);
          return data.map((todo) => (todo.id === params.todoId && before ? before : todo));
        }),
    ]);

  if (options.seeded !== false) {
    seedCache(client, getTodos, BEFORE);
  }

  const invalidate = vi.spyOn(client.cache, "invalidate");
  const todos = () => readCache<Todo[]>(client, getTodos);
  const callOf = (requestId: string) => calls.find((call) => call.requestId === requestId);

  /** Starts a request and resolves to its id once it reaches the network */
  const start = async (send: (onBeforeSent: (data: { requestId: string }) => void) => Promise<unknown>) => {
    let requestId = "";
    const promise = send(({ requestId: id }) => {
      requestId = id;
    });
    await waitFor(
      () => {
        expect(callOf(requestId)).toBeDefined();
      },
      { interval: 1 },
    );
    return { promise, call: callOf(requestId)! };
  };

  const startFetch = () => start((onBeforeSent) => getTodos.send({ onBeforeSent }));
  const startMutation = () => start((onBeforeSent) => toggle.send({ payload: { done: true }, onBeforeSent }));

  return { client, calls, waitForCall, getTodos, toggle, invalidate, todos, startFetch, startMutation };
};

type Order = "fetch-first" | "mutation-first";
type Landing = "while-pending" | "after-settle";
type Outcome = "success" | "error";

const cases: { order: Order; landing: Landing; outcome: Outcome }[] = (
  ["fetch-first", "mutation-first"] as const
).flatMap((order) =>
  (["while-pending", "after-settle"] as const).flatMap((landing) =>
    (["success", "error"] as const).map((outcome) => ({ order, landing, outcome })),
  ),
);

describe("Optimistic [ Races with fetches ]", () => {
  describe("when a fetch started before the mutation settled", () => {
    it.each(cases)(
      "should discard its response ($order, lands $landing, mutation $outcome)",
      async ({ order, landing, outcome }) => {
        const setup = createSetup();

        const first = order === "fetch-first" ? await setup.startFetch() : await setup.startMutation();
        const second = order === "fetch-first" ? await setup.startMutation() : await setup.startFetch();
        const fetch = order === "fetch-first" ? first : second;
        const mutation = order === "fetch-first" ? second : first;

        expect(setup.todos()).toStrictEqual(OPTIMISTIC);

        const settleMutation = async () => {
          mutation.call.respond(outcome === "success" ? { data: OPTIMISTIC[0] } : { error: new Error("Failed") });
          await mutation.promise;
        };

        if (landing === "after-settle") {
          await settleMutation();
        }

        // The server answers with what it had when the fetch was handled - before the change
        fetch.call.respond({ data: BEFORE });
        const fetchResponse = (await fetch.promise) as { data: Todo[] };

        // The caller still receives its response, only the cache write is skipped
        expect(fetchResponse.data).toStrictEqual(BEFORE);
        expect(setup.todos()).toStrictEqual(landing === "after-settle" && outcome === "error" ? BEFORE : OPTIMISTIC);

        if (landing === "while-pending") {
          expect(setup.invalidate).not.toHaveBeenCalled();
          await settleMutation();
        }

        expect(setup.todos()).toStrictEqual(outcome === "success" ? OPTIMISTIC : BEFORE);
        // One refresh, once both the mutation and the stale fetch are done
        expect(setup.invalidate).toHaveBeenCalledTimes(1);
        expect(setup.invalidate).toHaveBeenCalledWith(setup.getTodos);

        // The refresh fetch is written
        const refresh = await setup.startFetch();
        refresh.call.respond({ data: AFTER });
        await refresh.promise;
        expect(setup.todos()).toStrictEqual(AFTER);
      },
    );
  });

  describe("when a fetch starts after the mutation settled", () => {
    it.each(["success", "error"] as const)("should write its response (mutation %s)", async (outcome) => {
      const setup = createSetup();
      const mutation = await setup.startMutation();
      mutation.call.respond(outcome === "success" ? { data: OPTIMISTIC[0] } : { error: new Error("Failed") });
      await mutation.promise;

      const fetch = await setup.startFetch();
      fetch.call.respond({ data: AFTER });
      await fetch.promise;

      expect(setup.todos()).toStrictEqual(AFTER);
    });
  });

  describe("when the stale fetch is still running at settle", () => {
    it("should refresh only after the stale fetch is done", async () => {
      const setup = createSetup();
      const fetch = await setup.startFetch();
      const mutation = await setup.startMutation();

      mutation.call.respond({ data: OPTIMISTIC[0] });
      await mutation.promise;

      expect(setup.invalidate).not.toHaveBeenCalled();

      fetch.call.respond({ data: BEFORE });
      await fetch.promise;

      expect(setup.invalidate).toHaveBeenCalledTimes(1);
    });

    it("should accept the retried attempt of a stale fetch", async () => {
      const setup = createSetup();
      const retried = setup.getTodos.setRetry(1).setRetryTime(0);
      let requestId = "";
      const promise = retried.send({
        onBeforeSent: ({ requestId: id }) => {
          requestId = id;
        },
      });
      const firstAttempt = await setup.waitForCall(0);
      const mutation = await setup.startMutation();
      mutation.call.respond({ data: OPTIMISTIC[0] });
      await mutation.promise;

      // The attempt in flight at settle fails, the retry starts after the settle
      firstAttempt.respond({ error: new Error("Network") });
      const secondAttempt = await setup.waitForCall(2);
      expect(secondAttempt.requestId).toBe(requestId);
      secondAttempt.respond({ data: AFTER });
      await promise;

      expect(setup.todos()).toStrictEqual(AFTER);
    });
  });

  describe("when the key has no data", () => {
    it("should write the first load even while a mutation is pending", async () => {
      const setup = createSetup({ seeded: false });
      const mutation = await setup.startMutation();
      const fetch = await setup.startFetch();

      fetch.call.respond({ data: BEFORE });
      await fetch.promise;

      expect(setup.todos()).toStrictEqual(BEFORE);

      mutation.call.respond({ data: OPTIMISTIC[0] });
      await mutation.promise;

      expect(setup.invalidate).toHaveBeenCalledWith(setup.getTodos);
    });
  });

  describe("when the cache is written by hand", () => {
    it("should never block manual writes while a mutation is pending", async () => {
      const setup = createSetup();
      const mutation = await setup.startMutation();

      seedCache(setup.client, setup.getTodos, AFTER);
      setup.client.cache.update(setup.getTodos, (prev) => ({ data: [...(prev?.data ?? []), createTodo(3)] }));

      expect(setup.todos()).toStrictEqual([...AFTER, createTodo(3)]);
      mutation.call.respond({ data: OPTIMISTIC[0] });
      await mutation.promise;
    });
  });

  describe("when other keys are fetched", () => {
    it("should write responses of keys without pending mutations", async () => {
      const setup = createSetup();
      const getOther = setup.client.createRequest<{ response: Todo[] }>()({ endpoint: "/other" });
      seedCache(setup.client, getOther, BEFORE);
      const mutation = await setup.startMutation();

      const promise = getOther.send();
      const call = await setup.waitForCall(1);
      call.respond({ data: AFTER });
      await promise;

      expect(readCache(setup.client, getOther)).toStrictEqual(AFTER);
      mutation.call.respond({ data: OPTIMISTIC[0] });
      await mutation.promise;
    });
  });

  describe("when the client is cleared", () => {
    it("should drop the pending state so later fetches are written", async () => {
      const setup = createSetup();
      await setup.startMutation();

      setup.client.clear();
      seedCache(setup.client, setup.getTodos, BEFORE);
      const fetch = await setup.startFetch();
      fetch.call.respond({ data: AFTER });
      await fetch.promise;

      expect(setup.todos()).toStrictEqual(AFTER);
    });
  });

  describe("when the pending state is reset while a mutation is in flight", () => {
    it("should still settle the mutation", async () => {
      const setup = createSetup();
      const mutation = await setup.startMutation();

      resetOptimisticState(setup.client);
      mutation.call.respond({ error: new Error("Failed") });
      await mutation.promise;

      expect(setup.todos()).toStrictEqual(BEFORE);
      expect(setup.invalidate).not.toHaveBeenCalled();
    });
  });

  describe("when a scope is used", () => {
    it("should only guard the scope of the target", async () => {
      const setup = createSetup();
      const scoped = setup.getTodos.setScope("user-1");
      seedCache(setup.client, scoped, BEFORE);
      const mutation = await setup.startMutation();

      const promise = scoped.send();
      const call = await setup.waitForCall(1);
      call.respond({ data: AFTER });
      await promise;

      expect(readCache(setup.client, scoped)).toStrictEqual(AFTER);
      mutation.call.respond({ data: OPTIMISTIC[0] });
      await mutation.promise;
    });
  });
});
