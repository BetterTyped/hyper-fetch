import { useFetch } from "@hyper-fetch/react";
import { useEffect, useState } from "react";

import { client, getPostRequest } from "./api";

const postIds = [1, 2, 3, 4];

const PostView = ({
  postId,
  revalidate,
  onRequest,
}: {
  postId: number;
  revalidate: boolean;
  onRequest: (postId: number) => void;
}) => {
  // With `revalidate: false`, fresh cached data is shown and no request is sent.
  // With `revalidate: true` (the default), cached data is shown and a request refreshes it in the background.
  const { data, error, loading, onRequestStart } = useFetch(getPostRequest.setParams({ postId }), { revalidate });

  // Fires only when a request really goes to the network.
  onRequestStart(() => onRequest(postId));

  if (error) return <article>Could not load the post: {error.message}</article>;
  if (!data) return <article aria-busy="true">Loading post {postId}...</article>;

  return (
    <article>
      <header className="toolbar">
        <strong>{data.title}</strong>
        {loading && <small aria-busy="true">Refreshing</small>}
      </header>
      <p>{data.body}</p>
    </article>
  );
};

/** Reads the cache entry of every post and shows how much time is left until it gets stale and until it is removed. */
const CacheTable = ({ requests }: { requests: Record<number, number> }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Post</th>
          <th>Cache</th>
          <th>Removed in</th>
          <th>Requests</th>
        </tr>
      </thead>
      <tbody>
        {postIds.map((postId) => {
          const entry = client.cache.get(getPostRequest.setParams({ postId }).cacheKey);
          const age = entry ? now - entry.responseTimestamp : 0;
          const freshFor = entry ? Math.ceil((entry.staleTime - age) / 1000) : 0;
          const removedIn = entry ? Math.ceil((entry.cacheTime - age) / 1000) : 0;

          return (
            <tr key={postId}>
              <td>#{postId}</td>
              <td>
                {!entry ? (
                  <span className="muted">empty</span>
                ) : freshFor > 0 ? (
                  <mark>fresh, {freshFor}s left</mark>
                ) : (
                  "stale"
                )}
              </td>
              <td>{entry ? `${Math.max(removedIn, 0)}s` : "-"}</td>
              <td>{requests[postId] ?? 0}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export const App = () => {
  const [postId, setPostId] = useState(1);
  const [revalidate, setRevalidate] = useState(false);
  const [requests, setRequests] = useState<Record<number, number>>({});

  const countRequest = (id: number) => setRequests((counts) => ({ ...counts, [id]: (counts[id] ?? 0) + 1 }));

  return (
    <main className="container">
      <hgroup>
        <h1>Stale time</h1>
        <p>Switch between posts. A fresh post comes from the cache, a stale one is fetched again.</p>
      </hgroup>

      <div className="toolbar">
        <div role="group">
          {postIds.map((id) => (
            <button
              key={id}
              type="button"
              className={id === postId ? undefined : "outline"}
              onClick={() => setPostId(id)}
            >
              Post {id}
            </button>
          ))}
        </div>
        <label>
          <input
            type="checkbox"
            role="switch"
            checked={revalidate}
            onChange={(event) => setRevalidate(event.target.checked)}
          />
          revalidate
        </label>
      </div>

      <div className="grid-2">
        <PostView postId={postId} revalidate={revalidate} onRequest={countRequest} />
        <CacheTable requests={requests} />
      </div>
    </main>
  );
};
