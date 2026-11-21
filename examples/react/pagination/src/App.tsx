import { useFetch } from "@hyper-fetch/react";
import { useEffect, useState } from "react";

import { client, getProductsPage, PAGE_SIZE } from "./api";

type KeepPreviousData = "auto" | "preserve" | "clean";

const modes: { value: KeepPreviousData; label: string }[] = [
  { value: "auto", label: "auto (default): keep the old page when only query params change" },
  { value: "preserve", label: "preserve: always keep the old page until the new one arrives" },
  { value: "clean", label: "clean: clear the table while the new page loads" },
];

const Pager = ({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) => {
  const first = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => first + index);

  return (
    <nav className="pager" aria-label="Pages">
      <button type="button" className="outline" onClick={() => onChange(page - 1)} disabled={page === 1}>
        Previous
      </button>
      {pages.map((value) => (
        <button
          key={value}
          type="button"
          className={value === page ? undefined : "outline secondary"}
          aria-current={value === page ? "page" : undefined}
          onClick={() => onChange(value)}
        >
          {value}
        </button>
      ))}
      <button type="button" className="outline" onClick={() => onChange(page + 1)} disabled={page === totalPages}>
        Next
      </button>
      <button type="button" className="outline secondary" onClick={() => onChange(totalPages)}>
        Last ({totalPages})
      </button>
    </nav>
  );
};

export const App = () => {
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<KeepPreviousData>("auto");
  const [log, setLog] = useState<string[]>([]);

  // `revalidate: false` reads a fresh cached page without asking the server again.
  const { data, error, loading } = useFetch(getProductsPage(page), { keepPreviousData: mode, revalidate: false });
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  useEffect(() => {
    if (page >= totalPages) return;
    // Prefetch: put the next page in the cache now. `cache-first` skips the call if it is cached already.
    getProductsPage(page + 1).send({ cachePolicy: "cache-first" });
  }, [page, totalPages]);

  // Log every request that reaches the network, from the hook and from the prefetch.
  useEffect(
    () =>
      client.requestManager.events.onRequestStart(({ request }) => {
        const requested = request.queryParams.skip / PAGE_SIZE + 1;
        setLog((entries) => [`GET page ${requested}`, ...entries].slice(0, 10));
      }),
    [],
  );

  return (
    <main className="container">
      <hgroup>
        <h1>Products</h1>
        <p>Pages are cached by their query params. The next page is prefetched, so "Next" shows it at once.</p>
      </hgroup>

      <label>
        keepPreviousData
        <select
          value={mode}
          onChange={(event) => setMode(modes.find((option) => option.value === event.target.value)?.value ?? "auto")}
        >
          {modes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid-2">
        <section>
          {error && <p>Could not load products: {error.message}</p>}
          {!data && loading && <article aria-busy="true">Loading page {page}...</article>}
          {data && (
            // While the next page loads, the previous one stays on screen, dimmed.
            <table className={loading ? "stale" : undefined} aria-busy={loading}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {data.products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.title}</td>
                    <td>{product.category}</td>
                    <td>${product.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pager page={page} totalPages={totalPages} onChange={setPage} />
        </section>

        <article>
          <header>
            <strong>Network requests</strong>
          </header>
          <ul className="log">
            {log.map((entry, index) => (
              <li key={log.length - index}>{entry}</li>
            ))}
          </ul>
        </article>
      </div>
    </main>
  );
};
