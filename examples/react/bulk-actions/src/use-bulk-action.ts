import { useState } from "react";

import { client, completeTodoRequest, deleteTodoRequest, getTodosRequest, serverError } from "./api";
import type { Todo } from "./api";

export type RowStatus = { state: "waiting" | "running" | "done" | "failed"; message?: string };
export type BulkOptions = { oneByOne: boolean; failingIds: Set<number> };

/** Runs one request per selected todo and tracks the result of each row. */
export const useBulkAction = () => {
  const [statuses, setStatuses] = useState<Record<number, RowStatus>>({});
  const setStatus = (id: number, status: RowStatus) => setStatuses((current) => ({ ...current, [id]: status }));

  const complete = (todo: Todo, { oneByOne, failingIds }: BulkOptions) => {
    let request = completeTodoRequest.setParams({ todoId: todo.id }).setPayload({ completed: true });
    // One shared query key puts every request of this action in the same queue.
    if (oneByOne) request = request.setQueryKey("bulk-action");
    // `setMock` changes only this instance, so only this row fails.
    if (failingIds.has(todo.id)) request.setMock(serverError, { responseTime: 600 });
    return request.send({ onRequestStart: () => setStatus(todo.id, { state: "running" }) });
  };

  const remove = (todo: Todo, { oneByOne, failingIds }: BulkOptions) => {
    let request = deleteTodoRequest.setParams({ todoId: todo.id });
    if (oneByOne) request = request.setQueryKey("bulk-action");
    if (failingIds.has(todo.id)) request.setMock(serverError, { responseTime: 600 });
    return request.send({ onRequestStart: () => setStatus(todo.id, { state: "running" }) });
  };

  const run = async (action: "complete" | "delete", todos: Todo[], options: BulkOptions) => {
    setStatuses(Object.fromEntries(todos.map((todo) => [todo.id, { state: "waiting" }])));

    // Every request reports its own result. One failure does not stop or undo the others.
    await Promise.all(
      todos.map(async (todo) => {
        const response = action === "complete" ? await complete(todo, options) : await remove(todo, options);
        if (!response.success) {
          setStatus(todo.id, { state: "failed", message: response.error?.message });
          return;
        }
        setStatus(todo.id, { state: "done" });
        // dummyjson does not store changes, so the list in the cache is updated by hand.
        client.cache.update(getTodosRequest, (cached) => {
          if (!cached?.data) return {};
          const todos =
            action === "delete"
              ? cached.data.todos.filter((item) => item.id !== todo.id)
              : cached.data.todos.map((item) => (item.id === todo.id ? { ...item, completed: true } : item));
          return { data: { ...cached.data, todos } };
        });
      }),
    );
  };

  return { statuses, run };
};
