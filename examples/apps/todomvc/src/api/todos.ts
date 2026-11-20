import { optimistic } from "@hyper-fetch/core";

// Type-only import: the server code never reaches the browser bundle, but both sides share the `Todo` type.
import type { Todo } from "../../server/app";
import { client } from "./client";

export type { Todo };
type TodoChanges = Partial<Pick<Todo, "title" | "completed">>;

/** The one list on screen. The filters only change what is rendered, so they all share this cache entry. */
export const getTodos = client.createRequest<{ response: Todo[] }>()({ endpoint: "/api/todos" });

/** For the rollbacks: puts the todo from `previous` back where it was, and keeps every other change. */
const restore = (data: Todo[], previous: Todo[], todoId: number) => {
  const index = previous.findIndex((todo) => todo.id === todoId);
  const before = previous[index];
  if (!before) return data;
  const rest = data.filter((todo) => todo.id !== todoId);
  return [...rest.slice(0, index), before, ...rest.slice(index)];
};

export const createTodo = client
  .createRequest<{ response: Todo; payload: { title: string } }>()({ endpoint: "/api/todos", method: "POST" })
  .setOptimistic(({ payload }) => {
    // A negative id marks the todo as "not saved yet" until the server answers with the real one.
    const temp: Todo = { id: -Date.now(), title: payload.title, completed: false };
    return [
      optimistic(getTodos)
        .insert(temp)
        .commit(({ data, response }) => data.map((todo) => (todo.id === temp.id ? response.data : todo)))
        .rollback(({ data }) => data.filter((todo) => todo.id !== temp.id)),
    ];
  });

/** Toggles and renames: both are a PATCH of one todo. */
export const updateTodo = client
  .createRequest<{ response: Todo; payload: TodoChanges }>()({ endpoint: "/api/todos/:todoId", method: "PATCH" })
  .setOptimistic(({ params, payload }) => [
    optimistic(getTodos)
      .patch(params.todoId, payload)
      .rollback(({ data, previous }) => restore(data, previous, Number(params.todoId))),
  ]);

export const deleteTodo = client
  .createRequest<{ response: { id: number } }>()({ endpoint: "/api/todos/:todoId", method: "DELETE" })
  .setOptimistic(({ params }) => [
    optimistic(getTodos)
      .remove(params.todoId)
      .rollback(({ data, previous }) => restore(data, previous, Number(params.todoId))),
  ]);

export const toggleAllTodos = client
  .createRequest<{ response: Todo[]; payload: { completed: boolean } }>()({ endpoint: "/api/todos", method: "PATCH" })
  .setOptimistic(({ payload }) => [
    // No `.rollback()`: when a bulk change fails, core refetches the list and the server's state replaces it.
    optimistic(getTodos).set((data) => data.map((todo) => ({ ...todo, completed: payload.completed }))),
  ]);

export const clearCompletedTodos = client
  .createRequest<{ response: Todo[] }>()({ endpoint: "/api/todos/clear-completed", method: "POST" })
  .setOptimistic(() => [optimistic(getTodos).set((data) => data.filter((todo) => !todo.completed))]);
