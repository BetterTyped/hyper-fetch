import { useFetch, useSubmit } from "@hyper-fetch/react";
import { useState } from "react";
import type { FormEvent } from "react";

import { createTodoRequest, deleteTodoRequest, getTodosRequest, updateCachedTodos, updateTodoRequest } from "./api";
import type { Todo } from "./api";

const TodoItem = ({ todo }: { todo: Todo }) => {
  const [editing, setEditing] = useState(false);
  // One hook per row, so every row has its own `submitting` and `error`.
  const update = useSubmit(updateTodoRequest.setParams({ todoId: todo.id }));
  const remove = useSubmit(deleteTodoRequest.setParams({ todoId: todo.id }));

  // Replace the item with the version the server sent back.
  update.onSubmitSuccess(({ response }) => {
    updateCachedTodos((todos) => todos.map((item) => (item.id === response.data.id ? response.data : item)));
    setEditing(false);
  });
  remove.onSubmitSuccess(() => updateCachedTodos((todos) => todos.filter((item) => item.id !== todo.id)));

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    update.submit({
      payload: { todo: String(new FormData(event.currentTarget).get("todo")) },
    });
  };

  const busy = update.submitting || remove.submitting;
  const error = update.error ?? remove.error;

  return (
    <li>
      {editing ? (
        <form className="row" onSubmit={handleSave}>
          <input name="todo" defaultValue={todo.todo} aria-label="Todo" required autoFocus />
          <button type="submit" aria-busy={update.submitting} disabled={busy}>
            Save
          </button>
          <button type="button" className="secondary" onClick={() => setEditing(false)} disabled={busy}>
            Cancel
          </button>
        </form>
      ) : (
        <div className="row">
          <input
            type="checkbox"
            checked={todo.completed}
            disabled={busy}
            onChange={() => update.submit({ payload: { completed: !todo.completed } })}
            aria-label="Completed"
          />
          <span className="grow">{todo.completed ? <s>{todo.todo}</s> : todo.todo}</span>
          <button type="button" className="outline" onClick={() => setEditing(true)} disabled={busy}>
            Edit
          </button>
          <button
            type="button"
            className="outline secondary"
            onClick={() => remove.submit()}
            aria-busy={remove.submitting}
            disabled={busy}
          >
            Delete
          </button>
        </div>
      )}
      {error && <small className="error">{error.message}</small>}
    </li>
  );
};

const NewTodo = () => {
  const { submit, submitting, error, onSubmitSuccess } = useSubmit(createTodoRequest);

  // dummyjson answers every create with id 255. Replacing an item with the same id keeps the list keys unique.
  onSubmitSuccess(({ response }) => {
    updateCachedTodos((todos) => [response.data, ...todos.filter((item) => item.id !== response.data.id)]);
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    submit({
      payload: {
        todo: String(new FormData(form).get("todo")),
        completed: false,
        userId: 1,
      },
    });
    form.reset();
  };

  return (
    <form className="row" onSubmit={handleSubmit}>
      <input name="todo" placeholder="New todo" aria-label="New todo" required disabled={submitting} />
      <button type="submit" aria-busy={submitting} disabled={submitting}>
        Add
      </button>
      {error && <small className="error">{error.message}</small>}
    </form>
  );
};

export const App = () => {
  const { data, error, loading } = useFetch(getTodosRequest);

  return (
    <main className="container narrow">
      <hgroup>
        <h1>Todos</h1>
        <p>
          Create, edit, complete and delete. Each change is written into the cached list when the server confirms it.
        </p>
      </hgroup>
      <NewTodo />
      {loading && !data && <p aria-busy="true">Loading todos...</p>}
      {error && <p>Could not load todos: {error.message}</p>}
      <ul className="todos">
        {data?.todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </ul>
      {data && data.todos.length === 0 && <p className="muted">No todos left.</p>}
    </main>
  );
};
