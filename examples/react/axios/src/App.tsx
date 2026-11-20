import { useFetch } from "@hyper-fetch/react";
import { useState } from "react";

import { getProducts } from "./api";

export const App = () => {
  const [delay, setDelay] = useState(500);

  // A regular HyperFetch hook. Cache, retries and dedupe work the same; axios only sends the HTTP request.
  const { data, error, loading, extra, status, refetch } = useFetch(
    getProducts.setQueryParams({ limit: 6, select: "title,price,thumbnail", delay }),
  );

  return (
    <main className="container">
      <hgroup>
        <h1>Products</h1>
        <p>
          HyperFetch requests sent by axios. Raise the server delay above the 2s axios timeout to see an AxiosError.
        </p>
      </hgroup>
      <article>
        <label>
          Server delay: {delay} ms {delay > 2000 && <mark>above the axios timeout</mark>}
          <input
            type="range"
            min={0}
            max={4000}
            step={250}
            value={delay}
            onChange={(event) => setDelay(Number(event.target.value))}
          />
        </label>
        <div className="toolbar muted">
          <span>
            status {status ?? "-"} · content-type {String(extra?.headers["content-type"] ?? "-")}
          </span>
          <button type="button" className="outline secondary" onClick={refetch} disabled={loading}>
            Reload
          </button>
        </div>
      </article>
      {loading && <progress />}
      {error && (
        <article>
          <header>
            <strong className="error">{error.name}</strong>
          </header>
          {/* The error is the AxiosError itself, with its code, config and response. */}
          <p>
            <code>{error.code}</code> {error.message}
          </p>
          <small className="muted">
            {error.config?.method?.toUpperCase()} {error.config?.url}
          </small>
        </article>
      )}
      {!error && data && (
        <div className="products">
          {data.products.map((product) => (
            <article key={product.id}>
              <img src={product.thumbnail} alt="" width={64} height={64} />
              <div>
                <strong>{product.title}</strong>
                <p className="muted">${product.price}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
};
