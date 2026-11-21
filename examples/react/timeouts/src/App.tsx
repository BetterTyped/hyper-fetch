import { TimeoutError } from "@hyper-fetch/core";
import { useFetch } from "@hyper-fetch/react";
import { useEffect, useState } from "react";

import { getProduct } from "./api";

const DELAYS = [500, 1500, 3000];
const TIMEOUTS = [1000, 2000, 5000];

/** Elapsed time of the current attempt, for the progress bar. */
const useElapsed = (running: boolean) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    const startedAt = performance.now();
    setElapsed(0);
    const interval = setInterval(() => setElapsed(performance.now() - startedAt), 50);
    return () => clearInterval(interval);
  }, [running]);
  return elapsed;
};

const Choice = ({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: number[];
  value: number;
  onChange: (value: number) => void;
}) => (
  <fieldset>
    <legend>{label}</legend>
    <div role="group">
      {values.map((option) => (
        <button
          key={option}
          type="button"
          className={option === value ? undefined : "outline secondary"}
          onClick={() => onChange(option)}
        >
          {option / 1000} s
        </button>
      ))}
    </div>
  </fieldset>
);

export const App = () => {
  const [delay, setDelay] = useState(1500);
  const [timeout, setTimeoutMs] = useState(2000);

  // `setOptions` replaces the adapter options of this request instance. `delay` and `select` are dummyjson query
  // params: answer after `delay` ms, return only these fields.
  const request = getProduct.setQueryParams({ delay, select: "title,price,thumbnail" }).setOptions({ timeout });
  // The timeout is not part of the cache key, so it is listed as a dependency to send the request again on change.
  const { data, error, loading, refetch } = useFetch(request, { dependencies: [timeout] });
  const elapsed = useElapsed(loading);

  const timedOut = error instanceof TimeoutError;

  return (
    <main className="container">
      <hgroup>
        <h1>Timeouts</h1>
        <p>Make the server slower than the timeout and the request is aborted with a TimeoutError you can retry.</p>
      </hgroup>
      <div className="grid-2">
        <Choice label="Server answers after" values={DELAYS} value={delay} onChange={setDelay} />
        <Choice label="Timeout" values={TIMEOUTS} value={timeout} onChange={setTimeoutMs} />
      </div>
      <article>
        {loading && (
          <>
            <p aria-busy="true">
              Waiting {(elapsed / 1000).toFixed(1)} s of {timeout / 1000} s
            </p>
            <progress value={Math.min(elapsed, timeout)} max={timeout} />
          </>
        )}
        {!loading && timedOut && (
          <>
            <p className="error">
              <strong>Timed out.</strong> The server did not answer within {timeout / 1000} s, so the request was
              aborted.
            </p>
            <div role="group">
              <button type="button" onClick={() => refetch()}>
                Retry
              </button>
              <button type="button" className="secondary" onClick={() => setTimeoutMs(5000)}>
                Allow 5 s and retry
              </button>
            </div>
          </>
        )}
        {!loading && error && !timedOut && <p className="error">Request failed: {error.message}</p>}
        {!loading && !error && data && (
          <div className="product">
            <img src={data.thumbnail} alt="" width={64} height={64} />
            <div>
              <strong>{data.title}</strong>
              <p>${data.price}</p>
            </div>
            <button type="button" className="outline" onClick={() => refetch()}>
              Send again
            </button>
          </div>
        )}
      </article>
    </main>
  );
};
