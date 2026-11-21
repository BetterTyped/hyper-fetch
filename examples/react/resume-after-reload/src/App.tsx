import { useAppManager, useQueue } from "@hyper-fetch/react";
import { type FormEvent, useEffect, useState } from "react";

import { addTodo, client, setNetwork, type Todo } from "./api";

type Sent = Todo & { key: number; sentAt: string };

let sentCount = 0;

const Queue = () => {
  const { isOnline } = useAppManager(client);
  // Starts with the requests restored from localStorage, then follows every change of the queue.
  const { requests } = useQueue(addTodo);

  return (
    <article>
      <h6>Persisted queue ({requests.length})</h6>
      {requests.length === 0 && <p className="muted">Empty. Nothing is waiting to be sent.</p>}
      <ol className="list">
        {requests.map((item, index) => (
          <li key={item.requestId}>
            <span>{item.request.payload?.todo}</span>
            {!isOnline && <mark>waiting for network</mark>}
            {/* `queued: true` sends one request at a time, the others wait for their turn. */}
            {isOnline &&
              (index === 0 ? <small aria-busy="true">sending</small> : <small className="muted">next</small>)}
          </li>
        ))}
      </ol>
    </article>
  );
};

/** Listens to every response on the client, so it also catches requests restored after a reload. */
const useSentTodos = () => {
  const [sent, setSent] = useState<Sent[]>([]);

  useEffect(() => {
    return client.requestManager.events.onResponse<typeof addTodo>(({ request, response }) => {
      if (request.queryKey !== addTodo.queryKey || !response.data) return;
      const todo = { ...response.data, key: ++sentCount, sentAt: new Date().toLocaleTimeString() };
      setSent((prev) => [todo, ...prev]);
    });
  }, []);

  return sent;
};

export const App = () => {
  const { isOnline } = useAppManager(client);
  const sent = useSentTodos();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const todo = String(new FormData(form).get("todo"));
    form.reset();
    // No await: the response may arrive in another page load. The listener above shows it.
    addTodo.send({ payload: { todo, completed: false, userId: 1 } });
  };

  return (
    <main className="container">
      <hgroup>
        <h1>Resume after reload</h1>
        <p>
          Go offline, add a few todos and reload the page. They are still in the queue, and go out once you are online.
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
        <button type="button" className="secondary" onClick={() => window.location.reload()}>
          Reload page
        </button>
      </div>
      <form onSubmit={handleSubmit} role="group">
        <input name="todo" placeholder="What needs doing?" required />
        <button type="submit">Add</button>
      </form>
      <div className="grid-2">
        <Queue />
        <article>
          <h6>Sent in this page load ({sent.length})</h6>
          {sent.length === 0 && <p className="muted">No responses yet.</p>}
          <ol className="list">
            {sent.map((todo) => (
              <li key={todo.key}>
                <span>{todo.todo}</span>
                <small className="muted">{todo.sentAt}</small>
              </li>
            ))}
          </ol>
        </article>
      </div>
    </main>
  );
};
