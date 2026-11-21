import { useFetch } from "@hyper-fetch/react";
import { useEffect, useState } from "react";

import { getRandomQuote } from "./api";

const intervals = [2000, 5000, 10000];

/** Re-renders every 250 ms, only to show how long ago the data arrived. */
const useNow = () => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  return now;
};

export const App = () => {
  const [polling, setPolling] = useState(true);
  const [refreshTime, setRefreshTime] = useState(5000);
  const [inBackground, setInBackground] = useState(false);
  const [updates, setUpdates] = useState(0);
  const now = useNow();

  const { data, error, loading, responseTimestamp, refetch, onSuccess } = useFetch(getRandomQuote, {
    // `refresh` turns polling on, `refreshTime` is the interval in ms.
    refresh: polling,
    refreshTime,
    // `false` pauses polling while the tab is hidden or the window is not focused.
    refetchBlurred: inBackground,
  });

  onSuccess(() => setUpdates((count) => count + 1));

  const elapsed = responseTimestamp ? now - responseTimestamp.getTime() : 0;

  return (
    <main className="container">
      <hgroup>
        <h1>Polling</h1>
        <p>A new random quote is requested every few seconds while polling is on.</p>
      </hgroup>

      <fieldset className="controls">
        <label>
          <input
            type="checkbox"
            role="switch"
            checked={polling}
            onChange={(event) => setPolling(event.target.checked)}
          />
          Polling
        </label>
        <label>
          <input
            type="checkbox"
            role="switch"
            checked={inBackground}
            onChange={(event) => setInBackground(event.target.checked)}
          />
          Keep polling in a background tab
        </label>
        <div role="group">
          {intervals.map((value) => (
            <button
              key={value}
              type="button"
              className={value === refreshTime ? undefined : "outline secondary"}
              onClick={() => setRefreshTime(value)}
            >
              Every {value / 1000}s
            </button>
          ))}
        </div>
      </fieldset>

      {error && <article>Could not load a quote: {error.message}</article>}
      {!data && loading && <article aria-busy="true">Loading...</article>}
      {data && (
        <article>
          <blockquote>
            {data.quote}
            <footer>
              <cite>{data.author}</cite>
            </footer>
          </blockquote>
          <footer className="status">
            <small className="muted">
              Last updated {responseTimestamp?.toLocaleTimeString()} ({Math.floor(elapsed / 1000)}s ago) · Responses
              received: {updates}
            </small>
            <button type="button" className="outline secondary" onClick={refetch} aria-busy={loading}>
              Refresh now
            </button>
          </footer>
          {polling && <progress value={Math.min(elapsed, refreshTime)} max={refreshTime} aria-label="Next refresh" />}
        </article>
      )}
    </main>
  );
};
