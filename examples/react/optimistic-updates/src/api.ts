import { createClient, optimistic } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Todo = {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
};
type ApiError = { message: string };

/** The list on screen. The optimistic changes below target this exact request, so they hit the same cache entry. */
export const getTodosRequest = client
  .createRequest<{
    response: { todos: Todo[]; total: number };
    queryParams: { limit: number };
  }>()({ endpoint: "/todos" })
  .setQueryParams({ limit: 6 });

/** `delay` makes dummyjson answer after one second, so you can see the UI change before the server replies. */
export const toggleTodoRequest = client
  .createRequest<{
    response: Todo;
    payload: Pick<Todo, "completed">;
    queryParams: { delay: number };
    error: ApiError;
  }>()({ endpoint: "/todos/:todoId", method: "PATCH" })
  .setQueryParams({ delay: 1000 })
  .setOptimistic(({ params, payload }) => ({
    updates: [
      optimistic(getTodosRequest)
        .list("todos")
        .patch(params.todoId, payload)
        // Core never guesses the undo. Put the old value back, built from the current data.
        .rollback(({ data, previous }) => {
          const before = previous.todos.find((todo) => todo.id === Number(params.todoId));
          return {
            ...data,
            todos: data.todos.map((todo) => (todo.id === before?.id ? before : todo)),
          };
        }),
    ],
    // dummyjson does not store writes. Refetching the list after success would bring the old value back.
    revalidate: false,
  }));

export const addTodoRequest = client
  .createRequest<{
    response: Todo;
    payload: Omit<Todo, "id">;
    queryParams: { delay: number };
    error: ApiError;
  }>()({ endpoint: "/todos/add", method: "POST" })
  .setQueryParams({ delay: 1000 })
  .setOptimistic(({ payload }) => {
    // A temporary negative id marks the row as "not saved yet" until the server answers.
    const temp: Todo = { ...payload, id: -Date.now() };

    return {
      updates: [
        optimistic(getTodosRequest)
          .list("todos")
          .insert(temp, { at: "start" })
          .rollback(({ data }) => ({
            ...data,
            todos: data.todos.filter((todo) => todo.id !== temp.id),
          })),
      ],
      revalidate: false,
    };
  });

/**
 * HyperFetch mocking replaces the adapter for a request, so we can simulate a server error on demand.
 * The mock stays attached and is switched on and off with `setMockingEnabled`.
 */
const serverError = () => ({
  error: { message: "Simulated server error" },
  status: 500,
});

toggleTodoRequest.setMock(serverError, { responseTime: 1000 }).setMockingEnabled(false);
addTodoRequest.setMock(serverError, { responseTime: 1000 }).setMockingEnabled(false);

export const setFailRequests = (fail: boolean) => {
  toggleTodoRequest.setMockingEnabled(fail);
  addTodoRequest.setMockingEnabled(fail);
};
