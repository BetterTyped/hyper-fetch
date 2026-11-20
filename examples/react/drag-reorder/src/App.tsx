import { useFetch, useSubmit } from "@hyper-fetch/react";
import { useState } from "react";
import type { DragEvent } from "react";

import { getTodosRequest, moveTodoRequest, setFailMoves } from "./api";

export const App = () => {
  const [fail, setFail] = useState(false);
  const [dragged, setDragged] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const addLog = (line: string) =>
    setLog((lines) => [`${new Date().toLocaleTimeString()} ${line}`, ...lines].slice(0, 5));

  const { data, error, loading } = useFetch(getTodosRequest);
  const { submit, submitting, onSubmitSuccess, onSubmitError } = useSubmit(moveTodoRequest);

  onSubmitSuccess(({ response }) => addLog(`Saved the new position of #${response.data.id}`));
  // By the time this runs, core has already moved the todo back.
  onSubmitError(({ response }) => addLog(`Save failed (${response.status}), moved back`));

  const move = (todoId: number, position: number) => {
    const current = data?.todos.findIndex((todo) => todo.id === todoId);
    if (current === undefined || current === position || position < 0) return;
    // The list changes inside `submit`, before the request is sent.
    submit({ params: { todoId }, payload: { position } });
  };

  // Moving down puts the todo after the target, moving up puts it before. The line shows that side.
  const draggedIndex = data?.todos.findIndex((todo) => todo.id === dragged) ?? -1;
  const getDropClass = (todoId: number, index: number) => {
    if (todoId === dragged) return "dragging";
    if (index !== over || draggedIndex < 0) return undefined;
    return index > draggedIndex ? "drop-after" : "drop-before";
  };

  const handleDrop = (event: DragEvent, index: number) => {
    event.preventDefault();
    if (dragged !== null) move(dragged, index);
    setDragged(null);
    setOver(null);
  };

  return (
    <main className="container narrow">
      <hgroup>
        <h1>Reorder todos</h1>
        <p>Drag a todo to a new place, or use the arrows. The list changes at once and the server answers later.</p>
      </hgroup>

      <label>
        <input
          type="checkbox"
          role="switch"
          checked={fail}
          onChange={(event) => {
            setFail(event.target.checked);
            setFailMoves(event.target.checked);
          }}
        />
        Make saves fail
      </label>

      {loading && !data && <p aria-busy="true">Loading todos...</p>}
      {error && <p className="error">Could not load todos: {error.message}</p>}

      <ol className="todos">
        {data?.todos.map((todo, index) => (
          <li
            key={todo.id}
            draggable
            className={getDropClass(todo.id, index)}
            onDragStart={() => setDragged(todo.id)}
            onDragEnd={() => {
              setDragged(null);
              setOver(null);
            }}
            // Allowing the drop is opt-in: without preventDefault the browser refuses it.
            onDragOver={(event) => {
              event.preventDefault();
              setOver(index);
            }}
            onDrop={(event) => handleDrop(event, index)}
          >
            <span className="handle" aria-hidden="true">
              ⠿
            </span>
            <span className="text">{todo.todo}</span>
            <button
              type="button"
              className="outline secondary"
              aria-label="Move up"
              onClick={() => move(todo.id, index - 1)}
            >
              ↑
            </button>
            <button
              type="button"
              className="outline secondary"
              aria-label="Move down"
              onClick={() => move(todo.id, index + 1)}
              disabled={index === data.todos.length - 1}
            >
              ↓
            </button>
          </li>
        ))}
      </ol>

      <article>
        <header className="toolbar">
          <strong>Log</strong>
          <small aria-busy={submitting}>{submitting ? "Saving..." : "Idle"}</small>
        </header>
        {log.length === 0 ? (
          <p className="muted">Move a todo.</p>
        ) : (
          <ol className="log">
            {log.map((line, index) => (
              <li key={`${index}-${line}`}>{line}</li>
            ))}
          </ol>
        )}
      </article>
    </main>
  );
};
