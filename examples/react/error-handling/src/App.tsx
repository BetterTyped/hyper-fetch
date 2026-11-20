import { useFetch } from "@hyper-fetch/react";
import { useState } from "react";

import type { ApiError, ProblemDetails } from "./api";
import { getStatus } from "./api";

const codes = [200, 401, 404, 422, 500, 503];

type LogEntry = { id: number; time: string; status: number | null; message: string };
let nextLogId = 0;

type ErrorStateProps = {
  status: number | null;
  error: ProblemDetails | ApiError;
  loading: boolean;
  onRetry: () => void;
};

/** One place that turns a typed error into UI. Each status gets the message and action that fits it. */
const ErrorState = ({ status, error, loading, onRetry }: ErrorStateProps) => {
  // `error` is a union. Only problem details have a `detail` field, so narrow before reading it.
  const detail = "detail" in error ? `${error.status}: ${error.detail}` : error.message;

  if (status === 401) {
    return (
      <article className="error">
        <h3>Sign in to continue</h3>
        <p className="muted">{detail}</p>
        <button type="button">Sign in</button>
      </article>
    );
  }

  if (status === 404) {
    return (
      <article className="error">
        <h3>Nothing here</h3>
        <p className="muted">{detail}</p>
      </article>
    );
  }

  // Other 4xx errors repeat on every retry, so there is no retry button.
  if (status && status < 500) {
    return (
      <article className="error">
        <h3>The request was rejected</h3>
        <p className="muted">{detail}</p>
      </article>
    );
  }

  // 5xx, and status 0 for network errors or timeouts, may pass on the next attempt.
  return (
    <article className="error">
      <h3>Something went wrong on our side</h3>
      <p className="muted">{detail}</p>
      <button type="button" onClick={onRetry} aria-busy={loading} disabled={loading}>
        Try again
      </button>
    </article>
  );
};

export const App = () => {
  const [code, setCode] = useState(200);
  const [log, setLog] = useState<LogEntry[]>([]);

  const { data, error, loading, status, refetch, onError } = useFetch(getStatus.setParams({ status: code }));

  // Runs for every failed response, refetches included. A good place for toasts, logging or error reporting.
  onError(({ response }) => {
    const entry = {
      id: nextLogId++,
      time: new Date().toLocaleTimeString(),
      status: response.status,
      message: response.error.message,
    };
    setLog((entries) => [entry, ...entries].slice(0, 8));
  });

  return (
    <main className="container">
      <hgroup>
        <h1>Error handling</h1>
        <p>Pick the status the server answers with. Errors come back typed, in the response, never as a rejection.</p>
      </hgroup>

      <div role="group">
        {codes.map((value) => (
          <button
            key={value}
            type="button"
            className={value === code ? undefined : "outline secondary"}
            onClick={() => setCode(value)}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="grid-2">
        <section>
          {loading && !data && !error && <article aria-busy="true">Loading...</article>}
          {error && <ErrorState status={status} error={error} loading={loading} onRetry={refetch} />}
          {data && (
            <article>
              <h3>Success</h3>
              <p>
                The server answered <mark>{data.status}</mark> {data.message}.
              </p>
            </article>
          )}
        </section>

        <article>
          <header>
            <strong>onError log</strong>
          </header>
          {log.length === 0 && <p className="muted">No errors yet.</p>}
          <ul className="log">
            {log.map((entry) => (
              <li key={entry.id}>
                <small className="muted">{entry.time}</small> <code>{entry.status}</code> {entry.message}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </main>
  );
};
