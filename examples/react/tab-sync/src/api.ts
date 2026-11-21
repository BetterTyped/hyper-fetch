import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Todo = { id: number; todo: string; completed: boolean };

export const getTodos = client
  .createRequest<{ response: { todos: Todo[] }; queryParams: { limit: number; select: string } }>()({
    endpoint: "/todos",
  })
  // `select` is a dummyjson query param: the API returns only these fields.
  .setQueryParams({ limit: 5, select: "todo,completed" });

export const toggleTodo = client.createRequest<{ response: Todo; payload: Pick<Todo, "completed"> }>()({
  endpoint: "/todos/:todoId",
  method: "PATCH",
  // The answer goes into the list below, so it does not need a cache entry (or a message to the other tabs).
  cache: false,
});
