import { useFetch } from "@hyper-fetch/react";
import { useState, useSyncExternalStore } from "react";

import { client, getTodos, type Todo, toggleTodo } from "./api";
import { syncLog, tabId } from "./tab-sync";

const Todos = () => {
  const { data, error, loading } = useFetch(getTodos);
  const [savingId, setSavingId] = useState<number | null>(null);

  const toggle = async (todo: Todo) => {
    setSavingId(todo.id);
    const { data: saved, error: saveError } = await toggleTodo.send({
      params: { todoId: todo.id },
      payload: { completed: !todo.completed },
    });
    setSavingId(null);
    if (saveError || !saved) return;
    // A plain cache write. The listener in tab-sync.ts sends it to the other tabs.
    client.cache.update(getTodos, (cached) =>
      cached?.data
        ? {
            data: {
              todos: cached.data.todos.map((item) =>
                item.id === saved.id ? { ...item, completed: saved.completed } : item,
              ),
            },
          }
        : {},
    );
  };

  if (loading && !data) return <p aria-busy="true">Loading todos...</p>;
  if (error) return <p className="error">Could not load todos: {error.message}</p>;

  return (
    <ul className="list">
      {data?.todos.map((todo) => (
        <li key={todo.id}>
          <label aria-busy={savingId === todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              disabled={savingId === todo.id}
              onChange={() => toggle(todo)}
            />
            {todo.todo}
          </label>
        </li>
      ))}
    </ul>
  );
};

const SyncLog = () => {
  const log = useSyncExternalStore(syncLog.subscribe, syncLog.get);

  return (
    <article>
      <h6>BroadcastChannel</h6>
      {log.length === 0 && <p className="muted">No messages yet. Open a second tab and check a todo there.</p>}
      <ol className="list">
        {log.map((entry) => (
          <li key={entry.id}>
            {entry.direction === "received" ? <mark>received</mark> : <span>sent</span>}
            <code>{entry.cacheKey}</code>
            <small className="muted">{entry.time}</small>
          </li>
        ))}
      </ol>
    </article>
  );
};

export const App = () => (
  <main className="container">
    <hgroup>
      <h1>
        Tab sync <small className="muted">tab {tabId}</small>
      </h1>
      <p>
        Open this page in a{" "}
        <a href={window.location.href} target="_blank" rel="noreferrer">
          second tab
        </a>{" "}
        and put both side by side. Check a todo in one, and the other updates without a request.
      </p>
    </hgroup>
    <div className="grid-2">
      <article>
        <h6>Todos</h6>
        <Todos />
      </article>
      <SyncLog />
    </div>
  </main>
);
