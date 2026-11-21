import { useFetch } from "@hyper-fetch/react";
import { useState } from "react";

import { getTodosRequest, setFailDeletes } from "./api";
import { undoTime, useUndoDelete } from "./use-undo-delete";
import type { PendingDelete } from "./use-undo-delete";

const Toast = ({ item, onUndo }: { item: PendingDelete; onUndo: () => void }) => (
  <article className="toast">
    {item.status === "waiting" && (
      <>
        <div className="toolbar">
          <span>Deleted "{item.todo.todo}"</span>
          <button type="button" className="outline" onClick={onUndo}>
            Undo
          </button>
        </div>
        {/* The bar empties in `undoTime`. When it is empty, the request is sent. */}
        <div className="countdown" style={{ animationDuration: `${undoTime}ms` }} />
      </>
    )}
    {item.status === "deleting" && <span aria-busy="true">Deleting "{item.todo.todo}"...</span>}
    {item.status === "failed" && (
      <span className="error">Could not delete "{item.todo.todo}". It is back in the list.</span>
    )}
  </article>
);

export const App = () => {
  const [fail, setFail] = useState(false);
  const { data, error, loading } = useFetch(getTodosRequest);
  const { pending, deleteTodo, undo } = useUndoDelete();

  return (
    <main className="container narrow">
      <hgroup>
        <h1>Todos</h1>
        <p>Delete a todo. You have five seconds to undo before the request is sent.</p>
      </hgroup>

      <label>
        <input
          type="checkbox"
          role="switch"
          checked={fail}
          onChange={(event) => {
            setFail(event.target.checked);
            setFailDeletes(event.target.checked);
          }}
        />
        Make deletes fail
      </label>

      {loading && !data && <p aria-busy="true">Loading todos...</p>}
      {error && <p className="error">Could not load todos: {error.message}</p>}
      {data?.todos.length === 0 && <p className="muted">Nothing left. Reload the page to get the todos back.</p>}

      <ul className="todos">
        {data?.todos.map((todo) => (
          <li key={todo.id}>
            <span>{todo.todo}</span>
            <button type="button" className="outline secondary" onClick={() => deleteTodo(todo)}>
              Delete
            </button>
          </li>
        ))}
      </ul>

      <div className="toasts" aria-live="polite">
        {pending.map((item) => (
          <Toast key={item.todo.id} item={item} onUndo={() => undo(item.todo.id)} />
        ))}
      </div>
    </main>
  );
};
