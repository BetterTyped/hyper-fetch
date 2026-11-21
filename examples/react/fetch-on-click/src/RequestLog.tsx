import { useEffect, useState } from "react";

import { client } from "./api";

/** Lists every request the client sends, to prove that nothing goes out before you click. */
export const RequestLog = () => {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(
    () =>
      client.requestManager.events.onRequestStart(({ request }) => {
        const line = `${new Date().toLocaleTimeString()} GET ${request.endpoint}`;
        setLines((current) => [line, ...current].slice(0, 6));
      }),
    [],
  );

  return (
    <article>
      <header>
        <strong>Requests sent</strong>
      </header>
      {lines.length === 0 ? (
        <p className="muted">None yet. The page loaded without a single request.</p>
      ) : (
        <ol className="log">
          {lines.map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ol>
      )}
    </article>
  );
};
