import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

export type Todo = { id: number; title: string; done: boolean };

// In memory, so the data resets when the dev server restarts.
let nextId = 4;
let todos: Todo[] = [
  { id: 1, title: "Define the router in server/router.ts", done: true },
  { id: 2, title: "Import only its type on the client", done: false },
  { id: 3, title: "Call procedures with useFetch and useSubmit", done: false },
];

/** `{ title: "Use at least 3 characters" }`, one message per invalid field. */
const getFieldErrors = (error: z.ZodError): Record<string, string> =>
  Object.fromEntries(error.issues.map((issue) => [issue.path.join("."), issue.message]));

const t = initTRPC.create({
  // The client error type follows this shape, so `error.data.fieldErrors` is typed in the React app.
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    message: error.cause instanceof z.ZodError ? "Invalid input" : shape.message,
    data: {
      ...shape.data,
      fieldErrors: error.cause instanceof z.ZodError ? getFieldErrors(error.cause) : null,
    },
  }),
});

// A short delay makes the difference between a network call and a cache read visible.
const wait = () => new Promise((resolve) => setTimeout(resolve, 400));

export const appRouter = t.router({
  todos: t.router({
    list: t.procedure.input(z.object({ status: z.enum(["all", "open", "done"]) })).query(async ({ input }) => {
      await wait();
      if (input.status === "all") return todos;
      return todos.filter((todo) => todo.done === (input.status === "done"));
    }),
    add: t.procedure
      .input(
        z.object({
          title: z.string().trim().min(3, "Use at least 3 characters"),
        }),
      )
      .mutation(({ input }) => {
        const todo: Todo = { id: nextId++, title: input.title, done: false };
        todos = [...todos, todo];
        return todo;
      }),
    toggle: t.procedure.input(z.object({ id: z.number() })).mutation(({ input }) => {
      const todo = todos.find((item) => item.id === input.id);
      if (!todo)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Todo ${input.id} does not exist`,
        });
      todo.done = !todo.done;
      return todo;
    }),
  }),
});

/** The client imports only this type, never the server code. */
export type AppRouter = typeof appRouter;
