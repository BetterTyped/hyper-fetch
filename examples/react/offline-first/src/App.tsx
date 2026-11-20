import { useAppManager, useFetch, useQueue } from "@hyper-fetch/react";
import type { FormEvent } from "react";

import { addTodo, client, getTodos, setNetwork } from "./api";
import { CachePanel, QueuePanel } from "./Panels";

const Todos = () => {
  // Cache first: fresh persisted data is used as is, with no request on mount.
  const { data, error, loading } = useFetch(getTodos, { revalidate: false });
  // Todos that wait in the queue are shown right away, marked as pending. They come back after a reload too.
  const { requests } = useQueue(addTodo);

  if (!data && loading)
    return <p aria-busy="true">Loading todos (waits for the network on a first offline visit)...</p>;
  if (!data && error) return <p className="error">Could not load todos: {error.message}</p>;

  return (
    <ul className="list">
      {data?.todos.map((todo, index) => (
        <li key={`${todo.id}-${index}`}>
          <label>
            <input type="checkbox" checked={todo.completed} readOnly /> {todo.todo}
          </label>
        </li>
      ))}
      {requests.map(({ requestId, request }) => (
        <li key={requestId} className="pending">
          <label>
            <input type="checkbox" checked={false} readOnly /> {request.payload?.todo}
          </label>
          <mark>pending</mark>
        </li>
      ))}
    </ul>
  );
};

export const App = () => {
  const { isOnline } = useAppManager(client);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const todo = String(new FormData(form).get("todo"));
    form.reset();
    // No await: the answer can arrive in a later session. The listener in api.ts handles it.
    addTodo.send({ payload: { todo, completed: false, userId: 1 } });
  };

  const clearAll = async () => {
    await client.cache.clear();
    client.submitDispatcher.clear();
    window.location.reload();
  };

  return (
    <main className="container">
      <hgroup>
        <h1>Offline first</h1>
        <p>
          Load the list, go offline, add todos and reload. The list and your changes are still here, and sync once
          online.
        </p>
      </hgroup>
      <div className="toolbar">
        <label>
          <input
            type="checkbox"
            role="switch"
            checked={isOnline}
            onChange={(event) => setNetwork(event.target.checked)}
          />
          {isOnline ? "Online" : "Offline"}
        </label>
        <div role="group">
          <button type="button" className="secondary" onClick={() => window.location.reload()}>
            Reload page
          </button>
          <button type="button" className="outline" onClick={clearAll}>
            Clear saved data
          </button>
        </div>
      </div>
      <div className="grid-2">
        <article>
          <h6>Todos</h6>
          <form onSubmit={handleSubmit} role="group">
            <input name="todo" placeholder="What needs doing?" required />
            <button type="submit">Add</button>
          </form>
          <Todos />
        </article>
        <div>
          <CachePanel />
          <QueuePanel />
        </div>
      </div>
    </main>
  );
};
