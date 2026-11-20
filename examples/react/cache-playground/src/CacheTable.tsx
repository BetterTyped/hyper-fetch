import { useEffect, useState } from "react";

import { client } from "./api";

const seconds = (ms: number) => `${Math.max(Math.ceil(ms / 1000), 0)}s`;

/** Reads every entry of `client.cache` twice a second and shows how long it stays fresh and when it is removed. */
export const CacheTable = () => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  const entries = client.cache
    .keys()
    .map((key) => client.cache.get(key))
    .filter((entry) => entry !== undefined);

  return (
    <article>
      <header>
        <strong>Cache</strong>
      </header>
      {entries.length === 0 ? (
        <p className="muted">The cache is empty.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>State</th>
              <th>Removed in</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              // Every entry keeps the times of the request that saved it.
              const age = now - entry.responseTimestamp;
              const freshFor = entry.staleTime - age;

              return (
                <tr key={entry.cacheKey}>
                  <td>
                    <code>{entry.cacheKey}</code>
                  </td>
                  <td>{freshFor > 0 ? <mark>fresh {seconds(freshFor)}</mark> : "stale"}</td>
                  <td>{seconds(entry.cacheTime - age)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </article>
  );
};
