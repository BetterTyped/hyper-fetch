import { SaveStatus } from "./components/SaveStatus";
import { TodoApp } from "./features/todos/TodoApp";

export const App = () => (
  <main className="container narrow">
    <hgroup>
      <h1>todos</h1>
      <p>TodoMVC with a Hono API in the same Vite app. Every change shows at once and saves in the background.</p>
    </hgroup>
    <TodoApp />
    <p className="status">
      <SaveStatus />
    </p>
    <small className="muted">Double-click a todo to edit it. The list lives in the server's memory.</small>
  </main>
);
