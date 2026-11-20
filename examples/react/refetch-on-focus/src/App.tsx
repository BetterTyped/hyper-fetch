import { useAppManager, useFetch } from "@hyper-fetch/react";
import { useEffect, useState } from "react";

import { client, getRandomTodo } from "./api";

type LogEntry = { id: number; time: string; text: string; kind: "event" | "request" };
let nextId = 0;

type Options = { refetchOnFocus: boolean; refetchOnBlur: boolean; refetchOnReconnect: boolean };
const optionNames: (keyof Options)[] = ["refetchOnFocus", "refetchOnBlur", "refetchOnReconnect"];

export const App = () => {
  const [options, setOptions] = useState<Options>({
    refetchOnFocus: true,
    refetchOnBlur: false,
    refetchOnReconnect: true,
  });
  const [log, setLog] = useState<LogEntry[]>([]);
  const { isFocused, isOnline, setFocused, setOnline } = useAppManager(client);

  const { data, error, loading, onRequestStart } = useFetch(getRandomTodo, options);

  const addLog = (text: string, kind: LogEntry["kind"]) => {
    const entry = { id: nextId++, time: new Date().toLocaleTimeString(), text, kind };
    setLog((entries) => [entry, ...entries].slice(0, 12));
  };

  // The cause: focus and network events of the app manager.
  useEffect(() => {
    const unmount = [
      client.appManager.events.onFocus(() => addLog("focus", "event")),
      client.appManager.events.onBlur(() => addLog("blur", "event")),
      client.appManager.events.onOnline(() => addLog("online", "event")),
      client.appManager.events.onOffline(() => addLog("offline", "event")),
    ];
    return () => unmount.forEach((callback) => callback());
  }, []);

  // The effect: every request this hook sends.
  onRequestStart(() => addLog("GET /todos/random", "request"));

  return (
    <main className="container">
      <hgroup>
        <h1>Refetch on focus</h1>
        <p>Switch to another tab or window and come back. The log shows each event and the request it caused.</p>
      </hgroup>

      <div className="grid-2">
        <section>
          <fieldset>
            {optionNames.map((name) => (
              <label key={name}>
                <input
                  type="checkbox"
                  role="switch"
                  checked={options[name]}
                  onChange={(event) => setOptions((current) => ({ ...current, [name]: event.target.checked }))}
                />
                <code>{name}</code>
              </label>
            ))}
          </fieldset>

          <p>
            Window <mark>{isFocused ? "focused" : "blurred"}</mark> · Network{" "}
            <mark>{isOnline ? "online" : "offline"}</mark>
          </p>
          {/* Leaving the tab is easy, losing the network is not. These buttons send the same app manager events. */}
          <div className="buttons">
            <button type="button" className="outline secondary" onClick={() => setFocused(!isFocused)}>
              Simulate {isFocused ? "blur" : "focus"}
            </button>
            <button type="button" className="outline secondary" onClick={() => setOnline(!isOnline)}>
              Go {isOnline ? "offline" : "online"}
            </button>
          </div>

          {error && <article>Could not load a todo: {error.message}</article>}
          {!data && loading && <article aria-busy="true">Loading...</article>}
          {data && (
            <article aria-busy={loading}>
              {data.completed ? "✓" : "○"} {data.todo}
            </article>
          )}
        </section>

        <article>
          <header>
            <strong>Log</strong>
          </header>
          <ul className="log">
            {log.map((entry) => (
              <li key={entry.id} className={entry.kind}>
                <small className="muted">{entry.time}</small> {entry.kind === "request" ? "→ " : ""}
                {entry.text}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </main>
  );
};
