import { useFetch } from "@hyper-fetch/react";
import { useState } from "react";

import { getTodosRequest } from "./api";
import { useBulkAction } from "./use-bulk-action";
import type { RowStatus } from "./use-bulk-action";

const statusLabel: Record<RowStatus["state"], string> = {
  waiting: "Waiting",
  running: "Saving...",
  done: "Done",
  failed: "Failed",
};

export const App = () => {
  const { data, error, loading } = useFetch(getTodosRequest);
  const { statuses, run } = useBulkAction();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [oneByOne, setOneByOne] = useState(true);
  const [failSome, setFailSome] = useState(true);
  const [running, setRunning] = useState(false);

  const todos = data?.todos ?? [];
  // Every third row fails while the switch is on, so you can see partial failures.
  const failingIds = new Set(failSome ? todos.filter((_, index) => index % 3 === 2).map((todo) => todo.id) : []);

  const results = Object.values(statuses);
  const finished = results.filter((status) => status.state === "done" || status.state === "failed").length;
  const failed = results.filter((status) => status.state === "failed").length;

  const toggle = (id: number) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleAction = async (action: "complete" | "delete") => {
    const chosen = todos.filter((todo) => selected.has(todo.id));
    setRunning(true);
    await run(action, chosen, { oneByOne, failingIds });
    setRunning(false);
    // Keep the failed rows selected, so a retry is one click away.
    setSelected(new Set(chosen.filter((todo) => failingIds.has(todo.id)).map((todo) => todo.id)));
  };

  return (
    <main className="container">
      <hgroup>
        <h1>Bulk actions</h1>
        <p>Select todos and complete or delete them. Each row gets its own request and its own result.</p>
      </hgroup>

      <div className="options">
        <fieldset>
          <label>
            <input type="radio" name="mode" checked={oneByOne} onChange={() => setOneByOne(true)} />
            One at a time (shared queue)
          </label>
          <label>
            <input type="radio" name="mode" checked={!oneByOne} onChange={() => setOneByOne(false)} />
            All at once
          </label>
        </fieldset>
        <label>
          <input
            type="checkbox"
            role="switch"
            checked={failSome}
            onChange={(event) => setFailSome(event.target.checked)}
          />
          Make every third row fail
        </label>
      </div>

      <div className="toolbar">
        <div role="group">
          <button type="button" disabled={running || selected.size === 0} onClick={() => handleAction("complete")}>
            Complete {selected.size}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={running || selected.size === 0}
            onClick={() => handleAction("delete")}
          >
            Delete {selected.size}
          </button>
        </div>
        {results.length > 0 && (
          <div className="progress">
            <progress value={finished} max={results.length} />
            <small>
              {finished} of {results.length} finished{failed > 0 && `, ${failed} failed`}
            </small>
          </div>
        )}
      </div>

      {loading && !data && <p aria-busy="true">Loading todos...</p>}
      {error && <p className="error">Could not load todos: {error.message}</p>}

      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                aria-label="Select all"
                checked={todos.length > 0 && selected.size === todos.length}
                onChange={(event) => setSelected(new Set(event.target.checked ? todos.map((todo) => todo.id) : []))}
              />
            </th>
            <th>Todo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {todos.map((todo) => {
            const status = statuses[todo.id];
            return (
              <tr key={todo.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${todo.todo}`}
                    checked={selected.has(todo.id)}
                    onChange={() => toggle(todo.id)}
                  />
                </td>
                <td>
                  {todo.completed ? <s>{todo.todo}</s> : todo.todo}
                  {failingIds.has(todo.id) && <small className="muted"> (will fail)</small>}
                </td>
                <td className={status?.state} aria-busy={status?.state === "running"}>
                  {status ? statusLabel[status.state] : ""}
                  {status?.message && <small> {status.message}</small>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
};
