import { useEffect, useState } from "react";

import { client } from "./api";
import type { SearchRequest } from "./api";

type Entry = { id: string; text: string; kind: "start" | "abort" | "done" };

/** Listens to the client's request events, so it sees every request, also the ones no component waits for anymore. */
export const RequestLog = () => {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    const { events } = client.requestManager;
    const add = (kind: Entry["kind"], text: string) =>
      setEntries((list) => [{ id: `${Date.now()}-${Math.random()}`, kind, text }, ...list].slice(0, 8));
    const term = (request: SearchRequest) => `"${request.queryParams?.q ?? ""}"`;

    const unmountStart = events.onRequestStart<SearchRequest>(({ request }) => add("start", `${term(request)} sent`));
    const unmountAbort = events.onAbort<SearchRequest>(({ request }) => add("abort", `${term(request)} canceled`));
    const unmountResponse = events.onResponse<SearchRequest>(({ request, response, details }) => {
      if (details.isCanceled) return;
      add("done", `${term(request)} answered with ${response.data?.total ?? 0} results`);
    });

    return () => {
      unmountStart();
      unmountAbort();
      unmountResponse();
    };
  }, []);

  return (
    <article>
      <header>
        <strong>Request log</strong>
      </header>
      {entries.length === 0 && <p className="muted">Type to send requests.</p>}
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
