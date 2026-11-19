import type { RequestInstance } from "@hyper-fetch/core";
import { Client, optimistic } from "@hyper-fetch/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";
import { useInfiniteFetch } from "hooks/use-infinite-fetch";
import { useSubmit } from "hooks/use-submit";
import type { ReactNode } from "react";
import React, { StrictMode } from "react";

type Todo = { id: number; done: boolean; likes: number };

type Call = {
  request: RequestInstance;
  requestId: string;
  respond: (response: { data?: unknown; error?: unknown }) => void;
};

const todo = (id: number, extra: Partial<Todo> = {}): Todo => ({ id, done: false, likes: 0, ...extra });
const SERVER = [todo(1), todo(2)];

/**
 * Requests wait until the test answers them, only the network part of the adapter is replaced
 */
const createSetup = () => {
  const client = new Client({ url: "http://localhost:3000" });
  const calls: Call[] = [];

  client.adapter.setFetcher(({ request, requestId, onSuccess, onError, createAbortListener }) => {
    let isFinished = false;
    const extra = client.adapter.defaultExtra;
    createAbortListener({ status: 0, extra, onAbort: () => (isFinished = true) });
    calls.push({
      request,
      requestId,
      respond: ({ data = null, error }) => {
        if (isFinished) {
          return;
        }
        isFinished = true;
        if (error) {
          onError({ error, status: 500, extra });
        } else {
          onSuccess({ data, status: 200, extra });
        }
      },
    });
  });

  const getTodos = client.createRequest<{ response: Todo[] }>()({ endpoint: "/todos" });
  const toggle = client
    .createRequest<{ response: Todo; payload: { done: boolean } }>()({ endpoint: "/todos/:todoId", method: "PATCH" })
    .setOptimistic(({ params, payload }) => [
      optimistic(getTodos)
        .patch(params.todoId, payload)
        .rollback(({ data, previous }) => {
          const before = previous.find((item) => item.id === Number(params.todoId));
          return data.map((item) => (item.id === Number(params.todoId) && before ? before : item));
        }),
    ]);

  const callsTo = (endpoint: string) => calls.filter((call) => call.request.endpoint === endpoint);
  const lastCallTo = async (endpoint: string, count: number) => {
    await waitFor(() => expect(callsTo(endpoint)).toHaveLength(count), { interval: 1 });
    return callsTo(endpoint)[count - 1];
  };
  const answered = new Set<Call>();
  const answer = async (call: Call, response: { data?: unknown; error?: unknown }) => {
    answered.add(call);
    await act(async () => {
      call.respond(response);
    });
  };
  /** Waits for the oldest call to the endpoint which is not answered yet */
  const nextCallTo = async (endpoint: string) => {
    await waitFor(() => expect(callsTo(endpoint).some((call) => !answered.has(call))).toBeTrue(), { interval: 1 });
    return callsTo(endpoint).find((call) => !answered.has(call)) as Call;
  };
  const read = () => client.cache.get<Todo[], unknown>(getTodos.cacheKey)?.data;

  return { client, calls, getTodos, toggle, callsTo, lastCallTo, nextCallTo, answer, read };
};

type Setup = ReturnType<typeof createSetup>;

/** A list and a toggle button in one component, with a log of the rendered list */
const renderTodos = (setup: Setup, options: { wrapper?: (props: { children: ReactNode }) => ReactNode } = {}) => {
  const renders: (Todo[] | null)[] = [];
  const rendered = renderHook(
    () => {
      const list = useFetch(setup.getTodos, { dependencyTracking: false });
      const button = useSubmit(setup.toggle, { dependencyTracking: false });
      renders.push(list.data);
      return { list, button };
    },
    { wrapper: options.wrapper },
  );
  return { ...rendered, renders };
};

const loadList = async (setup: Setup, data: Todo[] = SERVER) => {
  await setup.answer(await setup.nextCallTo("/todos"), { data });
};

const doneOf = (list: Todo[] | null | undefined, id: number) => list?.find((item) => item.id === id)?.done;

describe("useSubmit [ Optimistic helpers ]", () => {
  describe("when submitting", () => {
    it("should show the change before the response and keep it without flicker on success", async () => {
      const setup = createSetup();
      const { result, renders } = renderTodos(setup);
      await loadList(setup);

      act(() => {
        result.current.button.submit({ params: { todoId: 1 }, payload: { done: true } });
      });
      expect(doneOf(result.current.list.data, 1)).toBeTrue();

      const mutation = await setup.lastCallTo("/todos/1", 1);
      await setup.answer(mutation, { data: todo(1, { done: true }) });

      // The refresh after the mutation reads the confirmed data
      await loadList(setup, [todo(1, { done: true }), todo(2)]);
      expect(doneOf(result.current.list.data, 1)).toBeTrue();

      const firstOptimistic = renders.findIndex((list) => doneOf(list, 1) === true);
      expect(renders.slice(firstOptimistic).every((list) => doneOf(list, 1) === true)).toBeTrue();
    });

    it("should revert on error and show the server data after the refresh", async () => {
      const setup = createSetup();
      const { result } = renderTodos(setup);
      await loadList(setup);

      act(() => {
        result.current.button.submit({ params: { todoId: 1 }, payload: { done: true } });
      });
      const mutation = await setup.lastCallTo("/todos/1", 1);
      await setup.answer(mutation, { error: new Error("Failed") });

      expect(doneOf(result.current.list.data, 1)).toBeFalse();
      await loadList(setup, [todo(1, { likes: 3 }), todo(2)]);
      expect(result.current.list.data).toStrictEqual([todo(1, { likes: 3 }), todo(2)]);
    });

    it("should settle a mutation of an unmounted component", async () => {
      const setup = createSetup();
      const { result, unmount } = renderTodos(setup);
      await loadList(setup);

      act(() => {
        result.current.button.submit({ params: { todoId: 1 }, payload: { done: true } });
      });
      const mutation = await setup.lastCallTo("/todos/1", 1);
      unmount();
      await setup.answer(mutation, { error: new Error("Failed") });

      expect(doneOf(setup.read(), 1)).toBeFalse();

      // A remount shows the reverted value
      const remounted = renderTodos(setup);
      expect(doneOf(remounted.result.current.list.data, 1)).toBeFalse();
    });

    it("should update every component reading the key", async () => {
      const setup = createSetup();
      const first = renderTodos(setup);
      await loadList(setup);
      const second = renderHook(() => useFetch(setup.getTodos, { dependencyTracking: false }));

      act(() => {
        first.result.current.button.submit({ params: { todoId: 2 }, payload: { done: true } });
      });

      expect(doneOf(first.result.current.list.data, 2)).toBeTrue();
      expect(doneOf(second.result.current.data, 2)).toBeTrue();
    });

    it("should apply the change once in StrictMode", async () => {
      const setup = createSetup();
      const like = setup.client
        .createRequest<{ response: null }>()({ endpoint: "/like", method: "POST" })
        .setOptimistic(() => [optimistic(setup.getTodos).increment(1, "likes", 1)]);
      const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;
      const { result } = renderHook(
        () => ({
          list: useFetch(setup.getTodos, { dependencyTracking: false }),
          button: useSubmit(like, { dependencyTracking: false }),
        }),
        { wrapper },
      );
      await waitFor(() => expect(setup.callsTo("/todos").length).toBeGreaterThan(0), { interval: 1 });
      await Promise.all(setup.callsTo("/todos").map((call) => setup.answer(call, { data: SERVER })));

      act(() => {
        result.current.button.submit();
      });

      expect(result.current.list.data?.[0].likes).toBe(1);
    });
  });

  describe("when toggling rapidly", () => {
    it("should end on the server value after ten clicks with mixed outcomes", async () => {
      const setup = createSetup();
      const { result } = renderTodos(setup);
      await loadList(setup);
      let server = [...SERVER];
      const outcomes = [true, false, true, true, false, false, true, false, true, false];

      for (const [index] of outcomes.entries()) {
        act(() => {
          result.current.button.submit({ params: { todoId: 1 }, payload: { done: index % 2 === 0 } });
        });
      }
      expect(doneOf(result.current.list.data, 1)).toBeFalse();

      const mutations = await setup.lastCallTo("/todos/1", outcomes.length).then(() => setup.callsTo("/todos/1"));
      // The server answers in reverse order
      for (const index of [...outcomes.keys()].toReversed()) {
        if (outcomes[index]) {
          server = server.map((item) => (item.id === 1 ? { ...item, done: index % 2 === 0 } : item));
          // eslint-disable-next-line no-await-in-loop
          await setup.answer(mutations[index], { data: server[0] });
        } else {
          // eslint-disable-next-line no-await-in-loop
          await setup.answer(mutations[index], { error: new Error("Failed") });
        }
      }

      // One refresh after the last mutation
      await loadList(setup, server);
      expect(result.current.list.data).toStrictEqual(server);
      expect(setup.callsTo("/todos")).toHaveLength(2);
    });
  });

  describe("when the list is fetched during a pending change", () => {
    it("should discard a manual refetch that started before the change settled", async () => {
      const setup = createSetup();
      const { result } = renderTodos(setup);
      await loadList(setup);

      act(() => {
        result.current.button.submit({ params: { todoId: 1 }, payload: { done: true } });
      });
      act(() => {
        result.current.list.refetch();
      });
      const refetch = await setup.lastCallTo("/todos", 2);
      await setup.answer(refetch, { data: SERVER });

      expect(doneOf(result.current.list.data, 1)).toBeTrue();

      const mutation = await setup.lastCallTo("/todos/1", 1);
      await setup.answer(mutation, { data: todo(1, { done: true }) });
      await loadList(setup, [todo(1, { done: true }), todo(2)]);
      expect(doneOf(result.current.list.data, 1)).toBeTrue();
    });

    it("should discard a refetch on focus that started before the change settled", async () => {
      const setup = createSetup();
      const renders: (Todo[] | null)[] = [];
      const { result } = renderHook(() => {
        const list = useFetch(setup.getTodos, { dependencyTracking: false, refetchOnFocus: true });
        const button = useSubmit(setup.toggle, { dependencyTracking: false });
        renders.push(list.data);
        return { list, button };
      });
      await loadList(setup);

      act(() => {
        result.current.button.submit({ params: { todoId: 1 }, payload: { done: true } });
      });
      act(() => {
        setup.client.appManager.setFocused(false);
        setup.client.appManager.setFocused(true);
      });
      const focusFetch = await setup.lastCallTo("/todos", 2);
      const mutation = await setup.lastCallTo("/todos/1", 1);
      await setup.answer(mutation, { data: todo(1, { done: true }) });
      await setup.answer(focusFetch, { data: SERVER });

      expect(doneOf(result.current.list.data, 1)).toBeTrue();
      await loadList(setup, [todo(1, { done: true }), todo(2)]);
      expect(doneOf(result.current.list.data, 1)).toBeTrue();
    });

    it("should discard a polling refresh while the change is pending", async () => {
      const setup = createSetup();
      const { result } = renderHook(() => ({
        list: useFetch(setup.getTodos, { dependencyTracking: false, refresh: true, refreshTime: 20 }),
        button: useSubmit(setup.toggle, { dependencyTracking: false }),
      }));
      await loadList(setup);

      act(() => {
        result.current.button.submit({ params: { todoId: 1 }, payload: { done: true } });
      });
      const poll = await setup.lastCallTo("/todos", 2);
      await setup.answer(poll, { data: SERVER });

      expect(doneOf(result.current.list.data, 1)).toBeTrue();
      const mutation = await setup.lastCallTo("/todos/1", 1);
      await setup.answer(mutation, { error: new Error("Failed") });
      expect(doneOf(result.current.list.data, 1)).toBeFalse();
    });
  });

  describe("when passing optimistic to the hook", () => {
    it("should use the hook option and let submit() override it", async () => {
      const setup = createSetup();
      const plain = setup.client.createRequest<{ response: null }>()({ endpoint: "/plain", method: "POST" });
      const { result } = renderHook(() => ({
        list: useFetch(setup.getTodos, { dependencyTracking: false }),
        button: useSubmit(plain, {
          dependencyTracking: false,
          optimistic: [optimistic(setup.getTodos).patch(1, { likes: 1 })],
        }),
      }));
      await loadList(setup);

      act(() => {
        result.current.button.submit();
      });
      expect(result.current.list.data?.[0].likes).toBe(1);

      act(() => {
        result.current.button.submit({ optimistic: [optimistic(setup.getTodos).patch(2, { likes: 5 })] });
      });
      expect(result.current.list.data?.map((item) => item.likes)).toStrictEqual([1, 5]);
    });

    it("should replace the request's callback with the hook option", async () => {
      const setup = createSetup();
      const { result } = renderHook(() => ({
        list: useFetch(setup.getTodos, { dependencyTracking: false }),
        button: useSubmit(setup.toggle, {
          dependencyTracking: false,
          optimistic: ({ params }) => [optimistic(setup.getTodos).remove(params.todoId)],
        }),
      }));
      await loadList(setup);

      act(() => {
        result.current.button.submit({ params: { todoId: 1 }, payload: { done: true } });
      });

      expect(result.current.list.data).toStrictEqual([todo(2)]);
    });
  });

  describe("when settling through useSubmit", () => {
    it.each([
      { name: "success", response: { data: todo(1, { done: true }) }, done: true, reverted: false },
      { name: "final error", response: { error: new Error("Failed") }, done: false, reverted: true },
    ])("should settle $name", async ({ response, done }) => {
      const setup = createSetup();
      const { result } = renderTodos(setup);
      await loadList(setup);
      const onSettled = vi.fn();

      act(() => {
        result.current.button.onSubmitFinished(onSettled);
        result.current.button.submit({ params: { todoId: 1 }, payload: { done: true } });
      });
      const mutation = await setup.lastCallTo("/todos/1", 1);
      await setup.answer(mutation, response);

      expect(doneOf(result.current.list.data, 1)).toBe(done);
      expect(onSettled).toHaveBeenCalledTimes(1);
      // The list is refetched once
      await setup.lastCallTo("/todos", 2);
    });

    it("should settle abort", async () => {
      const setup = createSetup();
      const { result } = renderTodos(setup);
      await loadList(setup);

      act(() => {
        result.current.button.submit({ params: { todoId: 1 }, payload: { done: true } });
      });
      await setup.lastCallTo("/todos/1", 1);
      await act(async () => {
        result.current.button.abort();
      });

      expect(doneOf(result.current.list.data, 1)).toBeFalse();
    });

    it("should keep the change while retrying", async () => {
      const setup = createSetup();
      const retried = setup.toggle.setRetry(1).setRetryTime(0);
      const { result } = renderHook(() => ({
        list: useFetch(setup.getTodos, { dependencyTracking: false }),
        button: useSubmit(retried, { dependencyTracking: false }),
      }));
      await loadList(setup);

      act(() => {
        result.current.button.submit({ params: { todoId: 1 }, payload: { done: true } });
      });
      await setup.answer(await setup.lastCallTo("/todos/1", 1), { error: new Error("Failed") });
      expect(doneOf(result.current.list.data, 1)).toBeTrue();

      await setup.answer(await setup.lastCallTo("/todos/1", 2), { error: new Error("Failed") });
      expect(doneOf(result.current.list.data, 1)).toBeFalse();
    });
  });

  describe("when the list is infinite", () => {
    it("should change and revert every loaded page with optimistic.all", async () => {
      const setup = createSetup();
      const getPages = setup.client.createRequest<{ response: Todo[]; queryParams: { page?: number } }>()({
        endpoint: "/pages",
      });
      const remove = setup.client
        .createRequest<{ response: null }>()({ endpoint: "/pages/:id", method: "DELETE" })
        .setOptimistic(({ params }) => [
          optimistic
            .all(getPages)
            .remove(params.id)
            .rollback(({ data, previous }) => {
              const index = previous.findIndex((item) => item.id === Number(params.id));
              if (index === -1) {
                return data;
              }
              const next = [...data];
              next.splice(index, 0, previous[index]);
              return next;
            }),
        ]);
      const { result } = renderHook(() => ({
        list: useInfiniteFetch(getPages, { pagination: { page: "page" }, dependencyTracking: false }),
        button: useSubmit(remove, { dependencyTracking: false }),
      }));
      await setup.answer(await setup.lastCallTo("/pages", 1), { data: [todo(1), todo(2)] });
      await waitFor(() => expect(result.current.list.items).toHaveLength(2));
      let nextPage: Promise<unknown> = Promise.resolve();
      act(() => {
        nextPage = result.current.list.fetchNextPage();
      });
      await setup.answer(await setup.lastCallTo("/pages", 2), { data: [todo(3), todo(4)] });
      await act(() => nextPage);

      act(() => {
        result.current.button.submit({ params: { id: 3 } });
      });
      await waitFor(() => expect(result.current.list.items.map((item) => item.id)).toStrictEqual([1, 2, 4]));

      await setup.answer(await setup.lastCallTo("/pages/3", 1), { error: new Error("Failed") });
      await waitFor(() => expect(result.current.list.items.map((item) => item.id)).toStrictEqual([1, 2, 3, 4]));
    });
  });
});
