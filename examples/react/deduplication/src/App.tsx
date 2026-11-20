import { useEffect, useState } from "react";

import { client, getUserRequest } from "./api";

type Result = { status: "waiting" | "done" | "failed"; text: string };

export const App = () => {
  const [callers, setCallers] = useState(5);
  const [deduplicate, setDeduplicate] = useState(true);
  const [results, setResults] = useState<Result[]>([]);
  const [counts, setCounts] = useState({ network: 0, joined: 0 });

  // Count what really happens in the dispatcher: requests sent to the network and requests that joined one in flight.
  useEffect(() => {
    const { events } = client.requestManager;
    const unmountStart = events.onRequestStart(() => setCounts((value) => ({ ...value, network: value.network + 1 })));
    const unmountJoined = events.onDeduplicated(() => setCounts((value) => ({ ...value, joined: value.joined + 1 })));
    return () => {
      unmountStart();
      unmountJoined();
    };
  }, []);

  const sendFromAll = () => {
    const request = getUserRequest.setDeduplicate(deduplicate);
    setCounts({ network: 0, joined: 0 });
    setResults(
      Array.from({ length: callers }, () => ({
        status: "waiting",
        text: "Waiting...",
      })),
    );

    // Every caller sends the same request at the same moment, like several components mounting together.
    Array.from({ length: callers }).forEach((_, index) => {
      const started = Date.now();
      request.send().then(({ data, error }) => {
        const result: Result = data
          ? {
              status: "done",
              text: `${data.firstName} ${data.lastName} in ${Date.now() - started} ms`,
            }
          : { status: "failed", text: error?.message ?? "Failed" };
        setResults((list) => list.map((item, position) => (position === index ? result : item)));
      });
    });
  };

  return (
    <main className="container">
      <hgroup>
        <h1>Deduplication</h1>
        <p>Several callers ask for the same user at once. With deduplication they share one network request.</p>
      </hgroup>

      <div className="grid">
        <label>
          Callers: {callers}
          <input
            type="range"
            min={2}
            max={10}
            value={callers}
            onChange={(event) => setCallers(Number(event.target.value))}
          />
        </label>
        <label>
          <input
            type="checkbox"
            role="switch"
            checked={deduplicate}
            onChange={(event) => setDeduplicate(event.target.checked)}
          />
          deduplicate
        </label>
        <button type="button" onClick={sendFromAll}>
          Send from all callers
        </button>
      </div>

      <div className="stats">
        <article>
          <small className="muted">Callers</small>
          <p className="stat">{results.length}</p>
        </article>
        <article>
          <small className="muted">Network requests</small>
          <p className="stat">{counts.network}</p>
        </article>
        <article>
          <small className="muted">Joined a running request</small>
          <p className="stat">{counts.joined}</p>
        </article>
      </div>

      <ol className="callers">
        {results.map((result, index) => (
          <li key={index} aria-busy={result.status === "waiting"}>
            <strong>Caller {index + 1}</strong> <span className="muted">{result.text}</span>
          </li>
        ))}
      </ol>
    </main>
  );
};
