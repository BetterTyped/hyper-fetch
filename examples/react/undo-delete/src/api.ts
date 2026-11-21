import { createClient, optimistic } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Todo = { id: number; todo: string; completed: boolean };

export const getTodosRequest = client
  .createRequest<{
    response: { todos: Todo[]; total: number };
    queryParams: { limit: number; select: string };
  }>()({ endpoint: "/todos" })
  // `select` is a dummyjson query param: the API returns only these fields.
  .setQueryParams({ limit: 6, select: "todo,completed" });

/** The todo leaves the list when `send()` is called. If the request fails or is removed from its queue, it comes back. */
export const deleteTodoRequest = client
  .createRequest<{ response: Todo & { isDeleted: boolean }; queryParams: { delay: number } }>()({
    endpoint: "/todos/:todoId",
    method: "DELETE",
  })
  // dummyjson answers after 800 ms, so you can see the request running.
  .setQueryParams({ delay: 800 })
  .setOptimistic(({ params }) => ({
    updates: [
      optimistic(getTodosRequest)
        .list("todos")
        .remove(params.todoId)
        // Put the todo back where it was. `previous` is the list right before the removal.
        .rollback(({ data, previous }) => {
          const index = previous.todos.findIndex((todo) => todo.id === Number(params.todoId));
          const removed = previous.todos[index];
          if (!removed || data.todos.some((todo) => todo.id === removed.id)) return data;
          return { ...data, todos: [...data.todos.slice(0, index), removed, ...data.todos.slice(index)] };
        }),
    ],
    // dummyjson does not store deletes. Refetching the list would bring the todo back.
    revalidate: false,
  }));

/** dummyjson never fails on purpose. While the switch is on, this mock answers 500 instead of the network. */
deleteTodoRequest
  .setMock(() => ({ error: new Error("Simulated server error"), status: 500 }), { responseTime: 800 })
  .setMockingEnabled(false);

export const setFailDeletes = (fail: boolean) => {
  deleteTodoRequest.setMockingEnabled(fail);
};
