import { useFetch, useSubmit } from "@hyper-fetch/react";
import { type FormEvent, useState } from "react";

import { client, createBookmark, deleteBookmark, getBookmarks } from "./api";

const tags = ["docs", "tools"] as const;
type Tag = (typeof tags)[number];

export const App = () => {
  const [filter, setFilter] = useState<Tag | undefined>(undefined);
  const [form, setForm] = useState({ title: "", url: "", tag: "docs" as Tag });
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // `setQueryParams` is typed by the route's `query` schema.
  const { data, error, loading } = useFetch(getBookmarks.setQueryParams({ tag: filter }));
  const { submit, submitting, error: createError, onSubmitSuccess } = useSubmit(createBookmark);

  // Every tag filter is its own cache entry, so refresh all of them after a change.
  const refreshLists = () => client.cache.invalidate(/\/api\/bookmarks/);

  onSubmitSuccess(() => {
    setForm((current) => ({ ...current, title: "", url: "" }));
    refreshLists();
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // The payload type comes from the route's `body` schema.
    submit({ payload: form });
  };

  const remove = async (bookmarkId: number) => {
    const response = await deleteBookmark.setParams({ bookmarkId }).send();
    // The error is typed as the route's `status(404, { message })` body, or the client's global `Error`.
    setDeleteError(response.error?.message ?? null);
    refreshLists();
  };

  return (
    <main className="container">
      <hgroup>
        <h1>Bookmarks</h1>
        <p>An Elysia API on Node.js and a React client typed from its routes.</p>
      </hgroup>
      <form onSubmit={handleSubmit}>
        <fieldset className="grid">
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Title"
          />
          <input
            value={form.url}
            onChange={(event) => setForm({ ...form, url: event.target.value })}
            placeholder="https://..."
          />
          <select
            value={form.tag}
            onChange={(event) =>
              setForm({
                ...form,
                tag: tags.find((tag) => tag === event.target.value) ?? "docs",
              })
            }
          >
            {tags.map((tag) => (
              <option key={tag}>{tag}</option>
            ))}
          </select>
          <button type="submit" aria-busy={submitting} disabled={submitting}>
            Add
          </button>
        </fieldset>
        {/* A schema failure answers 422 with `{ property, summary }`, typed as the local error. */}
        {createError && "summary" in createError && (
          <small className="error">
            {createError.summary} ({createError.property})
          </small>
        )}
      </form>
      <div role="group">
        <button type="button" className={filter ? "outline" : undefined} onClick={() => setFilter(undefined)}>
          all
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={filter === tag ? undefined : "outline"}
            onClick={() => setFilter(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      {loading && !data && <p aria-busy="true">Loading bookmarks...</p>}
      {error && <p className="error">Could not load bookmarks: {error.message}</p>}
      {deleteError && <p className="error">{deleteError}</p>}
      <ul className="list">
        {data?.map((bookmark) => (
          <li key={bookmark.id}>
            <span>
              <a href={bookmark.url} target="_blank" rel="noreferrer">
                {bookmark.title}
              </a>{" "}
              <mark>{bookmark.tag}</mark>
            </span>
            <button type="button" className="outline secondary" onClick={() => remove(bookmark.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
};
