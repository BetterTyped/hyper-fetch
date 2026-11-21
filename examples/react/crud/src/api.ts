import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Todo = {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
};
type ApiError = { message: string };

// Read
export const getTodosRequest = client
  .createRequest<{
    response: { todos: Todo[]; total: number };
    queryParams: { limit: number };
  }>()({
    endpoint: "/todos",
  })
  .setQueryParams({ limit: 5 });

// Create
export const createTodoRequest = client.createRequest<{
  response: Todo;
  payload: Omit<Todo, "id">;
  error: ApiError;
}>()({ endpoint: "/todos/add", method: "POST" });

// Update
export const updateTodoRequest = client.createRequest<{
  response: Todo;
  payload: Partial<Pick<Todo, "todo" | "completed">>;
  error: ApiError;
}>()({ endpoint: "/todos/:todoId", method: "PATCH" });

// Delete
export const deleteTodoRequest = client.createRequest<{
  response: Todo & { isDeleted: boolean };
  error: ApiError;
}>()({ endpoint: "/todos/:todoId", method: "DELETE" });

/**
 * Writes the result of a mutation into the cached list. Every component that reads `getTodosRequest` re-renders
 * with the new list, and no extra request is sent.
 */
export const updateCachedTodos = (update: (todos: Todo[]) => Todo[]) => {
  client.cache.update(getTodosRequest, (cached) => {
    if (!cached?.data) return {};
    return { data: { ...cached.data, todos: update(cached.data.todos) } };
  });
};
