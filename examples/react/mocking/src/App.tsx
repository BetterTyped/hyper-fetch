import { useFetch } from "@hyper-fetch/react";
import { useState } from "react";

import { applyMock, getTodos, type MockSettings, type Scenario, setMocking } from "./api";

const scenarios: Scenario[] = ["success", "empty", "error", "timeout"];
const initialSettings: MockSettings = { scenario: "success", latency: 800 };

// Mocks are set before the first render, so the first request is already mocked.
applyMock(initialSettings);

export const App = () => {
  const [mocked, setMocked] = useState(true);
  const [settings, setSettings] = useState(initialSettings);
  const [progress, setProgress] = useState(0);

  const updateMocked = (enabled: boolean) => {
    setMocking(enabled);
    setMocked(enabled);
  };

  const updateSettings = (next: MockSettings) => {
    applyMock(next);
    setSettings(next);
  };

  // `dependencies` sends the request again whenever the mock setup changes.
  const {
    data,
    error,
    loading,
    status,
    requestTimestamp,
    responseTimestamp,
    refetch,
    onRequestStart,
    onDownloadProgress,
  } = useFetch(getTodos.setQueryParams({ limit: 5 }), { dependencies: [mocked, settings] });

  // Mocked requests emit progress events too, so loaders and progress bars can be built before the API exists.
  onRequestStart(() => setProgress(0));
  onDownloadProgress(({ progress: value }) => setProgress(value));

  const time = requestTimestamp && responseTimestamp ? responseTimestamp.getTime() - requestTimestamp.getTime() : null;

  return (
    <main className="container">
      <hgroup>
        <h1>Todos</h1>
        <p>A screen built before its backend: switch between the mock and the real API.</p>
      </hgroup>
      <div className="grid-2">
        <article>
          <label>
            <input
              type="checkbox"
              role="switch"
              checked={mocked}
              onChange={(event) => updateMocked(event.target.checked)}
            />
            Use mocks
          </label>
          <fieldset disabled={!mocked}>
            <legend>Mocked response</legend>
            {scenarios.map((scenario) => (
              <label key={scenario}>
                <input
                  type="radio"
                  name="scenario"
                  checked={settings.scenario === scenario}
                  onChange={() => updateSettings({ ...settings, scenario })}
                />
                {scenario}
              </label>
            ))}
            <label>
              Latency: {settings.latency} ms
              <input
                type="range"
                min={0}
                max={3000}
                step={100}
                value={settings.latency}
                disabled={settings.scenario === "timeout"}
                onChange={(event) => updateSettings({ ...settings, latency: Number(event.target.value) })}
              />
            </label>
          </fieldset>
        </article>

        <article>
          <header className="toolbar muted">
            <span>
              {mocked ? "Mock" : "dummyjson.com"} · status {status ?? "-"}
              {time !== null && ` · ${time} ms`}
            </span>
            <button type="button" className="outline secondary" onClick={refetch} disabled={loading}>
              Reload
            </button>
          </header>
          {loading && <progress value={progress} max={100} />}
          {error && <p className="error">Could not load todos: {error.message}</p>}
          {!loading && !error && data?.todos.length === 0 && <p className="muted">Nothing to do.</p>}
          <ul>
            {!error &&
              data?.todos.map((todo) => <li key={todo.id}>{todo.completed ? <del>{todo.todo}</del> : todo.todo}</li>)}
          </ul>
        </article>
      </div>
    </main>
  );
};
