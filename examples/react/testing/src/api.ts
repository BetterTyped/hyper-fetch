import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Todo = { id: number; todo: string; completed: boolean; userId: number };

/**
 * Export the exact request the component uses. `setMock` changes only the instance it is called on, and a request
 * derived from it earlier (for example with `setQueryParams`) would keep going to the network in tests.
 */
export const getTodosRequest = client
  .createRequest<{
    response: { todos: Todo[]; total: number };
    queryParams: { limit: number };
  }>()({ endpoint: "/todos" })
  .setQueryParams({ limit: 5 });

export const updateTodoRequest = client.createRequest<{ response: Todo; payload: Pick<Todo, "completed"> }>()({
  endpoint: "/todos/:todoId",
  method: "PATCH",
});
