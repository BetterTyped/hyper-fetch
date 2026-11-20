import type { RequestInstance } from "@hyper-fetch/core";
import { useFetch, useSubmit } from "@hyper-fetch/react";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { client, createPostRequest, getPostsRequest, getUserPostsRequest, getUsersRequest } from "./api";

/** What to invalidate after a post is created. `invalidate()` takes a request, a cache key, a RegExp or a list of them. */
const targets: Record<string, { label: string; keys: RequestInstance | RegExp | RequestInstance[] }> = {
  latest: { label: "The latest posts request", keys: getPostsRequest },
  posts: { label: "Every key matching /\\/posts/", keys: /\/posts/ },
  none: { label: "Nothing", keys: [] },
};

type PanelProps = {
  title: string;
  loading: boolean;
  error: Error | null;
  responseTimestamp: Date | null;
  onSuccess: (callback: () => void) => void;
  children: ReactNode;
};

/** Counts successful fetches, so every refetch caused by an invalidation is visible. */
const Panel = ({ title, loading, error, responseTimestamp, onSuccess, children }: PanelProps) => {
  const [fetches, setFetches] = useState(0);
  onSuccess(() => setFetches((count) => count + 1));

  return (
    <article aria-busy={loading}>
      <header>
        <strong>{title}</strong>
        <br />
        <small className="muted">
          Fetched {fetches} {fetches === 1 ? "time" : "times"}
          {responseTimestamp && `, last at ${responseTimestamp.toLocaleTimeString()}`}
        </small>
      </header>
      {error && <p>Could not load: {error.message}</p>}
      <ul>{children}</ul>
    </article>
  );
};

const LatestPosts = () => {
  const { data, ...state } = useFetch(getPostsRequest);
  return (
    <Panel title="Latest posts" {...state}>
      {data?.posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </Panel>
  );
};

const UserPosts = () => {
  const { data, ...state } = useFetch(getUserPostsRequest);
  return (
    <Panel title="Posts of user 1" {...state}>
      {data?.posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </Panel>
  );
};

const Users = () => {
  const { data, ...state } = useFetch(getUsersRequest);
  return (
    <Panel title="Users" {...state}>
      {data?.users.map((user) => (
        <li key={user.id}>
          {user.firstName} {user.lastName}
        </li>
      ))}
    </Panel>
  );
};

export const App = () => {
  const [target, setTarget] = useState("posts");
  const { submit, submitting, error, onSubmitSuccess } = useSubmit(createPostRequest);

  // Mark the chosen keys stale. Every mounted useFetch that reads them refetches right away.
  onSubmitSuccess(() => {
    client.cache.invalidate(targets[target].keys);
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit({
      payload: {
        title: String(new FormData(event.currentTarget).get("title")),
        userId: 1,
      },
    });
  };

  return (
    <main className="container">
      <hgroup>
        <h1>Invalidation</h1>
        <p>Create a post, then watch which lists fetch again.</p>
      </hgroup>

      <form onSubmit={handleSubmit}>
        <fieldset className="grid" disabled={submitting}>
          <input name="title" required placeholder="Post title" aria-label="Post title" />
          <select value={target} onChange={(event) => setTarget(event.target.value)} aria-label="What to invalidate">
            {Object.entries(targets).map(([key, { label }]) => (
              <option key={key} value={key}>
                Invalidate: {label}
              </option>
            ))}
          </select>
          <button type="submit" aria-busy={submitting}>
            Create post
          </button>
        </fieldset>
        {error && <small>Could not create the post: {error.message}</small>}
      </form>

      <div className="grid-3">
        <LatestPosts />
        <UserPosts />
        <Users />
      </div>
    </main>
  );
};
