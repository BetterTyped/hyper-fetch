import { useInfiniteFetch } from "@hyper-fetch/react";

import { getPosts, postsPagination } from "./api";

const PAGE_SIZE = 5;

export const App = () => {
  const {
    items,
    pages,
    pageParams,
    total,
    loading,
    error,
    isFetching,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
    refetch,
    reset,
  } = useInfiniteFetch(
    // `skip: 20` starts the list in the middle, as if the user opened a shared link to the fifth page.
    getPosts.setQueryParams({ limit: PAGE_SIZE, skip: 20, select: "title,views" }),
    { pagination: postsPagination },
  );

  if (loading) return <main className="container" aria-busy="true" />;
  if (error && items.length === 0) {
    return (
      <main className="container">
        <p>Could not load posts: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="container">
      <hgroup>
        <h1>Posts</h1>
        <p>
          {items.length} of {total} posts in {pages.length} {pages.length === 1 ? "page" : "pages"}. Each box below is
          one response from the server.
        </p>
      </hgroup>

      <div className="toolbar">
        <button type="button" className="outline secondary" onClick={() => refetch()} disabled={isFetching}>
          Reload all pages
        </button>
        <button type="button" className="outline secondary" onClick={() => reset()} disabled={isFetching}>
          Start over
        </button>
      </div>

      {hasPreviousPage && (
        <button
          type="button"
          className="outline wide"
          onClick={() => fetchPreviousPage()}
          aria-busy={isFetchingPreviousPage}
          disabled={isFetchingPreviousPage}
        >
          Load earlier posts
        </button>
      )}

      {/* `pages` keeps the page boundaries. `items` is the same posts as one flat list. */}
      {pages.map((page, index) => (
        <article key={String(pageParams[index])} className="page">
          <header>
            <small className="muted">
              Page {Number(pageParams[index]) / PAGE_SIZE + 1} · skip={String(pageParams[index])} · {page.posts.length}{" "}
              posts
            </small>
          </header>
          <ol start={Number(pageParams[index]) + 1}>
            {page.posts.map((post) => (
              <li key={post.id}>
                {post.title} <small className="muted">{post.views} views</small>
              </li>
            ))}
          </ol>
        </article>
      ))}

      {hasNextPage ? (
        <button
          type="button"
          className="wide"
          onClick={() => fetchNextPage()}
          aria-busy={isFetchingNextPage}
          disabled={isFetchingNextPage}
        >
          Load more
        </button>
      ) : (
        <p className="muted">That is every post.</p>
      )}
      {error && <p>Could not load the page: {error.message}</p>}
    </main>
  );
};
