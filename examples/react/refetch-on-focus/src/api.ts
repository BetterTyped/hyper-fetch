import { createClient } from "@hyper-fetch/core";

/** `client.appManager` tracks focus and network state for every request of this client. */
export const client = createClient({ url: "https://dummyjson.com" });

export type Todo = { id: number; todo: string; completed: boolean };

/** Returns a different todo on every call, so each refetch is visible. */
export const getRandomTodo = client.createRequest<{ response: Todo }>()({
  endpoint: "/todos/random",
});
