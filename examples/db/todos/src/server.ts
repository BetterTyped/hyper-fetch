import { createTodo, deleteTodo, getTodos, type Todo, updateTodo } from "./db";

/**
 * A fake backend made with HyperFetch mocking, so the example runs without a server. `setMock` replaces the adapter of
 * a request: the db sends the same requests it would send to a real API.
 */
let todos: Todo[] = [
  { id: "1", title: "Read the db quick start", completed: true, createdAt: 1 },
  { id: "2", title: "Define a collection", completed: false, createdAt: 2 },
  { id: "3", title: "Render a live query", completed: false, createdAt: 3 },
];

// Slow enough to see a write on screen before the server answers.
const latency = { responseTime: 800 };

let failing = false;

/** While on, every write answers 500 and the db reverts the change. */
export const setServerFailing = (value: boolean) => {
  failing = value;
};

const serverError = () => ({ error: new Error("The server rejected the change"), status: 500 });

getTodos.setMock(() => ({ data: todos, status: 200 }), latency);

createTodo.setMock(({ request }) => {
  if (failing || !request.payload) return serverError();
  todos = [...todos, request.payload];
  return { data: request.payload, status: 201 };
}, latency);

updateTodo.setMock(({ request }) => {
  const todo = todos.find((item) => item.id === request.params?.todoId);
  if (failing || !todo) return serverError();
  const updated = { ...todo, ...request.payload };
  todos = todos.map((item) => (item.id === updated.id ? updated : item));
  return { data: updated, status: 200 };
}, latency);

deleteTodo.setMock(({ request }) => {
  if (failing) return serverError();
  const id = String(request.params?.todoId);
  todos = todos.filter((item) => item.id !== id);
  return { data: { id }, status: 200 };
}, latency);
