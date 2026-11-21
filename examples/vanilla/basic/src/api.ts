import { createClient } from "@hyper-fetch/core";

/** `@hyper-fetch/core` has no framework code. The same client works in a browser, Node or a worker. */
export const client = createClient({ url: "https://dummyjson.com" });

export type Todo = {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
};

export const getTodos = client.createRequest<{
  response: { todos: Todo[]; total: number };
  queryParams: { limit: number };
}>()({
  endpoint: "/todos",
});

/** dummyjson answers an unknown id with `404 { message }`. `error` types that body. */
export const getTodo = client.createRequest<{
  response: Todo;
  error: { message: string };
}>()({
  endpoint: "/todos/:todoId",
});
