import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Todo = { id: number; todo: string; completed: boolean; userId: number };

export const addTodo = client.createRequest<{
  response: Todo;
  payload: Omit<Todo, "id">;
}>()({
  endpoint: "/todos/add",
  method: "POST",
  // Kept in the queue while the app is offline and sent when it is back online. `true` is the default.
  offline: true,
  // One at a time, in the order they were added, so the server sees the changes in the order the user made them.
  queued: true,
});
