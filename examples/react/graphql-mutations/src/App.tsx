import { useFetch, useSubmit } from "@hyper-fetch/react";
import { type FormEvent, useState } from "react";

import { createTodo, deleteTodo, type Todo, todosQuery, updateCachedTodos, updateTodo } from "./api";

export const App = () => {
  const [title, setTitle] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const addLog = (line: string) => setLog((current) => [line, ...current].slice(0, 5));

  const { data, error, loading } = useFetch(todosQuery);
  const create = useSubmit(createTodo);

  create.onSubmitSuccess(({ response }) => {
    // GraphQLZero gives every new todo the id 201. A real API returns a unique one, use it as it is.
    const todo = { ...response.data.createTodo, id: `new-${Date.now()}` };
    updateCachedTodos((todos) => [todo, ...todos]);
    addLog(`createTodo -> added "${todo.title}" to the cache`);
    setTitle("");
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    create.submit({ payload: { input: { title, completed: false } } });
  };

  const toggle = async (todo: Todo) => {
    const response = await updateTodo.send({
      payload: { id: todo.id, input: { completed: !todo.completed } },
    });
    if (!response.data) return addLog(`updateTodo failed: ${response.error?.[0]?.message ?? "network error"}`);
    // Take the new value from the mutation result, the way you would with any GraphQL server.
    const { completed } = response.data.updateTodo;
    updateCachedTodos((todos) => todos.map((item) => (item.id === todo.id ? { ...item, completed } : item)));
    addLog(`updateTodo -> todo ${todo.id} is ${completed ? "done" : "open"} in the cache`);
  };

  const remove = async (todo: Todo) => {
    const response = await deleteTodo.send({ payload: { id: todo.id } });
    if (!response.data?.deleteTodo) return addLog("deleteTodo failed");
    updateCachedTodos((todos) => todos.filter((item) => item.id !== todo.id));
    addLog(`deleteTodo -> removed todo ${todo.id} from the cache`);
  };

  return (
    <main className="container">
      <hgroup>
        <h1>GraphQL mutations</h1>
        <p>Each mutation writes its result into the cached query, so the list updates without fetching it again.</p>
      </hgroup>
      <form onSubmit={handleSubmit}>
        <fieldset role="group">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="New todo" required />
          <button type="submit" aria-busy={create.submitting} disabled={create.submitting}>
            Add
          </button>
        </fieldset>
        {create.error && <small className="error">{create.error[0]?.message ?? "Could not add the todo"}</small>}
      </form>
      <div className="grid-2">
        <article>
          {loading && !data && <p aria-busy="true">Loading todos...</p>}
          {error && <p className="error">Could not load todos: {error[0]?.message ?? "network error"}</p>}
          <ul className="list">
            {data?.todos.data.map((todo) => (
              <li key={todo.id}>
                <label>
                  <input type="checkbox" checked={todo.completed} onChange={() => toggle(todo)} />
                  {todo.title}
                </label>
                <button type="button" className="outline secondary" onClick={() => remove(todo)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </article>
        <article>
          <header>Cache log</header>
          {log.length === 0 && <p className="muted">Add, toggle or delete a todo.</p>}
          <ul className="log">
            {log.map((line, index) => (
              <li key={`${index}-${line}`}>{line}</li>
            ))}
          </ul>
        </article>
      </div>
    </main>
  );
};
