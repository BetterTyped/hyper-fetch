import { useFetch } from "@hyper-fetch/react";
import { useEffect, useRef, useState } from "react";

import { client, getProducts, readSavedEntries } from "./api";

const SIZES = [30, 100, 0];
const pageLoadedAt = Date.now();
const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`;

type Step = { source: string; ms: number };

const Products = ({ limit }: { limit: number }) => {
  // The API waits two seconds, so the copy from IndexedDB clearly shows up first.
  const { data, error, loading, responseTimestamp } = useFetch(getProducts.setQueryParams({ limit, delay: 2000 }));
  const mountedAt = useRef({ time: Date.now(), perf: performance.now() });
  const [steps, setSteps] = useState<Step[]>([]);
  const lastSeen = useRef<number>(undefined);

  useEffect(() => {
    // StrictMode runs effects twice, so every response is recorded once by its timestamp.
    if (!responseTimestamp || lastSeen.current === responseTimestamp.getTime()) return;
    lastSeen.current = responseTimestamp.getTime();
    // Saved before this page load: IndexedDB. Earlier in this page load: memory. Otherwise: the network.
    const savedAt = responseTimestamp.getTime();
    const source = savedAt < pageLoadedAt ? "IndexedDB" : savedAt < mountedAt.current.time ? "Memory" : "Network";
    setSteps((prev) => [...prev, { source, ms: Math.round(performance.now() - mountedAt.current.perf) }]);
  }, [responseTimestamp]);

  if (error && !data) return <p className="error">Could not load products: {error.message}</p>;

  return (
    <article>
      <ol className="steps">
        {steps.map((step, index) => (
          <li key={index}>
            {step.source === "Network" ? step.source : <mark>{step.source}</mark>} after {step.ms} ms
          </li>
        ))}
        {loading && <li aria-busy="true">Revalidating from the network...</li>}
      </ol>
      <figure className="table-wrap">
        <table className="striped">
          <tbody>
            {data?.products.map((product) => (
              <tr key={product.id}>
                <td>{product.title}</td>
                <td className="muted">{product.category}</td>
                <td>${product.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figure>
    </article>
  );
};

const SavedEntries = () => {
  const [saved, setSaved] = useState<{ key: string; bytes: number }[]>([]);
  const [quota, setQuota] = useState<number>();

  useEffect(() => {
    const refresh = () => void readSavedEntries().then(setSaved);
    refresh();
    navigator.storage?.estimate().then((estimate) => setQuota(estimate.quota));
    return client.cache.events.onData(refresh);
  }, []);

  const total = saved.reduce((sum, entry) => sum + entry.bytes, 0);

  return (
    <article>
      <h6>Saved in IndexedDB: {kb(total)}</h6>
      <ul className="list">
        {saved.map((entry) => (
          <li key={entry.key}>
            <code>{entry.key}</code>
            <small>{kb(entry.bytes)}</small>
          </li>
        ))}
      </ul>
      <small className="muted">
        Quota for this site: {quota ? `${(quota / 1024 ** 3).toFixed(1)} GB` : "unknown"}. localStorage allows about 5
        MB.
      </small>
    </article>
  );
};

export const App = () => {
  const [limit, setLimit] = useState(30);

  const clearAndReload = async () => {
    await client.cache.clear();
    window.location.reload();
  };

  return (
    <main className="container">
      <hgroup>
        <h1>IndexedDB persistence</h1>
        <p>Load a catalog, then reload. The saved copy shows up in milliseconds while the slow API is asked again.</p>
      </hgroup>
      <div className="toolbar">
        <div role="group">
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              className={size === limit ? undefined : "outline secondary"}
              onClick={() => setLimit(size)}
            >
              {size === 0 ? "All 194" : size} products
            </button>
          ))}
        </div>
        <div role="group">
          <button type="button" className="secondary" onClick={() => window.location.reload()}>
            Reload page
          </button>
          <button type="button" className="outline" onClick={clearAndReload}>
            Clear IndexedDB
          </button>
        </div>
      </div>
      <div className="grid-2">
        <Products key={limit} limit={limit} />
        <SavedEntries />
      </div>
    </main>
  );
};
