import { useEffect, useState, useSyncExternalStore } from "react";

import { getQuote } from "./api";
import { logStore, rateLimiter } from "./server";

type Call = { id: number; state: "sending" | "done" | "failed"; status?: number | null; ms?: number };

const ServerPanel = () => {
  const [, rerender] = useState(0);
  // Re-renders a few times a second, only to show the countdown of the simulated server.
  useEffect(() => {
    const interval = setInterval(() => rerender((value) => value + 1), 250);
    return () => clearInterval(interval);
  }, []);
  const { used, resetsIn } = rateLimiter.status();

  return (
    <article>
      <h6>Simulated server</h6>
      <p>
        Requests in this window: <strong>{used}</strong> / {rateLimiter.limit}
      </p>
      <progress value={used} max={rateLimiter.limit} />
      <small className="muted">{resetsIn > 0 ? `Window resets in ${resetsIn} s` : "Window is open"}</small>
    </article>
  );
};

export const App = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const log = useSyncExternalStore(logStore.subscribe, logStore.get);

  const send = async (count: number) => {
    const startedAt = performance.now();
    const ids = Array.from({ length: count }, (_, index) => Date.now() + index);
    setCalls((prev) => [...ids.map((id): Call => ({ id, state: "sending" })), ...prev].slice(0, 10));

    await Promise.all(
      ids.map(async (id) => {
        // Resolves only after the interceptor has waited and sent the request again.
        const { status, success } = await getQuote.send();
        const ms = Math.round(performance.now() - startedAt);
        setCalls((prev) =>
          prev.map((call) => (call.id === id ? { id, state: success ? "done" : "failed", status, ms } : call)),
        );
      }),
    );
  };

  return (
    <main className="container">
      <hgroup>
        <h1>Retry-After</h1>
        <p>
          The server allows 3 requests per 5 seconds. Send 5 at once: two get a 429 and wait as long as the server asks.
        </p>
      </hgroup>
      <div className="toolbar">
        <div role="group">
          <button type="button" onClick={() => send(1)}>
            Send 1 request
          </button>
          <button type="button" className="secondary" onClick={() => send(5)}>
            Send 5 at once
          </button>
        </div>
      </div>
      <div className="grid-3">
        <article>
          <h6>Calls</h6>
          {calls.length === 0 && <p className="muted">Nothing sent yet.</p>}
          <ul className="list">
            {calls.map((call) => (
              <li key={call.id}>
                {call.state === "sending" && <span aria-busy="true">sending</span>}
                {call.state === "done" && <ins>{call.status} OK</ins>}
                {call.state === "failed" && <span className="error">{call.status} failed</span>}
                {call.ms !== undefined && <small className="muted">{(call.ms / 1000).toFixed(1)} s</small>}
              </li>
            ))}
          </ul>
        </article>
        <article>
          <h6>Interceptor log</h6>
          {log.length === 0 && <p className="muted">No 429 yet.</p>}
          <ol className="list">
            {log.map((entry) => (
              <li key={entry.id}>
                <small className="muted">{entry.time}</small> {entry.text}
              </li>
            ))}
          </ol>
        </article>
        <ServerPanel />
      </div>
    </main>
  );
};
