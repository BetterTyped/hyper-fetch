import { useInfiniteFetch } from "@hyper-fetch/react";
import { useEffect, useState } from "react";

import { client, getProductsRequest, pageSize, productsPagination } from "./api";
import { useInView } from "./use-in-view";

const maxPages = 3;
// Every row has the same height, so the space of the dropped pages can be kept with one spacer.
const rowHeight = 56;

/** Counts the requests, to show that a dropped page is fetched again when you scroll back to it. */
const useRequestCount = () => {
  const [count, setCount] = useState(0);
  useEffect(() => client.requestManager.events.onRequestStart(() => setCount((value) => value + 1)), []);
  return count;
};

const RetryButton = ({ label, onRetry }: { label: string; onRetry: () => void }) => (
  <p className="error">
    Could not load {label} products.{" "}
    <button type="button" className="outline" onClick={onRetry}>
      Try again
    </button>
  </p>
);

export const App = () => {
  const requests = useRequestCount();
  const list = useInfiniteFetch(getProductsRequest, { pagination: productsPagination, maxPages });
  const { items, pageParams, total, loading, error, hasNextPage, hasPreviousPage } = list;
  const { isFetchingNextPage, isFetchingPreviousPage, fetchNextPage, fetchPreviousPage } = list;
  const { isFetchNextPageError, isFetchPreviousPageError } = list;

  // With the offset pagination, the paging value of a page is its `skip`: the index of its first item.
  const firstIndex = typeof pageParams[0] === "number" ? pageParams[0] : 0;
  const loadedPages = pageParams.map((param) => Math.floor(Number(param) / pageSize) + 1);

  // The spacer stands in for the dropped pages above. When it comes into view, the page before is fetched again.
  const spacer = useInView<HTMLDivElement>(() => fetchPreviousPage(), {
    enabled: hasPreviousPage && !isFetchingPreviousPage && !isFetchPreviousPageError,
    watch: firstIndex,
  });
  const sentinel = useInView<HTMLDivElement>(() => fetchNextPage(), {
    enabled: hasNextPage && !isFetchingNextPage && !isFetchNextPageError,
    watch: items.length + firstIndex,
  });

  if (loading) return <main className="container" aria-busy="true" />;
  if (error && items.length === 0) {
    return <main className="container error">Could not load products: {error.message}</main>;
  }

  return (
    <main className="container">
      <hgroup>
        <h1>Products</h1>
        <p>Scroll down and back up. Only {maxPages} pages are kept, the rest is fetched again when you return.</p>
      </hgroup>

      <header className="status">
        <span>
          Pages in memory: <mark>{loadedPages.join(", ")}</mark>
        </span>
        <span>
          Items {firstIndex + 1}-{firstIndex + items.length} of {total ?? "?"}
        </span>
        <span>Requests: {requests}</span>
      </header>

      <div ref={spacer} style={{ height: firstIndex * rowHeight }} className="spacer">
        {isFetchingPreviousPage && <p aria-busy="true">Loading earlier products...</p>}
        {isFetchPreviousPageError && <RetryButton label="earlier" onRetry={fetchPreviousPage} />}
      </div>

      <ul className="rows">
        {items.map((product, index) => (
          <li key={product.id} style={{ height: rowHeight }}>
            <small className="muted">{firstIndex + index + 1}</small>
            <strong>{product.title}</strong>
            <small className="muted">{product.brand ?? "No brand"}</small>
            <span>${product.price}</span>
          </li>
        ))}
      </ul>

      <div ref={sentinel} className="sentinel">
        {isFetchingNextPage && <p aria-busy="true">Loading more...</p>}
        {isFetchNextPageError && <RetryButton label="more" onRetry={fetchNextPage} />}
        {!hasNextPage && <p className="muted">You reached the end.</p>}
      </div>
    </main>
  );
};
