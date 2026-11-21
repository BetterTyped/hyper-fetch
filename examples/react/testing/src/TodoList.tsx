import { useFetch, useSubmit } from "@hyper-fetch/react";
import { useState } from "react";

import { client, getTodosRequest, updateTodoRequest } from "./api";
import type { Todo } from "./api";

export const TodoList = () => {
  const [message, setMessage] = useState("");
  const { data, error, loading } = useFetch(getTodosRequest);
  const { submit, submitting } = useSubmit(updateTodoRequest);

  const toggle = async (todo: Todo) => {
    const { data: saved } = await submit({ params: { todoId: todo.id }, payload: { completed: !todo.completed } });
    if (!saved) return setMessage(`Could not save "${todo.todo}"`);

    // dummyjson does not store changes, so the saved todo is written into the cached list.
    client.cache.update(getTodosRequest, (cached) =>
      cached?.data
        ? { data: { ...cached.data, todos: cached.data.todos.map((item) => (item.id === todo.id ? saved : item)) } }
        : {},
    );
    return setMessage(`Saved "${todo.todo}"`);
  };

  if (loading && !data) return <p aria-busy="true">Loading todos...</p>;
  if (error) return <p className="error">Could not load todos: {error.message}</p>;
  if (!data?.todos.length) return <p className="muted">Nothing to do.</p>;

  return (
    <article>
      <ul className="todos">
        {data.todos.map((todo) => (
          <li key={todo.id}>
            <label>
              <input type="checkbox" checked={todo.completed} disabled={submitting} onChange={() => toggle(todo)} />
              {todo.todo}
            </label>
          </li>
        ))}
      </ul>
      <footer>
        <small role="status">{message}</small>
      </footer>
    </article>
  );
};
