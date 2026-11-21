import { useInfiniteFetch } from "@hyper-fetch/react";

import { getProducts, productsPagination } from "./api";
import { useInView } from "./use-in-view";

export const App = () => {
  const { items, pages, total, loading, error, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } =
    useInfiniteFetch(getProducts.setQueryParams({ limit: 12, select: "title,brand,price,thumbnail" }), {
      pagination: productsPagination,
    });

  // The observer only decides *when*. `fetchNextPage` shares one request between calls made while it loads.
  const sentinel = useInView<HTMLDivElement>(() => fetchNextPage(), {
    enabled: hasNextPage && !isFetchingNextPage && !isFetchNextPageError,
    watch: pages.length,
  });

  if (loading) return <main className="container" aria-busy="true" />;
  if (error && items.length === 0) {
    return (
      <main className="container">
        <p>Could not load products: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="container">
      <hgroup>
        <h1>Products</h1>
        <p>Scroll down. The next page loads before you reach the end of the list.</p>
      </hgroup>

      <ul className="products">
        {items.map((product) => (
          <li key={product.id}>
            <img src={product.thumbnail} alt="" width={64} height={64} loading="lazy" />
            <div>
              <strong>{product.title}</strong>
              <small className="muted">{product.brand ?? "No brand"}</small>
            </div>
            <span>${product.price}</span>
          </li>
        ))}
      </ul>

      <div ref={sentinel} className="sentinel">
        {isFetchingNextPage && <p aria-busy="true">Loading more...</p>}
        {isFetchNextPageError && (
          <p>
            Could not load the next page.{" "}
            <button type="button" className="outline" onClick={() => fetchNextPage()}>
              Try again
            </button>
          </p>
        )}
        {!hasNextPage && <p className="muted">You reached the end.</p>}
      </div>

      <footer className="status">
        <small>
          {items.length} of {total ?? "?"} products · {pages.length} {pages.length === 1 ? "page" : "pages"} loaded
        </small>
      </footer>
    </main>
  );
};
