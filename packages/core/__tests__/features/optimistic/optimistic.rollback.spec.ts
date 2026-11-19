import { createHttpMockingServer } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/dom";

import type { CacheValueType } from "cache";
import { Client } from "client";
import { optimistic } from "optimistic";
import type { OptimisticOperationRollbackArgs } from "optimistic";
import type { RequestInstance } from "request";
import { scopeKey } from "request";
import type { Stats, Todo } from "../../utils/optimistic.utils";
import { createTodo, readCache, seedCache } from "../../utils/optimistic.utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

const INITIAL_TODOS = [createTodo(1), createTodo(2), createTodo(3)];

const createSetup = () => {
  const client = new Client({ url: "shared-base-url" });
  const getTodos = client.createRequest<{ response: Todo[] }>()({ endpoint: "/todos" });
  const getStats = client.createRequest<{ response: Stats }>()({ endpoint: "/stats" });
  // The same list with filters and pages in its query params
  const listQuery = client.createRequest<{ response: Todo[]; queryParams: { done?: boolean; page?: number } }>()({
    endpoint: "/todos",
  });
  const updateTodo = client.createRequest<{ response: Todo; payload: Partial<Todo> }>()({
    endpoint: "/todos/:todoId",
    method: "PATCH",
  });
  const createTodoRequest = client.createRequest<{ response: Todo; payload: Omit<Todo, "id"> }>()({
    endpoint: "/todos",
    method: "POST",
  });

  seedCache(client, getTodos, INITIAL_TODOS);
  seedCache(client, getStats, { total: 3, done: 0 });

  const invalidate = vi.spyOn(client.cache, "invalidate");
  const logError = vi.spyOn(client.logger, "error");
  const todos = () => readCache<Todo[]>(client, getTodos);
  const stats = () => readCache<Stats>(client, getStats);
  const wasRefreshed = (request: RequestInstance) => {
    return invalidate.mock.calls.some(([target]) => {
      return (
        target instanceof Object &&
        "cacheKey" in target &&
        scopeKey(target.cacheKey, target.scope) === scopeKey(request.cacheKey, request.scope)
      );
    });
  };

  return { client, getTodos, getStats, listQuery, updateTodo, createTodoRequest, invalidate, logError, todos, stats, wasRefreshed };
};

type Setup = ReturnType<typeof createSetup>;

const countDataEvents = (setup: Setup, request: RequestInstance) => {
  const events: unknown[] = [];
  setup.client.cache.events.onDataByKey(request.cacheKey, (data: CacheValueType) => events.push(data.data));
  return events;
};

describe("Optimistic [ Rollback and commit ]", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("when the mutation fails", () => {
    it("should call rollback with one object holding the current and previous data", async () => {
      const setup = createSetup();
      const rollback = vi.fn((_args: OptimisticOperationRollbackArgs<Todo[], RequestInstance>) => {});
      let sentRequest: RequestInstance | undefined;
      const request = setup.updateTodo.setParams({ todoId: 2 }).setOptimistic(({ params, payload }) => [
        optimistic(setup.getTodos).patch(params.todoId, payload).rollback(rollback),
      ]);
      mockRequest(request, { status: 400, delay: 20 });

      const pending = request.send({
        payload: { done: true },
        onBeforeSent: ({ request: sent }) => {
          sentRequest = sent;
        },
      });
      // Another change lands while the mutation is pending
      setup.client.cache.update(setup.getTodos, (prev) => ({
        data: [...(prev?.data ?? []), createTodo(4)],
      }));
      const response = await pending;

      expect(response.success).toBeFalse();
      expect(rollback).toHaveBeenCalledTimes(1);
      const [args] = rollback.mock.calls[0];
      expect(Object.keys(args).toSorted()).toStrictEqual(["data", "previous", "reason", "request", "response"]);
      expect(args.previous).toStrictEqual(INITIAL_TODOS);
      expect(args.data).toStrictEqual([INITIAL_TODOS[0], { ...INITIAL_TODOS[1], done: true }, INITIAL_TODOS[2], createTodo(4)]);
      expect(args.reason).toBe("error");
      expect(args.response?.status).toBe(400);
      expect(args.response?.success).toBeFalse();
      expect(args.request).toBe(sentRequest);
    });

    it("should write the returned data and keep changes made since", async () => {
      const setup = createSetup();
      const request = setup.updateTodo.setParams({ todoId: 2 }).setOptimistic(({ params }) => [
        optimistic(setup.getTodos)
          .patch(params.todoId, { done: true })
          .rollback(({ data, previous }) => {
            const before = previous.find((todo) => todo.id === params.todoId);
            return data.map((todo) => (todo.id === params.todoId && before ? before : todo));
          }),
      ]);
      mockRequest(request, { status: 500, delay: 20 });

      const pending = request.send({ payload: {} });
      setup.client.cache.update(setup.getTodos, (prev) => ({
        data: (prev?.data ?? []).map((todo) => (todo.id === 3 ? { ...todo, likes: 7 } : todo)),
      }));
      await pending;

      expect(setup.todos()).toStrictEqual([INITIAL_TODOS[0], INITIAL_TODOS[1], { ...INITIAL_TODOS[2], likes: 7 }]);
    });

    it("should see the data of a server response that landed in the meantime", async () => {
      const setup = createSetup();
      const server = [createTodo(1, { title: "from server" })];
      const rollback = vi.fn();
      const request = setup.updateTodo
        .setParams({ todoId: 1 })
        .setOptimistic(() => [optimistic(setup.getTodos).remove(1).rollback(rollback)]);
      mockRequest(request, { status: 500, delay: 20 });

      const pending = request.send({ payload: {} });
      seedCache(setup.client, setup.getTodos, server);
      await pending;

      expect(rollback).toHaveBeenCalledWith(expect.objectContaining({ data: server, previous: INITIAL_TODOS }));
    });

    it("should leave the data untouched when rollback returns nothing and still count it as run", async () => {
      const setup = createSetup();
      const events = countDataEvents(setup, setup.getTodos);
      const rollback = vi.fn();
      const request = setup.updateTodo
        .setParams({ todoId: 1 })
        .setOptimistic(() => [optimistic(setup.getTodos).remove(1).rollback(rollback)]);
      mockRequest(request, { status: 500 });

      await request.send({ payload: {} });

      expect(rollback).toHaveBeenCalledTimes(1);
      expect(setup.todos()).toStrictEqual([INITIAL_TODOS[1], INITIAL_TODOS[2]]);
      // Only the optimistic change produced an event
      expect(events).toHaveLength(1);
      expect(setup.wasRefreshed(setup.getTodos)).toBeTrue();
    });

    it("should not write when rollback returns the current data", async () => {
      const setup = createSetup();
      const events = countDataEvents(setup, setup.getTodos);
      const request = setup.updateTodo
        .setParams({ todoId: 1 })
        .setOptimistic(() => [optimistic(setup.getTodos).remove(1).rollback(({ data }) => data)]);
      mockRequest(request, { status: 500 });

      await request.send({ payload: {} });

      expect(events).toHaveLength(1);
    });

    it("should run the rollbacks in reverse order and skip operations without one", async () => {
      const setup = createSetup();
      const order: string[] = [];
      const request = setup.updateTodo.setParams({ todoId: 1 }).setOptimistic(() => [
        optimistic(setup.getTodos)
          .patch(1, { done: true })
          .rollback(({ data }) => {
            order.push("first");
            return data.map((todo) => (todo.id === 1 ? { ...todo, done: false } : todo));
          }),
        optimistic(setup.getStats).increment("done", 1),
        optimistic(setup.getStats)
          .increment("total", 1)
          .rollback(({ data }) => {
            order.push("third");
            return { ...data, total: data.total - 1 };
          }),
      ]);
      mockRequest(request, { status: 500 });

      await request.send({ payload: {} });

      expect(order).toStrictEqual(["third", "first"]);
      expect(setup.todos()).toStrictEqual(INITIAL_TODOS);
      // The operation without rollback stays until the refresh replaces it
      expect(setup.stats()).toStrictEqual({ total: 3, done: 1 });
      expect(setup.wasRefreshed(setup.getStats)).toBeTrue();
      expect(setup.wasRefreshed(setup.getTodos)).toBeTrue();
    });

    it("should only refresh when no operation has a rollback", async () => {
      const setup = createSetup();
      const request = setup.updateTodo
        .setParams({ todoId: 1 })
        .setOptimistic(() => [optimistic(setup.getTodos).patch(1, { done: true })]);
      mockRequest(request, { status: 500 });

      await request.send({ payload: {} });

      expect(setup.todos()?.[0].done).toBeTrue();
      expect(setup.invalidate).toHaveBeenCalledTimes(1);
      expect(setup.wasRefreshed(setup.getTodos)).toBeTrue();
      expect(setup.client.cache.get(setup.getTodos.cacheKey)?.staleTime).toBe(0);
    });

    it("should mark a failed item instead of removing it", async () => {
      const setup = createSetup();
      type Message = { id: string; text: string; status: "sending" | "failed" | "sent" };
      const getMessages = setup.client.createRequest<{ response: Message[] }>()({ endpoint: "/messages" });
      seedCache(setup.client, getMessages, []);
      const message: Message = { id: "temp", text: "Hi", status: "sending" };
      const send = setup.client
        .createRequest<{ response: Message; payload: Message }>()({ endpoint: "/messages", method: "POST" })
        .setOptimistic(({ payload }) => [
          optimistic(getMessages)
            .insert(payload)
            .rollback(({ data, reason }) =>
              reason === "error"
                ? data.map((item) => (item.id === payload.id ? { ...item, status: "failed" as const } : item))
                : data.filter((item) => item.id !== payload.id),
            ),
        ]);
      mockRequest(send, { status: 500 });

      await send.send({ payload: message });

      expect(readCache(setup.client, getMessages)).toStrictEqual([{ ...message, status: "failed" }]);
    });
  });

  describe("when the mutation is aborted or removed", () => {
    it("should roll back with the abort reason and response", async () => {
      const setup = createSetup();
      const rollback = vi.fn(({ previous }: { previous: Todo[] }) => previous);
      const request = setup.updateTodo
        .setParams({ todoId: 1 })
        .setOptimistic(() => [optimistic(setup.getTodos).remove(1).rollback(rollback)]);
      mockRequest(request, { delay: 100 });

      await request.send({
        payload: {},
        onRequestStart: () => {
          request.abort();
        },
      });

      expect(rollback).toHaveBeenCalledTimes(1);
      expect(rollback).toHaveBeenCalledWith(expect.objectContaining({ reason: "abort" }));
      expect(rollback.mock.calls[0][0]).toHaveProperty("response.success", false);
      expect(setup.todos()).toStrictEqual(INITIAL_TODOS);
    });

    it("should roll back without response when removed from the queue", async () => {
      const setup = createSetup();
      const rollback = vi.fn(({ data }: { data: Todo[] }) => [createTodo(1), ...data]);
      const request = setup.updateTodo
        .setParams({ todoId: 1 })
        .setOptimistic(() => [optimistic(setup.getTodos).remove(1).rollback(rollback)]);
      mockRequest(request);
      const queryKey = scopeKey(request.queryKey, request.scope);
      setup.client.submitDispatcher.stop(queryKey);

      const response = await request.send({
        payload: {},
        onBeforeSent: ({ requestId }) => {
          queueMicrotask(() => {
            setup.client.submitDispatcher.delete(queryKey, requestId, scopeKey(request.abortKey, request.scope));
          });
        },
      });

      expect(response.success).toBeFalse();
      expect(rollback).toHaveBeenCalledTimes(1);
      const [args] = rollback.mock.calls[0];
      expect(args).toHaveProperty("reason", "removed");
      expect(args).not.toHaveProperty("response");
      expect(setup.todos()).toStrictEqual([createTodo(1), INITIAL_TODOS[1], INITIAL_TODOS[2]]);
      expect(setup.wasRefreshed(setup.getTodos)).toBeTrue();
    });
  });

  describe("when the mutation succeeds", () => {
    it("should not roll back and keep the optimistic value until the refresh", async () => {
      const setup = createSetup();
      const rollback = vi.fn();
      const request = setup.updateTodo
        .setParams({ todoId: 1 })
        .setOptimistic(() => [optimistic(setup.getTodos).patch(1, { done: true }).rollback(rollback)]);
      mockRequest(request, { data: createTodo(1, { done: true }) });

      const response = await request.send({ payload: { done: true } });

      expect(response.success).toBeTrue();
      expect(rollback).not.toHaveBeenCalled();
      expect(setup.todos()?.[0].done).toBeTrue();
      expect(setup.wasRefreshed(setup.getTodos)).toBeTrue();
    });

    it("should swap the temporary item for the server one in commit", async () => {
      const setup = createSetup();
      const commit = vi.fn();
      const request = setup.createTodoRequest.setOptimistic(({ payload, optimistic: typedOptimistic }) => {
        const temp = { id: -1, ...payload };
        return [
          typedOptimistic(setup.getTodos)
            .insert(temp)
            .commit((args) => {
              commit(args);
              return args.data.map((todo) => (todo.id === temp.id ? args.response.data : todo));
            })
            .rollback(({ data }) => data.filter((todo) => todo.id !== temp.id)),
        ];
      });
      mockRequest(request, { data: createTodo(10, { title: "new" }) });
      let sentRequest: RequestInstance | undefined;

      await request.send({
        payload: { title: "new", done: false, likes: 0 },
        onBeforeSent: ({ request: sent }) => {
          sentRequest = sent;
        },
      });

      expect(setup.todos()).toStrictEqual([...INITIAL_TODOS, createTodo(10, { title: "new" })]);
      expect(commit).toHaveBeenCalledTimes(1);
      const [args] = commit.mock.calls[0];
      expect(Object.keys(args).toSorted()).toStrictEqual(["data", "request", "response"]);
      expect(args.data).toStrictEqual([...INITIAL_TODOS, { id: -1, title: "new", done: false, likes: 0 }]);
      expect(args.response.success).toBeTrue();
      expect(args.request).toBe(sentRequest);
    });

    it("should keep the data when commit returns nothing", async () => {
      const setup = createSetup();
      const events = countDataEvents(setup, setup.getTodos);
      const request = setup.updateTodo
        .setParams({ todoId: 1 })
        .setOptimistic(() => [optimistic(setup.getTodos).remove(1).commit(() => {})]);
      mockRequest(request, { data: createTodo(1) });

      await request.send({ payload: {} });

      expect(events).toHaveLength(1);
      expect(setup.todos()).toStrictEqual([INITIAL_TODOS[1], INITIAL_TODOS[2]]);
    });
  });

  describe("when user code fails", () => {
    it("should contain a throwing helper, apply the others and refresh the target", async () => {
      const setup = createSetup();
      const request = setup.updateTodo.setParams({ todoId: 1 }).setOptimistic(() => [
        optimistic(setup.getTodos).set(() => {
          throw new Error("Helper failed");
        }),
        optimistic(setup.getStats).increment("total", 1),
      ]);
      mockRequest(request, { data: createTodo(1) });

      const response = await request.send({ payload: {} });

      expect(response.success).toBeTrue();
      expect(setup.todos()).toStrictEqual(INITIAL_TODOS);
      expect(setup.stats()?.total).toBe(4);
      expect(setup.logError).toHaveBeenCalledWith(expect.objectContaining({ title: "Optimistic update failed" }));
      expect(setup.wasRefreshed(setup.getTodos)).toBeTrue();
    });

    it("should refresh a target whose helper threw even when nothing else refreshes", async () => {
      const setup = createSetup();
      const request = setup.updateTodo.setParams({ todoId: 1 }).setOptimistic(() => ({
        updates: [optimistic(setup.getTodos).patch(1, { done: true }), optimistic(setup.getStats).list("total" as never).remove(() => true)],
        revalidate: false,
      }));
      mockRequest(request, { data: createTodo(1) });

      await request.send({ payload: {} });

      expect(setup.wasRefreshed(setup.getStats)).toBeTrue();
      expect(setup.wasRefreshed(setup.getTodos)).toBeFalse();
    });

    it("should contain values which are not operations", async () => {
      const setup = createSetup();
      const request = setup.updateTodo
        .setParams({ todoId: 1 })
        .setOptimistic(() => ({ updates: [{ fake: true } as never, optimistic(setup.getStats).increment("total", 1)] }));
      mockRequest(request, { data: createTodo(1) });

      const response = await request.send({ payload: {} });

      expect(response.success).toBeTrue();
      expect(setup.stats()?.total).toBe(4);
      expect(setup.logError).toHaveBeenCalledWith(expect.objectContaining({ title: "Optimistic update failed" }));
    });

    it("should contain a throwing rollback, run the others and refresh", async () => {
      const setup = createSetup();
      const objectRollback = vi.fn();
      const request = setup.updateTodo.setParams({ todoId: 1 }).setOptimistic(() => ({
        updates: [
          optimistic(setup.getTodos)
            .remove(1)
            .rollback(({ previous }) => previous),
          optimistic(setup.getStats)
            .increment("total", -1)
            .rollback(() => {
              throw new Error("Rollback failed");
            }),
        ],
        rollback: objectRollback,
        revalidate: false,
      }));
      mockRequest(request, { status: 500 });

      const response = await request.send({ payload: {} });

      expect(response.status).toBe(500);
      expect(setup.todos()).toStrictEqual(INITIAL_TODOS);
      expect(objectRollback).toHaveBeenCalledTimes(1);
      expect(setup.logError).toHaveBeenCalledWith(expect.objectContaining({ title: "Optimistic rollback failed" }));
      expect(setup.wasRefreshed(setup.getStats)).toBeTrue();
      expect(setup.wasRefreshed(setup.getTodos)).toBeFalse();
    });

    it("should report a rollback returning a promise and ignore its value", async () => {
      const setup = createSetup();
      const request = setup.updateTodo.setParams({ todoId: 1 }).setOptimistic(() => [
        optimistic(setup.getTodos)
          .remove(1)
          .rollback((async () => INITIAL_TODOS) as never),
      ]);
      mockRequest(request, { status: 500 });

      await request.send({ payload: {} });

      expect(setup.todos()).toStrictEqual([INITIAL_TODOS[1], INITIAL_TODOS[2]]);
      expect(setup.logError).toHaveBeenCalledWith(expect.objectContaining({ title: "Optimistic rollback failed" }));
      expect(setup.wasRefreshed(setup.getTodos)).toBeTrue();
    });

    it("should report a rejected rollback promise", async () => {
      const setup = createSetup();
      const request = setup.updateTodo.setParams({ todoId: 1 }).setOptimistic(() => [
        optimistic(setup.getTodos)
          .remove(1)
          .rollback((() => Promise.reject(new Error("Async failed"))) as never),
      ]);
      mockRequest(request, { status: 500 });

      await request.send({ payload: {} });

      await waitFor(() => {
        expect(setup.logError).toHaveBeenCalledWith(
          expect.objectContaining({ extra: expect.objectContaining({ error: new Error("Async failed") }) }),
        );
      });
    });

    it("should contain a throwing commit and refresh", async () => {
      const setup = createSetup();
      const request = setup.updateTodo.setParams({ todoId: 1 }).setOptimistic(() => ({
        updates: [
          optimistic(setup.getTodos)
            .patch(1, { done: true })
            .commit(() => {
              throw new Error("Commit failed");
            }),
        ],
        revalidate: false,
      }));
      mockRequest(request, { data: createTodo(1) });

      const response = await request.send({ payload: {} });

      expect(response.success).toBeTrue();
      expect(setup.logError).toHaveBeenCalledWith(expect.objectContaining({ title: "Optimistic commit failed" }));
      expect(setup.wasRefreshed(setup.getTodos)).toBeTrue();
    });
  });

  describe("when the target has no data", () => {
    it("should skip the change and rollback, but refresh the target", async () => {
      const setup = createSetup();
      const getUsers = setup.client.createRequest<{ response: { id: number }[] }>()({ endpoint: "/users" });
      const rollback = vi.fn();
      const request = setup.updateTodo.setParams({ todoId: 1 }).setOptimistic(() => [
        optimistic(getUsers).insert({ id: 1 }).rollback(rollback),
        optimistic(setup.getTodos)
          .remove(1)
          .rollback(({ previous }) => previous),
      ]);
      mockRequest(request, { status: 500 });

      await request.send({ payload: {} });

      expect(readCache(setup.client, getUsers)).toBeUndefined();
      expect(rollback).not.toHaveBeenCalled();
      expect(setup.logError).not.toHaveBeenCalled();
      expect(setup.todos()).toStrictEqual(INITIAL_TODOS);
      expect(setup.wasRefreshed(getUsers)).toBeTrue();
    });

    it("should not call rollback when the entry was deleted in the meantime", async () => {
      const setup = createSetup();
      const rollback = vi.fn(({ previous }: { previous: Todo[] }) => previous);
      const request = setup.updateTodo
        .setParams({ todoId: 1 })
        .setOptimistic(() => [optimistic(setup.getTodos).remove(1).rollback(rollback)]);
      mockRequest(request, { status: 500, delay: 20 });

      const pending = request.send({ payload: {} });
      setup.client.cache.delete(setup.getTodos.cacheKey);
      await pending;

      expect(rollback).not.toHaveBeenCalled();
      expect(setup.logError).not.toHaveBeenCalled();
      expect(setup.todos()).toBeUndefined();
    });

    it("should not call rollback when the cache was cleared in the meantime", async () => {
      const setup = createSetup();
      const rollback = vi.fn(({ previous }: { previous: Todo[] }) => previous);
      const request = setup.updateTodo
        .setParams({ todoId: 1 })
        .setOptimistic(() => [optimistic(setup.getTodos).remove(1).rollback(rollback)]);
      mockRequest(request, { status: 500, delay: 20 });

      const pending = request.send({ payload: {} });
      await setup.client.cache.clear();
      await pending;

      expect(rollback).not.toHaveBeenCalled();
      expect(setup.logError).not.toHaveBeenCalled();
      expect(setup.todos()).toBeUndefined();
    });
  });

  describe("when combining helpers with the object form", () => {
    it("should run the helper rollbacks before the object rollback and deliver the context", async () => {
      const setup = createSetup();
      const order: string[] = [];
      const objectRollback = vi.fn((args: { reason: string }) => {
        order.push(`object:${args.reason}`);
      });
      const request = setup.updateTodo.setParams({ todoId: 1 }).setOptimistic(() => ({
        context: { todoId: 1 },
        updates: [
          optimistic(setup.getTodos)
            .remove(1)
            .rollback(({ previous }) => {
              order.push("helper");
              return previous;
            }),
        ],
        rollback: objectRollback,
        invalidate: [setup.getStats],
      }));
      mockRequest(request, { status: 500 });
      const onResponse = vi.fn();

      await request.send({ payload: {}, onResponse });

      expect(order).toStrictEqual(["helper", "object:error"]);
      expect(onResponse).toHaveBeenCalledWith(
        expect.objectContaining({ mutationContext: expect.objectContaining({ context: { todoId: 1 } }) }),
      );
      expect(setup.wasRefreshed(setup.getStats)).toBeFalse();
    });

    it("should run the object invalidation next to the commits on success", async () => {
      const setup = createSetup();
      const request = setup.updateTodo.setParams({ todoId: 1 }).setOptimistic(() => ({
        updates: [optimistic(setup.getTodos).patch(1, { done: true })],
        invalidate: [setup.getStats],
      }));
      mockRequest(request, { data: createTodo(1) });

      await request.send({ payload: {} });

      expect(setup.wasRefreshed(setup.getStats)).toBeTrue();
      expect(setup.wasRefreshed(setup.getTodos)).toBeTrue();
    });

    it("should pass the reason, response and request to a hand-written rollback", async () => {
      const setup = createSetup();
      const rollback = vi.fn();
      const request = setup.updateTodo.setParams({ todoId: 1 }).setOptimistic(() => ({ rollback }));
      mockRequest(request, { status: 400 });

      await request.send({ payload: {} });

      expect(rollback).toHaveBeenCalledWith(
        expect.objectContaining({ reason: "error", response: expect.objectContaining({ status: 400 }) }),
      );
    });
  });

  describe("when using rollbackOnError", () => {
    const sendFailing = async (
      setup: Setup,
      rollbackOnError: boolean | ((args: { response: { status: number | null } }) => boolean),
      status: 400 | 500 = 500,
    ) => {
      const rollback = vi.fn(({ previous }: { previous: Todo[] }) => previous);
      const objectRollback = vi.fn();
      const request = setup.updateTodo.setParams({ todoId: 1 }).setOptimistic(() => ({
        updates: [optimistic(setup.getTodos).remove(1).rollback(rollback)],
        rollback: objectRollback,
        rollbackOnError,
      }));
      mockRequest(request, { status });
      await request.send({ payload: {} });
      return { rollback, objectRollback };
    };

    it("should roll back with true", async () => {
      const setup = createSetup();
      const { rollback, objectRollback } = await sendFailing(setup, true);

      expect(rollback).toHaveBeenCalledTimes(1);
      expect(objectRollback).toHaveBeenCalledTimes(1);
      expect(setup.todos()).toStrictEqual(INITIAL_TODOS);
    });

    it("should keep the change and not refresh with false", async () => {
      const setup = createSetup();
      const { rollback, objectRollback } = await sendFailing(setup, false);

      expect(rollback).not.toHaveBeenCalled();
      expect(objectRollback).not.toHaveBeenCalled();
      expect(setup.todos()).toStrictEqual([INITIAL_TODOS[1], INITIAL_TODOS[2]]);
      expect(setup.invalidate).not.toHaveBeenCalled();
    });

    it("should ask the predicate with the response and request", async () => {
      const setup = createSetup();
      const predicate = vi.fn(({ response }: { response: { status: number | null } }) => response.status !== 400);

      const conflict = await sendFailing(setup, predicate, 400);
      const serverError = await sendFailing(createSetup(), predicate, 500);

      expect(predicate).toHaveBeenCalledTimes(2);
      expect(predicate.mock.calls[0][0]).toHaveProperty("request");
      expect(conflict.rollback).not.toHaveBeenCalled();
      expect(serverError.rollback).toHaveBeenCalledTimes(1);
    });

    it("should roll back and report when the predicate throws", async () => {
      const setup = createSetup();
      const { rollback } = await sendFailing(setup, () => {
        throw new Error("Predicate failed");
      });

      expect(rollback).toHaveBeenCalledTimes(1);
      expect(setup.logError).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Optimistic rollbackOnError failed" }),
      );
    });

    it("should still roll back an aborted request with false", async () => {
      const setup = createSetup();
      const rollback = vi.fn(({ previous }: { previous: Todo[] }) => previous);
      const request = setup.updateTodo.setParams({ todoId: 1 }).setOptimistic(() => ({
        updates: [optimistic(setup.getTodos).remove(1).rollback(rollback)],
        rollbackOnError: false,
      }));
      mockRequest(request, { delay: 100 });

      await request.send({ payload: {}, onRequestStart: () => request.abort() });

      expect(rollback).toHaveBeenCalledTimes(1);
      expect(setup.todos()).toStrictEqual(INITIAL_TODOS);
    });
  });

  describe("when using revalidate", () => {
    it("should not refresh with false", async () => {
      const setup = createSetup();
      const request = setup.updateTodo.setParams({ todoId: 1 }).setOptimistic(() => ({
        updates: [optimistic(setup.getTodos).patch(1, { done: true })],
        revalidate: false,
      }));
      mockRequest(request, { data: createTodo(1) });

      await request.send({ payload: {} });

      expect(setup.invalidate).not.toHaveBeenCalled();
      expect(setup.todos()?.[0].done).toBeTrue();
    });

    it("should not refresh a failed mutation with false", async () => {
      const setup = createSetup();
      const request = setup.updateTodo.setParams({ todoId: 1 }).setOptimistic(() => ({
        updates: [optimistic(setup.getTodos).patch(1, { done: true })],
        revalidate: false,
      }));
      mockRequest(request, { status: 500 });

      await request.send({ payload: {} });

      expect(setup.invalidate).not.toHaveBeenCalled();
    });
  });

  describe("when passing optimistic per call", () => {
    it("should use the operations instead of the request's callback", async () => {
      const setup = createSetup();
      const requestCallback = vi.fn(() => [optimistic(setup.getTodos).remove(1)]);
      const request = setup.updateTodo.setParams({ todoId: 2 }).setOptimistic(requestCallback);
      mockRequest(request, { data: createTodo(2), delay: 20 });

      const pending = request.send({
        payload: { done: true },
        optimistic: [optimistic(setup.getTodos).patch(2, { done: true })],
      });

      expect(requestCallback).not.toHaveBeenCalled();
      expect(setup.todos()?.map((todo) => todo.done)).toStrictEqual([false, true, false]);
      await pending;
    });

    it("should call a per-call callback with the mutation's values", async () => {
      const setup = createSetup();
      const callback = vi.fn(() => [optimistic(setup.getTodos).remove(3)]);
      const updateWithQuery = setup.client.createRequest<{
        response: Todo;
        payload: Partial<Todo>;
        queryParams: string;
      }>()({ endpoint: "/todos/:todoId", method: "PATCH" });
      mockRequest(updateWithQuery, { data: createTodo(3) });

      await updateWithQuery.send({
        params: { todoId: 3 },
        payload: { title: "x" },
        queryParams: "?force=true",
        optimistic: callback,
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { todoId: 3 },
          payload: { title: "x" },
          queryParams: "?force=true",
          optimistic,
          client: setup.client,
        }),
      );
      expect(setup.todos()).toStrictEqual([INITIAL_TODOS[0], INITIAL_TODOS[1]]);
    });

    it("should not leak the option into the request configuration", async () => {
      const setup = createSetup();
      mockRequest(setup.updateTodo, { data: createTodo(1) });
      let sentRequest: RequestInstance | undefined;

      await setup.updateTodo.send({
        params: { todoId: 1 },
        payload: {},
        optimistic: [],
        onBeforeSent: ({ request }) => {
          sentRequest = request;
        },
      });

      expect(sentRequest?.toJSON()).not.toHaveProperty("optimistic");
      expect(sentRequest?.optimistic).toBeUndefined();
    });
  });

  describe("when targeting all variants", () => {
    it("should change every query param variant and leave other endpoints alone", async () => {
      const setup = createSetup();
      const filtered = setup.listQuery.setQueryParams({ done: false });
      const page = setup.listQuery.setQueryParams({ page: 2 });
      const getTodo = setup.client.createRequest<{ response: Todo[] }>()({ endpoint: "/todos/:todoId" });
      const other = getTodo.setParams({ todoId: 1 });
      const lookalike = setup.client.createRequest<{ response: Todo[] }>()({ endpoint: "/todos-archive" });
      seedCache(setup.client, filtered, INITIAL_TODOS);
      seedCache(setup.client, page, [createTodo(4)]);
      seedCache(setup.client, other, INITIAL_TODOS);
      seedCache(setup.client, lookalike, INITIAL_TODOS);
      const targetJson = setup.getTodos.toJSON();
      const request = setup.updateTodo.setParams({ todoId: 1 }).setOptimistic(() => [
        optimistic
          .all(setup.getTodos)
          .remove(1)
          .rollback(({ data, previous }) => {
            const removed = previous.find((todo) => todo.id === 1);
            return removed ? [removed, ...data] : data;
          }),
      ]);
      mockRequest(request, { status: 500, delay: 20 });

      const pending = request.send({ payload: {} });

      expect(setup.todos()).toStrictEqual([INITIAL_TODOS[1], INITIAL_TODOS[2]]);
      expect(readCache(setup.client, filtered)).toStrictEqual([INITIAL_TODOS[1], INITIAL_TODOS[2]]);
      expect(readCache(setup.client, page)).toStrictEqual([createTodo(4)]);
      expect(readCache(setup.client, other)).toStrictEqual(INITIAL_TODOS);
      expect(readCache(setup.client, lookalike)).toStrictEqual(INITIAL_TODOS);

      await pending;

      // The target request itself is never changed
      expect(setup.getTodos.toJSON()).toStrictEqual(targetJson);
      expect(setup.todos()).toStrictEqual(INITIAL_TODOS);
      expect(readCache(setup.client, filtered)).toStrictEqual(INITIAL_TODOS);
      expect(readCache(setup.client, page)).toStrictEqual([createTodo(4)]);
      expect(setup.wasRefreshed(filtered)).toBeTrue();
      expect(setup.wasRefreshed(page)).toBeTrue();
      expect(setup.wasRefreshed(other)).toBeFalse();
    });

    it("should match the variants of a request with query params set", async () => {
      const setup = createSetup();
      const filtered = setup.listQuery.setQueryParams({ done: true });
      seedCache(setup.client, filtered, INITIAL_TODOS);
      mockRequest(setup.updateTodo, { data: createTodo(1) });

      await setup.updateTodo.send({
        params: { todoId: 1 },
        payload: {},
        optimistic: [optimistic.all(filtered).remove(1)],
      });

      expect(setup.todos()).toHaveLength(2);
      expect(readCache(setup.client, filtered)).toHaveLength(2);
    });

    it("should match pages derived from a custom cache key", async () => {
      const setup = createSetup();
      const feed = setup.getTodos.setCacheKey("feed");
      const secondPage = feed.setCacheKey("feed_2");
      const otherFeed = feed.setCacheKey("feedback");
      seedCache(setup.client, feed, INITIAL_TODOS);
      seedCache(setup.client, secondPage, [createTodo(1, { title: "page 2" })]);
      seedCache(setup.client, otherFeed, INITIAL_TODOS);
      mockRequest(setup.updateTodo, { data: createTodo(1) });

      await setup.updateTodo.send({
        params: { todoId: 1 },
        payload: {},
        optimistic: [optimistic.all(feed).patch(1, { done: true })],
      });

      expect(readCache<Todo[]>(setup.client, feed)?.[0].done).toBeTrue();
      expect(readCache<Todo[]>(setup.client, secondPage)?.[0].done).toBeTrue();
      expect(readCache<Todo[]>(setup.client, otherFeed)?.[0].done).toBeFalse();
    });
  });

  describe("when using scopes and several clients", () => {
    it("should only change the entry of the target's scope", async () => {
      const setup = createSetup();
      const scoped = setup.getTodos.setScope("user-1");
      const otherScope = setup.getTodos.setScope("user-2");
      seedCache(setup.client, scoped, INITIAL_TODOS);
      seedCache(setup.client, otherScope, INITIAL_TODOS);
      mockRequest(setup.updateTodo, { status: 500 });

      const pending = setup.updateTodo.send({
        params: { todoId: 1 },
        payload: {},
        optimistic: [
          optimistic
            .all(scoped)
            .remove(1)
            .rollback(({ previous }) => previous),
        ],
      });

      expect(readCache(setup.client, scoped)).toHaveLength(2);
      expect(readCache(setup.client, otherScope)).toStrictEqual(INITIAL_TODOS);
      expect(setup.todos()).toStrictEqual(INITIAL_TODOS);
      await pending;
      expect(readCache(setup.client, scoped)).toStrictEqual(INITIAL_TODOS);
    });

    it("should never touch the entries of another client", async () => {
      const first = createSetup();
      const second = createSetup();
      mockRequest(first.updateTodo, { data: createTodo(1) });

      await first.updateTodo.send({
        params: { todoId: 1 },
        payload: {},
        optimistic: [optimistic(first.getTodos).remove(1)],
      });

      expect(first.todos()).toHaveLength(2);
      expect(second.todos()).toStrictEqual(INITIAL_TODOS);
      expect(second.invalidate).not.toHaveBeenCalled();
    });

    it("should change nothing in server mode, where unscoped entries are not cached", async () => {
      const client = new Client({ url: "shared-base-url", mode: "server" });
      const getTodos = client.createRequest<{ response: Todo[] }>()({ endpoint: "/todos" });
      const mutation = client
        .createRequest<{ response: Todo }>()({ endpoint: "/todos/:todoId", method: "PATCH" })
        .setMock(() => ({ error: new Error("Failed"), status: 500, success: false }), {
          requestTime: 0,
          responseTime: 0,
        });
      seedCache(client, getTodos, INITIAL_TODOS);

      const response = await mutation.send({
        params: { todoId: 1 },
        optimistic: [
          optimistic(getTodos)
            .remove(1)
            .rollback(({ previous }) => previous),
        ],
      });

      expect(response.status).toBe(500);
      expect(readCache(client, getTodos)).toBeUndefined();
    });
  });

  describe("when counting cache events", () => {
    it("should emit exactly one event per visible change", async () => {
      const setup = createSetup();
      const events = countDataEvents(setup, setup.getTodos);
      const request = setup.updateTodo.setParams({ todoId: 1 }).setOptimistic(() => [
        optimistic(setup.getTodos).patch(99, { done: true }),
        optimistic(setup.getTodos)
          .patch(1, { done: true })
          .rollback(({ previous }) => previous),
      ]);
      mockRequest(request, { status: 500 });

      await request.send({ payload: {} });

      expect(events).toStrictEqual([
        [{ ...INITIAL_TODOS[0], done: true }, INITIAL_TODOS[1], INITIAL_TODOS[2]],
        INITIAL_TODOS,
      ]);
    });

    it("should keep the staleness of the entry", async () => {
      const setup = createSetup();
      setup.client.cache.invalidate(setup.getTodos);
      setup.invalidate.mockClear();
      mockRequest(setup.updateTodo, { data: createTodo(1), delay: 20 });

      const pending = setup.updateTodo.send({
        params: { todoId: 1 },
        payload: {},
        optimistic: [optimistic(setup.getTodos).remove(1)],
      });

      expect(setup.client.cache.get(setup.getTodos.cacheKey)?.staleTime).toBe(0);
      await pending;
    });
  });
});
