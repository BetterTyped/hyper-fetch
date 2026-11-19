import { expectTypeOf } from "vitest";

import type { ResponseSuccessType } from "adapter";
import { Client } from "client";
import type { HttpAdapterType } from "http-adapter";
import { optimistic } from "optimistic";
import type { OptimisticOperation } from "optimistic";
import type { ParamType, RequestInstance } from "request";
import type { ExtractMutationContextType } from "types";

type Todo = { id: number; title: string; done: boolean; likes: number };
type Feed = { cursor: string | null; total: number; items: Todo[]; title: string };

const client = new Client({ url: "http://localhost:3000" });
const getTodos = client.createRequest<{ response: Todo[] }>()({ endpoint: "/todos" });
const getFeed = client.createRequest<{ response: Feed }>()({ endpoint: "/feed" });
const getTodo = client.createRequest<{ response: Todo }>()({ endpoint: "/todos/:todoId" });
const toggleTodo = client.createRequest<{ response: Todo; payload: { done: boolean } }>()({
  endpoint: "/todos/:todoId",
  method: "PATCH",
});
const createTodo = client.createRequest<{ response: Todo; payload: Omit<Todo, "id"> }>()({
  endpoint: "/todos",
  method: "POST",
});

describe("Optimistic [ TypeScript ]", () => {
  describe("when describing changes", () => {
    it("should type the updater and the helpers with the target's data", () => {
      optimistic(getTodos).set((data) => {
        expectTypeOf(data).toEqualTypeOf<Todo[]>();
        return data;
      });
      optimistic(getFeed).set((data) => {
        expectTypeOf(data).toEqualTypeOf<Feed>();
        return data;
      });

      expectTypeOf(optimistic(getTodos).patch(1, { done: true })).toEqualTypeOf<
        OptimisticOperation<Todo[], RequestInstance>
      >();
      optimistic(getTodos).patch((todo) => {
        expectTypeOf(todo).toEqualTypeOf<Todo>();
        return todo.done;
      }, {});
      // @ts-expect-error patch takes fields of the item only
      optimistic(getTodos).patch(1, { unknown: true });
      // @ts-expect-error patch takes values of the right type
      optimistic(getTodos).patch(1, { done: "yes" });

      optimistic(getTodos).insert({ id: 4, title: "new", done: false, likes: 0 });
      // @ts-expect-error insert requires a full item
      optimistic(getTodos).insert({ id: 4 });

      optimistic(getTodos).remove(1);
      optimistic(getTodos).remove("1");
      // @ts-expect-error an id value has to be a string or number like the id
      optimistic(getTodos).remove(true);
    });

    it("should match by a custom key", () => {
      optimistic(getTodos).remove("todo-1", { key: "title" });
      optimistic(getTodos).patch("todo-1", { done: true }, { key: "title" });
      // @ts-expect-error the key has to be a field of the item
      optimistic(getTodos).remove("todo-1", { key: "slug" });
    });

    it("should only offer increment for number fields", () => {
      optimistic(getFeed).increment("total", 1);
      optimistic(getTodos).increment(1, "likes", 1);
      // @ts-expect-error title is not a number
      optimistic(getFeed).increment("title", 1);
      // @ts-expect-error done is not a number
      optimistic(getTodos).increment(1, "done", 1);
    });

    it("should offer list helpers on arrays and .list() on objects", () => {
      // @ts-expect-error the data is an object - name its list first
      optimistic(getFeed).patch(1, { done: true });
      // @ts-expect-error a list has no fields to name
      optimistic(getTodos).list("items");

      const operation = optimistic(getFeed).list("items").patch(1, { done: true });
      expectTypeOf(operation).toEqualTypeOf<OptimisticOperation<Feed, RequestInstance>>();
      optimistic(getFeed).list("items").insert({ id: 4, title: "new", done: false, likes: 0 });
      // @ts-expect-error total is not an array
      optimistic(getFeed).list("total");
    });

    it("should reject a target which still needs params", () => {
      // @ts-expect-error params of the target are not set
      optimistic(getTodo);
      // @ts-expect-error params of the target are not set
      optimistic.all(getTodo);

      optimistic(getTodo.setParams({ todoId: 1 })).set((todo) => ({ ...todo, done: true }));
      optimistic.all(getTodos).remove(1);
    });
  });

  describe("when describing the undo and the commit", () => {
    it("should type rollback with the target's data", () => {
      optimistic(getTodos)
        .remove(1)
        .rollback((args) => {
          expectTypeOf(args.data).toEqualTypeOf<Todo[]>();
          expectTypeOf(args.previous).toEqualTypeOf<Todo[]>();
          expectTypeOf(args.reason).toEqualTypeOf<"error" | "abort" | "removed">();
          if (args.reason === "removed") {
            expectTypeOf(args.response).toEqualTypeOf<undefined>();
          }
          return args.data;
        });

      optimistic(getTodos)
        .remove(1)
        .rollback(() => {});
      // @ts-expect-error rollback returns the target's data
      optimistic(getTodos).remove(1).rollback(() => "wrong");
    });

    it("should type commit with the mutation's response through the callback's builder", () => {
      createTodo.setOptimistic(({ payload, optimistic: typed }) => {
        expectTypeOf(payload).toEqualTypeOf<Omit<Todo, "id">>();
        return [
          typed(getTodos)
            .insert({ id: -1, ...payload })
            .commit(({ data, response, request }) => {
              expectTypeOf(response).toEqualTypeOf<ResponseSuccessType<Todo, HttpAdapterType>>();
              expectTypeOf(request).toEqualTypeOf<typeof createTodo>();
              return data.map((todo) => (todo.id === -1 ? response.data : todo));
            })
            .rollback(({ data, response }) => {
              if (response) {
                expectTypeOf(response.data).toEqualTypeOf<Todo | null>();
              }
              return data;
            }),
        ];
      });
    });
  });

  describe("when returning from setOptimistic", () => {
    it("should type the callback arguments with the mutation", () => {
      toggleTodo.setOptimistic(({ params, payload, request }) => {
        expectTypeOf(params).toEqualTypeOf<{ todoId: ParamType }>();
        expectTypeOf(payload).toEqualTypeOf<{ done: boolean }>();
        expectTypeOf(request).toEqualTypeOf<typeof toggleTodo>();
        return [optimistic(getTodos).patch(params.todoId, payload)];
      });
    });

    it("should accept the array, the object and the combined form", () => {
      const withArray = toggleTodo.setOptimistic(() => [optimistic(getTodos).remove(1)]);
      const withObject = toggleTodo.setOptimistic(() => ({ context: { id: 1 }, rollback: () => {} }));
      const combined = toggleTodo.setOptimistic(() => ({
        context: { id: 1 },
        updates: [optimistic(getTodos).remove(1), optimistic(getFeed).increment("total", -1)],
        rollbackOnError: ({ response }) => response.status !== 409,
        revalidate: false,
      }));

      expectTypeOf<ExtractMutationContextType<typeof withArray>>().toEqualTypeOf<undefined>();
      expectTypeOf<ExtractMutationContextType<typeof withObject>>().toEqualTypeOf<{ id: number }>();
      expectTypeOf<ExtractMutationContextType<typeof combined>>().toEqualTypeOf<{ id: number }>();

      // @ts-expect-error updates have to be operations
      toggleTodo.setOptimistic(() => ({ updates: [{ id: 1 }] }));
      // @ts-expect-error revalidate is a boolean
      toggleTodo.setOptimistic(() => ({ revalidate: "no" }));
    });

    it("should accept optimistic per call", () => {
      const sendToggle = () =>
        toggleTodo.send({
          params: { todoId: 1 },
          payload: { done: true },
          optimistic: [optimistic(getTodos).patch(1, { done: true })],
        });
      const sendWithCallback = () =>
        toggleTodo.send({
          params: { todoId: 1 },
          payload: { done: true },
          optimistic: ({ payload }) => [optimistic(getTodos).patch(1, payload)],
        });

      expectTypeOf(sendToggle).toBeFunction();
      expectTypeOf(sendWithCallback).toBeFunction();
      const sendInvalid = () =>
        // @ts-expect-error per-call optimistic takes operations or a callback
        toggleTodo.send({ params: { todoId: 1 }, payload: { done: true }, optimistic: [1] });
      expectTypeOf(sendInvalid).toBeFunction();
    });
  });
});
