import { useFetch } from "@hyper-fetch/react";
import { useEffect, useState } from "react";

import { client, searchProducts } from "./api";

export const App = () => {
  const [query, setQuery] = useState("");
  const [debounce, setDebounce] = useState(true);
  const [keystrokes, setKeystrokes] = useState(0);
  const [sent, setSent] = useState<string[]>([]);

  // With `bounce`, a changed query waits until typing pauses for `bounceTime` ms. Only that last value is sent.
  const { data, error, loading, bounce } = useFetch(
    searchProducts.setQueryParams({ q: query, limit: 8, select: "title,price,thumbnail" }),
    { bounce: debounce, bounceType: "debounce", bounceTime: 400 },
  );

  let status = "idle";
  if (bounce.active) status = "waiting for typing to stop";
  else if (loading) status = "loading";

  // Count what really reaches the network.
  useEffect(
    () =>
      client.requestManager.events.onRequestStart(({ request }) => {
        setSent((entries) => [`q="${request.queryParams.q}"`, ...entries]);
      }),
    [],
  );

  return (
    <main className="container">
      <hgroup>
        <h1>Product search</h1>
        <p>Type fast. With debounce on, one request is sent when you stop typing instead of one per key.</p>
      </hgroup>

      <input
        type="search"
        placeholder="Search products, for example phone"
        aria-label="Search products"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setKeystrokes((count) => count + 1);
        }}
      />
      <label>
        <input
          type="checkbox"
          role="switch"
          checked={debounce}
          onChange={(event) => setDebounce(event.target.checked)}
        />
        Debounce (bounceTime 400 ms)
      </label>

      <div className="stats">
        <article>
          <strong>{keystrokes}</strong>
          <small className="muted">changes typed</small>
        </article>
        <article>
          <strong>{sent.length}</strong>
          <small className="muted">requests sent</small>
        </article>
        <article>
          <strong>{status}</strong>
          <small className="muted">status</small>
        </article>
      </div>

      <div className="grid-2">
        <section>
          {error && <p>Could not search: {error.message}</p>}
          {!data && loading && <p aria-busy="true">Searching...</p>}
          {data && (
            <>
              <p className="muted">{data.total} results</p>
              {/* The previous results stay on screen, dimmed, until the new ones arrive. */}
              <ul className={`results ${loading || bounce.active ? "stale" : ""}`}>
                {data.products.map((product) => (
                  <li key={product.id}>
                    <img src={product.thumbnail} alt="" width={48} height={48} loading="lazy" />
                    <span>{product.title}</span>
                    <small className="muted">${product.price}</small>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        <article>
          <header>
            <strong>Sent queries</strong>
          </header>
          <ul className="log">
            {sent.slice(0, 12).map((entry, index) => (
              <li key={sent.length - index}>{entry}</li>
            ))}
          </ul>
        </article>
      </div>
    </main>
  );
};
