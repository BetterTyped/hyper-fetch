import type { CacheValueType } from "@hyper-fetch/core";
import { useAppManager, useQueue } from "@hyper-fetch/react";
import { useEffect, useState } from "react";

import { addTodo, client } from "./api";
import { readPersistedCache } from "./storage";

/** Reads IndexedDB directly, so you see what a reload would start with. */
export const CachePanel = () => {
  const [entries, setEntries] = useState<[string, CacheValueType][]>([]);

  useEffect(() => {
    const refresh = () => void readPersistedCache().then(setEntries);
    refresh();
    const unmountData = client.cache.events.onData(refresh);
    const unmountDelete = client.cache.events.onDelete(refresh);
    return () => {
      unmountData();
      unmountDelete();
    };
  }, []);

  return (
    <article>
      <h6>Cache in IndexedDB ({entries.length})</h6>
      {entries.length === 0 && <p className="muted">Empty. Nothing has been fetched yet.</p>}
      <ul className="list entries">
        {entries.map(([key, value]) => (
          <li key={key}>
            <code>{key}</code>
            <small className="muted">saved {new Date(value.responseTimestamp).toLocaleTimeString()}</small>
          </li>
        ))}
      </ul>
    </article>
  );
};

/** `useQueue` starts with the requests restored from localStorage. */
export const QueuePanel = () => {
  const { isOnline } = useAppManager(client);
  const { requests } = useQueue(addTodo);

  return (
    <article>
      <h6>Queue in localStorage ({requests.length})</h6>
      {requests.length === 0 && <p className="muted">Empty. Every change has reached the server.</p>}
      <ol className="list">
        {requests.map((item, index) => (
          <li key={item.requestId}>
            <span>POST {item.request.payload?.todo}</span>
            {!isOnline && <mark>waiting for network</mark>}
            {/* `queued: true` sends one request at a time, the others wait for their turn. */}
            {isOnline &&
              (index === 0 ? <small aria-busy="true">sending</small> : <small className="muted">next</small>)}
          </li>
        ))}
      </ol>
    </article>
  );
};
