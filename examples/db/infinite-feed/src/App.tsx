import { useLiveInfiniteQuery } from "@hyper-fetch/react";
import { useEffect, useRef, useState } from "react";

import { db, type Post } from "./db";
import { onServerLog, setServerFailing, simulateNewPost } from "./server";

/** The app's page size. The server sends 15 posts per request, so one request fills one and a half pages. */
const PAGE_SIZE = 10;

const timeAgo = (timestamp: number) => {
  const minutes = Math.round((Date.now() - timestamp) / 60_000);
  return minutes < 1 ? "just now" : `${minutes} min ago`;
};

export const App = () => {
  const [fail, setFail] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const addLog = (line: string) =>
    setLog((lines) => [`${new Date().toLocaleTimeString()} ${line}`, ...lines].slice(0, 8));

  useEffect(() => onServerLog(addLog), []);

  // An infinite query needs `orderBy`, so a page never shifts between renders.
  const { data, pages, status, hasNextPage, isFetchingNextPage, fetchNextPage } = useLiveInfiniteQuery(
    db.post.orderBy((post) => post.createdAt, "desc"),
    { pageSize: PAGE_SIZE },
  );

  // Loads the next page when the end of the list scrolls into view
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = sentinel.current;
    if (!element || !hasNextPage) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) fetchNextPage();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  // Writes resolve with the result and never throw. On failure the db has already reverted the change.
  const like = async (post: Post) => {
    const { success } = await db.post.update(post.id, { likes: post.likes + 1 });
    addLog(success ? "Like: saved" : "Like: failed, reverted");
  };

  const handleFailChange = (checked: boolean) => {
    setFail(checked);
    setServerFailing(checked);
  };

  return (
    <main className="container narrow">
      <hgroup>
        <h1>Infinite feed</h1>
        <p>Pages load as you scroll. New posts land at the top, and the loaded pages stay.</p>
      </hgroup>

      <div className="toolbar">
        <label>
          <input
            type="checkbox"
            role="switch"
            checked={fail}
            onChange={(event) => handleFailChange(event.target.checked)}
          />
          Make writes fail
        </label>
        <small className="muted" aria-live="polite">
          {data?.length ?? 0} posts in {pages.length} pages
        </small>
      </div>

      <article>
        <header>Simulate another user</header>
        <p className="muted">
          The server saves a post and publishes a socket event. Open this page in a second tab to see both update.
        </p>
        <button className="secondary" onClick={simulateNewPost}>
          Publish a post as another user
        </button>
      </article>

      <article>
        <header>Server log</header>
        {log.length === 0 && <small className="muted">Scroll, like a post or simulate another user.</small>}
        <ul className="log">
          {log.map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ul>
      </article>

      {status === "loading" && <p aria-busy="true">Loading posts...</p>}
      {status === "error" && <p>Could not load the posts.</p>}

      {pages.map((page, index) => (
        <section key={index} className="page">
          <small className="muted">Page {index + 1}</small>
          <ul className="posts">
            {page.map((post) => (
              <li key={post.id}>
                <div>
                  <span>{post.body}</span>
                  <br />
                  <small className="muted">
                    {post.author}, {timeAgo(post.createdAt)}
                  </small>
                </div>
                <button className="outline" aria-label={`Like ${post.body}`} onClick={() => like(post)}>
                  ♥ {post.likes}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div ref={sentinel} />
      {hasNextPage && (
        <button className="outline" aria-busy={isFetchingNextPage} onClick={() => fetchNextPage()}>
          {isFetchingNextPage ? "Loading..." : "Load more"}
        </button>
      )}
      {status === "ready" && !hasNextPage && <p className="muted">You reached the first post.</p>}
    </main>
  );
};
