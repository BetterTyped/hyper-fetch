import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Todo = { id: number; todo: string; completed: boolean };

export const getTodosRequest = client
  .createRequest<{
    response: { todos: Todo[]; total: number };
    queryParams: { limit: number; select: string };
  }>()({ endpoint: "/todos" })
  .setQueryParams({ limit: 8, select: "todo,completed" });

/**
 * `queued: true` runs requests that share a query key one after another. By default every todo has its own key
 * (the endpoint with its id), so they still run in parallel. A shared key puts them in one line.
 * `delay` makes dummyjson answer after 600 ms, so you can watch the progress.
 */
export const completeTodoRequest = client
  .createRequest<{ response: Todo; payload: Pick<Todo, "completed">; queryParams: { delay: number } }>()({
    endpoint: "/todos/:todoId",
    method: "PATCH",
    queued: true,
  })
  .setQueryParams({ delay: 600 });

export const deleteTodoRequest = client
  .createRequest<{ response: Todo & { isDeleted: boolean }; queryParams: { delay: number } }>()({
    endpoint: "/todos/:todoId",
    method: "DELETE",
    queued: true,
  })
  .setQueryParams({ delay: 600 });

/** Answers instead of the network for the rows that should fail. dummyjson does not fail on purpose. */
export const serverError = () => ({ error: new Error("Simulated server error"), status: 500 });
