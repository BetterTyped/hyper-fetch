import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

export type Todo = { id: number; title: string; completed: boolean };

// In memory, so the list resets when the dev server restarts.
let nextId = 4;
let todos: Todo[] = [
  { id: 1, title: "Read the TodoMVC example", completed: true },
  { id: 2, title: "Toggle a todo and watch it save", completed: false },
  { id: 3, title: "Open the Completed filter", completed: false },
];

const readTitle = (value: unknown) => {
  const title = typeof value === "string" ? value.trim() : "";
  if (!title) throw new HTTPException(400, { message: "A todo needs a title" });
  return title;
};

const findTodo = (id: string) => {
  const todo = todos.find((item) => item.id === Number(id));
  if (!todo) throw new HTTPException(404, { message: "This todo no longer exists" });
  return todo;
};

const app = new Hono()
  .basePath("/api")
  // A short delay, so you can see the client update before the server answers.
  .use(async (_, next) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await next();
  })
  .get("/todos", (c) => c.json(todos))
  .post("/todos", async (c) => {
    const body = await c.req.json<{ title?: unknown }>();
    const todo: Todo = { id: nextId++, title: readTitle(body.title), completed: false };
    todos = [...todos, todo];
    return c.json(todo, 201);
  })
  // Marks every todo as completed or active.
  .patch("/todos", async (c) => {
    const { completed } = await c.req.json<{ completed: boolean }>();
    todos = todos.map((todo) => ({ ...todo, completed }));
    return c.json(todos);
  })
  .post("/todos/clear-completed", (c) => {
    todos = todos.filter((todo) => !todo.completed);
    return c.json(todos);
  })
  .patch("/todos/:todoId", async (c) => {
    const todo = findTodo(c.req.param("todoId"));
    const body = await c.req.json<Partial<Pick<Todo, "title" | "completed">>>();
    const updated: Todo = {
      ...todo,
      ...(body.title !== undefined && { title: readTitle(body.title) }),
      ...(body.completed !== undefined && { completed: body.completed }),
    };
    todos = todos.map((item) => (item.id === todo.id ? updated : item));
    return c.json(updated);
  })
  .delete("/todos/:todoId", (c) => {
    const todo = findTodo(c.req.param("todoId"));
    todos = todos.filter((item) => item.id !== todo.id);
    return c.json({ id: todo.id });
  })
  // Errors are sent as `{ message }`, the error type of the HyperFetch client.
  .onError((error, c) => c.json({ message: error.message }, error instanceof HTTPException ? error.status : 500));

// `@hono/vite-dev-server` serves the default export inside the Vite dev server.
export default app;
