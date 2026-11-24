import { eq } from "@hyper-fetch/db";
import { useLiveQuery } from "@hyper-fetch/react";
import { useState } from "react";
import type { FormEvent } from "react";

import { db, type Todo } from "./db";
import { setServerFailing } from "./server";

type Filter = "all" | "active" | "done";

/** Each filter is its own query. Queries are compared by structure, so switching filters needs no dependency array. */
const queryFor = (filter: Filter) => {
  const todos = db.todo.orderBy((todo) => todo.createdAt, "asc");
  if (filter === "all") return todos;
  return todos.where((todo) => eq(todo.completed, filter === "done"));
};

export const App = () => {
  const [filter, setFilter] = useState<Filter>("all");
  const [fail, setFail] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const addLog = (line: string) =>
    setLog((lines) => [`${new Date().toLocaleTimeString()} ${line}`, ...lines].slice(0, 6));

  const { data, status } = useLiveQuery(queryFor(filter));
  // A second query over the same rows. Every write updates both at once.
  const { data: active } = useLiveQuery(db.todo.where((todo) => eq(todo.completed, false)));

  // Writes resolve with the result and never throw. On failure the db has already reverted the change.
  const report = async (label: string, write: Promise<{ success: boolean }>) => {
    const { success } = await write;
    addLog(success ? `${label}: saved` : `${label}: failed, reverted`);
  };

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const title = String(new FormData(form).get("title") ?? "").trim();
    if (!title) return;
    form.reset();
    report(
      `Add "${title}"`,
      db.todo.insert({ id: crypto.randomUUID(), title, completed: false, createdAt: Date.now() }),
    );
  };

  const toggle = (todo: Todo) =>
    report(`Toggle "${todo.title}"`, db.todo.update(todo.id, { completed: !todo.completed }));

  const remove = (todo: Todo) => report(`Delete "${todo.title}"`, db.todo.delete(todo.id));

  const handleFailChange = (checked: boolean) => {
    setFail(checked);
    setServerFailing(checked);
  };

  return (
    <main className="container narrow">
      <hgroup>
        <h1>Todos</h1>
        <p>Every change shows at once. The server answers 0.8s later, and a failure puts the old rows back.</p>
      </hgroup>

      <label>
        <input
          type="checkbox"
          role="switch"
          checked={fail}
          onChange={(event) => handleFailChange(event.target.checked)}
        />
        Make writes fail
      </label>

      <form className="add" onSubmit={handleAdd}>
        <input name="title" placeholder="What needs doing?" aria-label="New todo" />
        <button type="submit">Add</button>
      </form>

      <div className="toolbar">
        <div role="group">
          {(["all", "active", "done"] as const).map((value) => (
            <button key={value} className={filter === value ? "" : "outline"} onClick={() => setFilter(value)}>
              {value}
            </button>
          ))}
        </div>
        <small className="muted">{active?.length ?? 0} left</small>
      </div>

      {status === "loading" && <p aria-busy="true">Loading todos...</p>}
      {status === "error" && <p>Could not load the todos.</p>}

      <ul className="todos">
        {data?.map((todo) => (
          <li key={todo.id}>
            <label>
              <input type="checkbox" checked={todo.completed} onChange={() => toggle(todo)} />
              <span className={todo.completed ? "done" : ""}>{todo.title}</span>
            </label>
            <button className="secondary outline" aria-label={`Delete ${todo.title}`} onClick={() => remove(todo)}>
              ✕
            </button>
          </li>
        ))}
      </ul>
      {status === "ready" && data?.length === 0 && <p className="muted">Nothing here.</p>}

      <article>
        <header>Server log</header>
        {log.length === 0 && <small className="muted">Add, toggle or delete a todo.</small>}
        <ul className="log">
          {log.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </article>
    </main>
  );
};
