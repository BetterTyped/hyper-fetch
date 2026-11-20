import { useEffect, useState } from "react";

import { client } from "./api";

type Entry = { id: number; kind: "network" | "cache" | "error"; text: string };

let nextId = 0;

/** Listens to the client: request events show the network, cache events show what happens to the stored data. */
export const EventLog = () => {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    const add = (kind: Entry["kind"], text: string) => {
      // Read the id now: the state updater runs later, when `nextId` may have moved on.
      nextId += 1;
      const entry = {
        id: nextId,
        kind,
        text: `${new Date().toLocaleTimeString()} ${text}`,
      };
      setEntries((list) => [entry, ...list].slice(0, 12));
    };
    const { requestManager, cache } = client;

    const unmount = [
      requestManager.events.onRequestStart(({ request }) => add("network", `GET ${request.endpoint}`)),
      requestManager.events.onResponse(({ request, response, details }) => {
        if (response.success) return add("network", `${response.status} ${request.endpoint}`);
        const next = details.willRetry ? `, retry ${details.retries + 1} in 1s` : ", giving up";
        return add("error", `${response.status} ${request.endpoint}${next}`);
      }),
      // Error responses are emitted too, but only successful ones are stored.
      cache.events.onData(({ cacheKey, success }) => {
        if (success) add("cache", `saved ${cacheKey}`);
      }),
      cache.events.onInvalidate((cacheKey) => add("cache", `invalidated ${cacheKey}`)),
      cache.events.onDelete((cacheKey) => add("cache", `removed ${cacheKey} (cacheTime)`)),
    ];

    return () => unmount.forEach((stop) => stop());
  }, []);

  return (
    <article>
      <header>
        <strong>Events</strong>
      </header>
      {entries.length === 0 ? (
        <p className="muted">Waiting for the first request...</p>
      ) : (
        <ol className="log">
          {entries.map((entry) => (
            <li key={entry.id} className={entry.kind}>
              {entry.text}
            </li>
          ))}
        </ol>
      )}
    </article>
  );
};
