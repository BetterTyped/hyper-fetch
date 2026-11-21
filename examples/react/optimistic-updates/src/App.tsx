import { useFetch, useIsSubmitting, useSubmit } from "@hyper-fetch/react";
import { useState } from "react";
import type { FormEvent } from "react";

import { addTodoRequest, client, getTodosRequest, setFailRequests, toggleTodoRequest } from "./api";

export const App = () => {
  const [fail, setFail] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const addLog = (line: string) =>
    setLog((lines) => [`${new Date().toLocaleTimeString()} ${line}`, ...lines].slice(0, 6));

  const { data, error, loading } = useFetch(getTodosRequest);
  // Nothing optimistic-specific here: the requests carry their own optimistic changes.
  const toggle = useSubmit(toggleTodoRequest);
  const add = useSubmit(addTodoRequest);
  const saving = useIsSubmitting(client);

  toggle.onSubmitSuccess(({ response }) => addLog(`Saved todo #${response.data.id}`));
  add.onSubmitSuccess(({ response }) => addLog(`Saved "${response.data.todo}"`));
  // By the time these run, core has already reverted the change in the cache.
  toggle.onSubmitError(({ response }) => addLog(`Toggle failed (${response.status}), rolled back`));
  add.onSubmitError(({ response }) => addLog(`Add failed (${response.status}), rolled back`));

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const todo = String(new FormData(form).get("todo") ?? "").trim();
    if (!todo) return;

    add.submit({ payload: { todo, completed: false, userId: 1 } });
    addLog(`Added "${todo}" to the list`);
    form.reset();
  };

  const handleFailChange = (checked: boolean) => {
    setFail(checked);
    setFailRequests(checked);
  };

  return (
    <main className="container narrow">
      <hgroup>
        <h1>Todos</h1>
        <p>Changes show up at once. The server answers a second later, and a failure puts the old value back.</p>
      </hgroup>

      <label>
        <input
          type="checkbox"
          role="switch"
          checked={fail}
          onChange={(event) => handleFailChange(event.target.checked)}
        />
        Make requests fail
      </label>

      <form className="add" onSubmit={handleAdd}>
        <input name="todo" placeholder="New todo" aria-label="New todo" />
        <button type="submit">Add</button>
      </form>

      {loading && !data && <p aria-busy="true">Loading todos...</p>}
      {error && <p>Could not load todos: {error.message}</p>}

      <ul className="todos">
        {data?.todos.map((todo) => (
          <li key={todo.id}>
            <label>
              <input
                type="checkbox"
                checked={todo.completed}
                // Negative ids are temporary rows; dummyjson does not store them, so they cannot be patched.
                disabled={todo.id < 0}
                onChange={() =>
                  toggle.submit({
                    params: { todoId: todo.id },
                    payload: { completed: !todo.completed },
                  })
                }
              />
              {todo.completed ? <s>{todo.todo}</s> : todo.todo}
            </label>
          </li>
        ))}
      </ul>

      <article>
        <header className="toolbar">
          <strong>Log</strong>
          <small aria-busy={saving > 0}>{saving > 0 ? `Waiting for ${saving} response(s)` : "Idle"}</small>
        </header>
        {log.length === 0 ? (
          <p className="muted">Toggle or add a todo.</p>
        ) : (
          <ol className="log">
            {log.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ol>
        )}
      </article>
    </main>
  );
};
