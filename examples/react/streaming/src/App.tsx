import { useStream } from "@hyper-fetch/react";
import { useState } from "react";

import { getDrip } from "./api";

export const App = () => {
  const [numbytes, setNumbytes] = useState(120);
  const [duration, setDuration] = useState(6);

  // `start()` sends the request in streaming mode. `text` and `chunks` grow with every chunk the server sends.
  const { text, chunks, streaming, done, error, status, start, reset } = useStream(
    getDrip.setQueryParams({ numbytes, duration, delay: 0 }),
  );

  const restart = () => {
    reset();
    start();
  };

  let state = "Idle";
  if (streaming) state = "Streaming";
  else if (done) state = "Done";
  else if (error) state = "Failed";

  return (
    <main className="container">
      <hgroup>
        <h1>Streaming</h1>
        <p>The response is rendered while it downloads, the way chat apps show an LLM answer.</p>
      </hgroup>
      <article>
        <div className="grid">
          <label>
            Bytes: {numbytes}
            <input
              type="range"
              min={20}
              max={400}
              step={20}
              value={numbytes}
              disabled={streaming}
              onChange={(event) => setNumbytes(Number(event.target.value))}
            />
          </label>
          <label>
            Duration: {duration}s
            <input
              type="range"
              min={1}
              max={15}
              value={duration}
              disabled={streaming}
              onChange={(event) => setDuration(Number(event.target.value))}
            />
          </label>
        </div>
        <button type="button" onClick={restart} disabled={streaming} aria-busy={streaming}>
          {done || error ? "Stream again" : "Start"}
        </button>
      </article>
      <article>
        <header className="toolbar muted">
          <span>
            <strong>{state}</strong> · status {status ?? "-"} · {text.length} of {numbytes} bytes in {chunks.length}{" "}
            chunks
          </span>
        </header>
        <progress value={text.length} max={numbytes} />
        {error && <p className="error">The stream ended early: {error.message}</p>}
        <pre className="output">
          {text}
          {streaming && <span className="cursor" />}
        </pre>
      </article>
    </main>
  );
};
