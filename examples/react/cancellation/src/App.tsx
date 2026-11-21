import { useFetch } from "@hyper-fetch/react";
import { useState } from "react";

import { searchProductsRequest } from "./api";
import { RequestLog } from "./RequestLog";

export const App = () => {
  const [query, setQuery] = useState("");

  // Every keystroke creates a request with new query params. The cancelable request aborts the previous one.
  const { data, error, loading, abort } = useFetch(
    searchProductsRequest.setQueryParams({
      q: query,
      select: "title",
      limit: 5,
      delay: 1500,
    }),
  );

  return (
    <main className="container">
      <hgroup>
        <h1>Cancellation</h1>
        <p>Type faster than 1.5 seconds per letter. Each new search cancels the one still running.</p>
      </hgroup>
      <div className="grid-2">
        <section>
          <div role="group">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, for example phone"
              aria-label="Search products"
            />
            {/* `abort()` cancels the request this hook is waiting for. */}
            <button type="button" className="secondary" onClick={abort} disabled={!loading}>
              Cancel
            </button>
          </div>
          {loading && <p aria-busy="true">Searching for "{query}"...</p>}
          {error && !loading && <p className="muted">Last request: {error.message}</p>}
          <ul>
            {data?.products.map((product) => (
              <li key={product.id}>{product.title}</li>
            ))}
          </ul>
          {data && !loading && <small className="muted">{data.total} results</small>}
        </section>
        <RequestLog />
      </div>
    </main>
  );
};
