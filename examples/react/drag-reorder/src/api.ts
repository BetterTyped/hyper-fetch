import { createClient, optimistic } from "@hyper-fetch/core";

export const client = createClient({ url: "https://dummyjson.com" });

export type Todo = { id: number; todo: string; completed: boolean };
type TodoList = { todos: Todo[]; total: number };

export const getTodosRequest = client
  .createRequest<{ response: TodoList; queryParams: { limit: number; select: string } }>()({ endpoint: "/todos" })
  // `select` is a dummyjson query param: the API returns only these fields.
  .setQueryParams({ limit: 6, select: "todo,completed" });

/** Returns a new list with the todo moved to `index`. */
export const moveTodo = (todos: Todo[], todoId: number, index: number) => {
  const todo = todos.find((item) => item.id === todoId);
  if (!todo) return todos;
  const rest = todos.filter((item) => item.id !== todoId);
  return [...rest.slice(0, index), todo, ...rest.slice(index)];
};

/**
 * Saves the new position of one todo. dummyjson accepts the request but does not store the order; a real API would.
 * The optimistic update moves the todo in the cached list before the request is sent.
 */
export const moveTodoRequest = client
  .createRequest<{ response: Todo; payload: { position: number }; queryParams: { delay: number } }>()({
    endpoint: "/todos/:todoId",
    method: "PATCH",
  })
  // dummyjson answers after one second, so you can drag again while a save is running.
  .setQueryParams({ delay: 1000 })
  .setOptimistic(({ params, payload }) => {
    const todoId = Number(params.todoId);
    return {
      updates: [
        optimistic(getTodosRequest)
          .set((data) => ({ ...data, todos: moveTodo(data.todos, todoId, payload.position) }))
          // Move only this todo back to where it was, so other moves made in the meantime stay.
          .rollback(({ data, previous }) => {
            const oldIndex = previous.todos.findIndex((todo) => todo.id === todoId);
            return { ...data, todos: moveTodo(data.todos, todoId, oldIndex) };
          }),
      ],
      // dummyjson does not store the order. Refetching the list after the save would undo the move.
      revalidate: false,
    };
  });

/** dummyjson never fails on purpose. While the switch is on, this mock answers 500 instead of the network. */
moveTodoRequest
  .setMock(() => ({ error: new Error("Simulated server error"), status: 500 }), { responseTime: 1000 })
  .setMockingEnabled(false);

export const setFailMoves = (fail: boolean) => {
  moveTodoRequest.setMockingEnabled(fail);
};
