import { useListener } from "@hyper-fetch/react";
import { useState } from "react";

import { onRecentChange, type RecentChange, socket } from "./api";

// The stream sends dozens of events per second. Keeping only the newest ones bounds memory and rendering.
const MAX_ITEMS = 15;

export const App = () => {
  const [changes, setChanges] = useState<RecentChange[]>([]);
  const [received, setReceived] = useState(0);
  const [hideBots, setHideBots] = useState(true);

  // Subscribes while mounted. `connected` follows the EventSource connection.
  const { connected, connecting, onEvent } = useListener(onRecentChange);

  onEvent(({ data }) => {
    setReceived((count) => count + 1);
    if (hideBots && data.bot) return;
    setChanges((prev) => [data, ...prev].slice(0, MAX_ITEMS));
  });

  let status = "Paused";
  if (connected) status = "Live";
  else if (connecting) status = "Connecting...";

  return (
    <main className="container">
      <hgroup>
        <h1>Wikipedia, live</h1>
        <p>Every edit on Wikimedia wikis, pushed by the server over server-sent events.</p>
      </hgroup>
      <article>
        <header className="toolbar">
          <span aria-busy={connecting && !connected}>
            <strong>{status}</strong> <small className="muted">· {received} events received</small>
          </span>
          <div className="controls">
            <label>
              <input
                type="checkbox"
                role="switch"
                checked={hideBots}
                onChange={(event) => setHideBots(event.target.checked)}
              />
              Hide bots
            </label>
            {/* Disconnecting closes the EventSource, so the server stops sending. Connecting opens a new one. */}
            {connected || connecting ? (
              <button type="button" className="outline secondary" onClick={socket.disconnect}>
                Pause
              </button>
            ) : (
              <button type="button" onClick={socket.connect}>
                Resume
              </button>
            )}
          </div>
        </header>
        {changes.length === 0 && <p className="muted">Waiting for the first edit...</p>}
        <ul className="feed">
          {changes.map((change) => (
            <li key={change.meta.id}>
              <mark>{change.type}</mark>{" "}
              <a href={change.title_url} target="_blank" rel="noreferrer">
                {change.title}
              </a>
              <br />
              <small className="muted">
                {change.wiki} · {change.user} · {new Date(change.timestamp * 1000).toLocaleTimeString()}
              </small>
            </li>
          ))}
        </ul>
      </article>
    </main>
  );
};
