import { useEffect, useState } from "react";

import { client } from "./api";

type Entry = {
  id: number;
  text: string;
  kind: "start" | "retry" | "error" | "success";
};

let nextId = 0;

/** Reads the client's request events. Every retry is a new attempt with its own start and response. */
export const AttemptLog = () => {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    const { events } = client.requestManager;
    const add = (kind: Entry["kind"], text: string) => {
      // Take the id now - the updater may run later, after other events changed the counter
      nextId += 1;
      const id = nextId;
      setEntries((list) => [{ id, kind, text }, ...list].slice(0, 10));
    };
    const time = () => new Date().toLocaleTimeString();

    const unmountStart = events.onRequestStart(() => add("start", `${time()} attempt started`));
    const unmountResponse = events.onResponse(({ response, details }) => {
      if (response.success) {
        add("success", `${time()} ${response.status} after ${details.retries} retries`);
      } else if (details.willRetry) {
        add("retry", `${time()} ${response.status}, retry ${details.retries + 1} in 1 s`);
      } else {
        add("error", `${time()} ${response.status}, giving up after ${details.retries} retries`);
      }
    });

    return () => {
      unmountStart();
      unmountResponse();
    };
  }, []);

  return (
    <article>
      <header>
        <strong>Attempts</strong>
      </header>
      <ol className="log">
        {entries.map((entry) => (
          <li key={entry.id} className={entry.kind}>
            {entry.text}
          </li>
        ))}
      </ol>
    </article>
  );
};
