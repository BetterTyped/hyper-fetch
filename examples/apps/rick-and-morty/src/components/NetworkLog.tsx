import { useSyncExternalStore } from "react";

import { networkLog } from "../api/network-log";

export const NetworkLog = () => {
  const entries = useSyncExternalStore(networkLog.subscribe, networkLog.get);

  return (
    <article className="network-log">
      <header>
        <strong>Network</strong> <small className="muted">requests that skipped the cache</small>
      </header>
      {entries.length === 0 && <small className="muted">None yet.</small>}
      <ol>
        {entries.map((entry) => (
          <li key={entry.id}>
            <code>GET {entry.endpoint}</code> <small className="muted">{entry.time}</small>
          </li>
        ))}
      </ol>
    </article>
  );
};
