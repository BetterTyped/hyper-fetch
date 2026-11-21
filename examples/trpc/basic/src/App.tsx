import { useFetch, useSubmit } from "@hyper-fetch/react";
import { type FormEvent, useState } from "react";

import { client, sdk, todoListsKey } from "./api";

const filters = ["all", "open", "done"] as const;

export const App = () => {
  const [status, setStatus] = useState<(typeof filters)[number]>("all");
  const [title, setTitle] = useState("");

  // The input is the payload. Each filter is cached on its own, so switching back is instant.
  const { data, error, loading } = useFetch(sdk.todos.list.$query.setPayload({ status }));
  const add = useSubmit(sdk.todos.add.$mutation);
  const toggle = useSubmit(sdk.todos.toggle.$mutation);

  // A change affects every filter, so invalidate all cached inputs of `todos.list` at once.
  const refreshLists = () => client.cache.invalidate(todoListsKey);
  add.onSubmitSuccess(() => {
    setTitle("");
    refreshLists();
  });
  toggle.onSubmitSuccess(refreshLists);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    add.submit({ payload: { title } });
  };

  // Procedure errors carry `data` with the router's `errorFormatter` fields. Network failures are plain `Error`s.
  const titleError = add.error && "data" in add.error ? add.error.data.fieldErrors?.title : undefined;

  return (
    <main className="container">
      <hgroup>
        <h1>tRPC todos</h1>
        <p>A tRPC router served by Hono, called through HyperFetch with types inferred from the router.</p>
      </hgroup>
      <form onSubmit={handleSubmit}>
        <fieldset role="group">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="New todo"
            aria-invalid={titleError ? true : undefined}
          />
          <button type="submit" aria-busy={add.submitting} disabled={add.submitting}>
            Add
          </button>
        </fieldset>
        {add.error && <small className="error">{titleError ?? add.error.message}</small>}
      </form>
      <article>
        <header className="toolbar">
          <div role="group">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={filter === status ? undefined : "outline"}
                onClick={() => setStatus(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          {/* A visited filter renders from the cache with no request, until a mutation invalidates it. */}
          <small className="muted" aria-busy={loading}>
            {loading ? "Fetching" : "Cached"}
          </small>
        </header>
        {error && <p className="error">Could not load todos: {error.message}</p>}
        {!data && loading && <p aria-busy="true">Loading todos...</p>}
        <ul className="list">
          {data?.map((todo) => (
            <li key={todo.id}>
              <label>
                <input
                  type="checkbox"
                  checked={todo.done}
                  disabled={toggle.submitting}
                  onChange={() => toggle.submit({ payload: { id: todo.id } })}
                />
                {todo.title}
              </label>
            </li>
          ))}
          {data?.length === 0 && <li className="muted">Nothing here.</li>}
        </ul>
      </article>
    </main>
  );
};
