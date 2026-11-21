import { useAppManager, useQueue } from "@hyper-fetch/react";
import { type FormEvent, useState } from "react";

import { addTodo, client, type Todo } from "./api";

type Saved = Todo & { savedAt: string };

const Queue = () => {
  const { isOnline } = useAppManager(client);
  // Reads the dispatcher queue of `addTodo` and updates on every change.
  const { requests } = useQueue(addTodo);

  return (
    <article>
      <h6>Queue ({requests.length})</h6>
      {requests.length === 0 && <p className="muted">Empty. Every todo has reached the server.</p>}
      <ol className="list">
        {requests.map((item) => (
          <li key={item.requestId}>
            <span>{item.request.payload?.todo}</span>
            {isOnline ? <progress value={item.uploading.progress} max={100} /> : <mark>waiting for network</mark>}
          </li>
        ))}
      </ol>
    </article>
  );
};

export const App = () => {
  // The app manager owns the online state. The browser updates it, and so does the switch below.
  const { isOnline, setOnline } = useAppManager(client);
  const [saved, setSaved] = useState<Saved[]>([]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const todo = String(new FormData(form).get("todo"));
    form.reset();

    // Resolves when the server answers, which can be long after the click when the app is offline.
    const { data, error } = await addTodo.send({ payload: { todo, completed: false, userId: 1 } });
    if (error || !data) return;
    setSaved((prev) => [{ ...data, savedAt: new Date().toLocaleTimeString() }, ...prev]);
  };

  return (
    <main className="container">
      <hgroup>
        <h1>Offline queue</h1>
        <p>Go offline, add a few todos, then go back online and watch the queue send them in order.</p>
      </hgroup>
      <label>
        <input type="checkbox" role="switch" checked={isOnline} onChange={(event) => setOnline(event.target.checked)} />
        {isOnline ? "Online" : "Offline"}
      </label>
      <form onSubmit={handleSubmit} role="group">
        <input name="todo" placeholder="What needs doing?" required />
        <button type="submit">Add</button>
      </form>
      <div className="grid-2">
        <Queue />
        <article>
          <h6>Saved on the server ({saved.length})</h6>
          {saved.length === 0 && <p className="muted">Nothing saved yet.</p>}
          <ol className="list">
            {saved.map((todo, index) => (
              <li key={saved.length - index}>
                <span>{todo.todo}</span>
                <small className="muted">{todo.savedAt}</small>
              </li>
            ))}
          </ol>
        </article>
      </div>
    </main>
  );
};
