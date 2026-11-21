import { useState, useSyncExternalStore } from "react";

import { calls, client, logger } from "./api";
import { logStore, metricsStore } from "./plugins";

type CallName = keyof typeof calls;
const callNames = Object.keys(calls) as CallName[];

const Log = () => {
  const lines = useSyncExternalStore(logStore.subscribe, logStore.get);
  return (
    <article>
      <h6>Logger plugin</h6>
      {lines.length === 0 && <p className="muted">Send a request.</p>}
      <ol className="log">
        {lines.map((line) => (
          <li key={line.id} className={line.kind}>
            {line.text}
          </li>
        ))}
      </ol>
    </article>
  );
};

const Metrics = () => {
  const metrics = useSyncExternalStore(metricsStore.subscribe, metricsStore.get);
  const rows = Object.entries(metrics);
  return (
    <article>
      <h6>Metrics plugin</h6>
      <table>
        <thead>
          <tr>
            <th>Endpoint</th>
            <th>Calls</th>
            <th>Error rate</th>
            <th>Avg</th>
            <th>Max</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([endpoint, stats]) => (
            <tr key={endpoint}>
              <td>
                <code>{endpoint}</code>
              </td>
              <td>{stats.calls}</td>
              <td className={stats.errors ? "error" : undefined}>{Math.round((stats.errors / stats.calls) * 100)}%</td>
              <td>{Math.round(stats.totalMs / stats.calls)} ms</td>
              <td>{stats.maxMs} ms</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="muted">No requests finished yet.</p>}
    </article>
  );
};

export const App = () => {
  const [loggerOn, setLoggerOn] = useState(true);

  const toggleLogger = (on: boolean) => {
    // Plugins can be added and removed at runtime. The metrics plugin keeps counting either way.
    if (on) client.addPlugin(logger);
    else client.removePlugin(logger);
    setLoggerOn(on);
  };

  const sendMany = () => {
    for (let index = 0; index < 8; index += 1) {
      calls[callNames[index % callNames.length]]();
    }
  };

  return (
    <main className="container">
      <hgroup>
        <h1>Plugins</h1>
        <p>Two plugins watch every request of the client: one logs it, one measures durations and error rates.</p>
      </hgroup>
      <div className="toolbar">
        <div className="buttons">
          {callNames.map((name) => (
            <button key={name} type="button" className="outline" onClick={() => calls[name]()}>
              {name}
            </button>
          ))}
          <button type="button" onClick={sendMany}>
            Send 8 mixed
          </button>
        </div>
        <label>
          <input
            type="checkbox"
            role="switch"
            checked={loggerOn}
            onChange={(event) => toggleLogger(event.target.checked)}
          />
          Logger plugin
        </label>
      </div>
      <div className="grid-2">
        <Log />
        <Metrics />
      </div>
    </main>
  );
};
