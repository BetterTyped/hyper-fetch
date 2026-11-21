import { TodoList } from "./TodoList";

export const App = () => (
  <main className="container narrow">
    <hgroup>
      <h1>Todos</h1>
      <p>
        The app is plain. The point is <code>src/TodoList.test.tsx</code>: run <code>npm test</code> to check it with
        mocked requests.
      </p>
    </hgroup>
    <TodoList />
  </main>
);
