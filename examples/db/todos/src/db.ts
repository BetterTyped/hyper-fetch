import { createClient } from "@hyper-fetch/core";
import { collection, createDb } from "@hyper-fetch/db";
import { z } from "zod";

/** The base URL is never reached: `server.ts` answers every request with `setMock`. */
export const client = createClient({ url: "https://api.example.com" });

/** The schema is the row type. Rows a loader, sync or write returns must match it, or the collection does not compile. */
const TodoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.number(),
});
export type Todo = z.infer<typeof TodoSchema>;

export const getTodos = client.createRequest<{ response: Todo[] }>()({ endpoint: "/todos" });

export const createTodo = client.createRequest<{ response: Todo; payload: Todo }>()({
  endpoint: "/todos",
  method: "POST",
});

export const updateTodo = client.createRequest<{ response: Todo; payload: Partial<Todo> }>()({
  endpoint: "/todos/:todoId",
  method: "PATCH",
});

export const deleteTodo = client.createRequest<{ response: { id: string } }>()({
  endpoint: "/todos/:todoId",
  method: "DELETE",
});

/**
 * One collection: where the rows come from (`load`) and how a change is saved (`mutate`). The loader sends no filters,
 * so the db loads the list once and every query below filters and sorts it locally.
 */
const Todo = collection(TodoSchema, { key: "id" })
  .load(getTodos)
  .mutate({
    insert: { request: createTodo, map: (row) => ({ payload: row }) },
    update: { request: updateTodo, map: (key, changes) => ({ params: { todoId: key }, payload: changes }) },
    delete: { request: deleteTodo, map: (key) => ({ params: { todoId: key } }) },
  });

export const db = createDb({ todo: Todo });
