import { useFetch, useSubmit } from "@hyper-fetch/react";
import { type FormEvent, useState } from "react";

import { sdk } from "./api";

export const App = () => {
  const [text, setText] = useState("");
  // `data` is typed as `Note[]` by the GET /api/notes handler in server/app.ts.
  const { data, error, loading, refetch } = useFetch(sdk.api.notes.$get);
  const { submit, submitting, error: submitError, onSubmitSuccess } = useSubmit(sdk.api.notes.$post);

  onSubmitSuccess(() => {
    setText("");
    refetch();
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // The payload type comes from the route's `json` validator.
    submit({ payload: { text } });
  };

  const remove = async (noteId: number) => {
    // `:noteId` in the Hono path types `setParams()`.
    const response = await sdk.api.notes.$noteId.$delete.setParams({ noteId }).send();
    if (response.success) refetch();
  };

  return (
    <main className="container">
      <hgroup>
        <h1>Notes</h1>
        <p>A Hono API and a React client in one Vite app. The client types come from the server routes.</p>
      </hgroup>
      <form onSubmit={handleSubmit}>
        <fieldset role="group">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="New note"
            aria-invalid={submitError ? true : undefined}
          />
          <button type="submit" aria-busy={submitting} disabled={submitting}>
            Add
          </button>
        </fieldset>
        {/* The server answers an empty note with 400 and `{ message }`, the error type of the client. */}
        {submitError && <small className="error">{submitError.message}</small>}
      </form>
      {loading && !data && <p aria-busy="true">Loading notes...</p>}
      {error && <p className="error">Could not load notes: {error.message}</p>}
      <ul className="list">
        {data?.map((note) => (
          <li key={note.id}>
            <span>
              {note.text}
              <br />
              <small className="muted">{new Date(note.createdAt).toLocaleString()}</small>
            </span>
            <button type="button" className="outline secondary" onClick={() => remove(note.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
};
