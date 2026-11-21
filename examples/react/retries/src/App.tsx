import { useFetch } from "@hyper-fetch/react";
import { useState } from "react";

import { getQuoteRequest, setFailures } from "./api";
import { AttemptLog } from "./AttemptLog";

export const App = () => {
  const [failures, setFailureCount] = useState(2);
  const [attempts, setAttempts] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);
  const { data, error, loading, refetch, onRequestStart, onSuccess, onError } = useFetch(getQuoteRequest);

  // Fires for every attempt, retries included.
  onRequestStart(() => setAttempts((count) => count + 1));
  // `onSuccess` and `onError` fire once, with the final result. A failed attempt that will be retried skips them.
  onSuccess(() => setGaveUp(false));
  onError(() => setGaveUp(true));

  const handleFetch = () => {
    setFailures(failures);
    setAttempts(0);
    setGaveUp(false);
    refetch();
  };

  // Between attempts the hook already holds the failed response, while the retry timer is still running.
  const waitingForRetry = !!error && !gaveUp && !loading;

  return (
    <main className="container">
      <hgroup>
        <h1>Retries</h1>
        <p>
          The request is retried up to 3 times, one second apart. Choose how many attempts fail before one succeeds.
        </p>
      </hgroup>
      <div className="grid-2">
        <section>
          <div role="group">
            <select
              value={failures}
              onChange={(event) => setFailureCount(Number(event.target.value))}
              aria-label="Failures"
            >
              {[0, 1, 2, 3, 4].map((count) => (
                <option key={count} value={count}>
                  {count} {count === 1 ? "failure" : "failures"}
                  {count > 3 ? " (more than the retries)" : ""}
                </option>
              ))}
            </select>
            <button type="button" onClick={handleFetch} disabled={loading}>
              Fetch quote
            </button>
          </div>
          <article>
            {loading && <p aria-busy="true">Attempt {attempts} of 4...</p>}
            {waitingForRetry && <p aria-busy="true">Attempt {attempts} failed, retrying in 1 s...</p>}
            {gaveUp && error && (
              <p>
                Failed after {attempts} attempts: {error.message}
              </p>
            )}
            {!loading && !error && data && (
              <blockquote>
                {data.quote}
                <footer>
                  <cite>{data.author}</cite>
                </footer>
              </blockquote>
            )}
          </article>
        </section>
        <AttemptLog />
      </div>
    </main>
  );
};
