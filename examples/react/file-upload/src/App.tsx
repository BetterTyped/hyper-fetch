import { useSubmit } from "@hyper-fetch/react";
import { useState } from "react";
import type { FormEvent } from "react";

import { uploadFileRequest } from "./api";

type Phase = "idle" | "sending" | "receiving" | "done" | "canceled" | "failed";

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} kB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export const App = () => {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [received, setReceived] = useState({
    progress: 0,
    loaded: 0,
    total: 0,
  });

  const upload = useSubmit(uploadFileRequest);

  // Lifecycle events of the request: the body starts going out, the server starts answering, the answer streams in.
  upload.onSubmitRequestStart(() => {
    setPhase("sending");
    setReceived({ progress: 0, loaded: 0, total: 0 });
  });
  upload.onSubmitResponseStart(() => setPhase("receiving"));
  upload.onSubmitDownloadProgress(({ progress, loaded, total }) => setReceived({ progress, loaded, total }));
  upload.onSubmitSuccess(() => setPhase("done"));
  upload.onSubmitError(() => setPhase("failed"));
  upload.onSubmitAbort(() => setPhase("canceled"));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;

    const payload = new FormData();
    payload.append("file", file);
    payload.append("description", "Sent with HyperFetch");
    upload.submit({ payload });
  };

  const echoed = upload.data?.files.file;

  return (
    <main className="container narrow">
      <hgroup>
        <h1>File upload</h1>
        <p>Pick a file and send it to httpbin. Large files (a few MB) make every phase easy to see.</p>
      </hgroup>

      <form onSubmit={handleSubmit}>
        <input type="file" aria-label="File" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <div className="actions">
          <button type="submit" disabled={!file || upload.submitting} aria-busy={upload.submitting}>
            Upload {file && `(${formatSize(file.size)})`}
          </button>
          {/* `abort()` cancels the running request. The abort callback fires and the response is never stored. */}
          <button type="button" className="secondary" onClick={upload.abort} disabled={!upload.submitting}>
            Cancel
          </button>
        </div>
      </form>

      <article>
        <label>
          Sending
          {/* No value means "busy, size unknown": the browser fetch API does not report upload progress. */}
          {phase === "sending" ? <progress /> : <progress value={phase === "idle" ? 0 : 100} max={100} />}
        </label>
        <label>
          Receiving {received.total > 0 && `${formatSize(received.loaded)} of ${formatSize(received.total)}`}
          <progress value={received.progress} max={100} />
        </label>
        <p aria-live="polite">
          {phase === "idle" && <span className="muted">Nothing sent yet.</span>}
          {phase === "sending" && "Sending the file..."}
          {phase === "receiving" && "Server accepted the file, reading the answer..."}
          {phase === "canceled" && "Upload canceled."}
          {phase === "failed" && `Upload failed${upload.status ? ` with status ${upload.status}` : ""}.`}
          {phase === "done" && echoed !== undefined && (
            <mark>Done. httpbin echoed {echoed.length.toLocaleString()} characters of the file back.</mark>
          )}
        </p>
      </article>
    </main>
  );
};
