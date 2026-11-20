import { useSubmit } from "@hyper-fetch/react";
import { useState } from "react";

import { maxFileSize, uploadFileRequest } from "./api";

type Progress = { progress: number; loaded: number; total: number; speed: number; timeLeft: number | null };

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} kB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

/** A file of random bytes, so you can try the upload without picking a file. Random data does not compress. */
const createTestFile = () => {
  const bytes = new Uint8Array(maxFileSize - 1024);
  for (let offset = 0; offset < bytes.length; offset += 65536) {
    crypto.getRandomValues(bytes.subarray(offset, offset + 65536));
  }
  return new File([bytes], "test-file.bin", { type: "application/octet-stream" });
};

export const App = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const { submit, submitting, abort, onSubmitUploadProgress, onSubmitSuccess, onSubmitError, onSubmitAbort } =
    useSubmit(uploadFileRequest);

  // Called many times while the body goes out. Axios gives real byte counts, so the bar moves smoothly.
  onSubmitUploadProgress(({ progress: percent, loaded, total, timeLeft, startTimestamp }) => {
    const seconds = Math.max((Date.now() - startTimestamp) / 1000, 0.001);
    setProgress({ progress: percent, loaded, total, timeLeft, speed: loaded / seconds });
  });
  onSubmitSuccess(({ response }) =>
    setResult(`Done. httpbin received ${response.data.headers["Content-Length"]} bytes.`),
  );
  onSubmitError(({ response }) => setResult(`Upload failed: ${response.error?.message ?? response.status}`));
  onSubmitAbort(() => setResult("Upload canceled."));

  const upload = (selected: File) => {
    setFile(selected);
    setResult(null);
    setProgress(null);
    if (selected.size > maxFileSize) {
      setResult(`This file has ${formatSize(selected.size)}. httpbin accepts up to ${formatSize(maxFileSize)}.`);
      return;
    }
    const payload = new FormData();
    payload.append("file", selected);
    submit({ payload });
  };

  return (
    <main className="container narrow">
      <hgroup>
        <h1>Upload progress</h1>
        <p>Pick a file up to 1 MB, or use a generated one. The Axios adapter reports every chunk that goes out.</p>
      </hgroup>

      <div className="actions">
        <input
          type="file"
          aria-label="File"
          disabled={submitting}
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) upload(selected);
          }}
        />
        <button type="button" className="outline" disabled={submitting} onClick={() => upload(createTestFile())}>
          Upload a 1 MB test file
        </button>
        {/* `abort()` cancels the running request: axios stops sending and the abort callback fires. */}
        <button type="button" className="secondary" disabled={!submitting} onClick={abort}>
          Cancel
        </button>
      </div>

      <article>
        <header className="toolbar">
          <strong>{file ? file.name : "No file yet"}</strong>
          <small className="muted">{file && formatSize(file.size)}</small>
        </header>
        <progress value={progress?.progress ?? 0} max={100} />
        <dl className="stats">
          <div>
            <dt>Sent</dt>
            <dd>{progress ? `${Math.round(progress.progress)}%` : "-"}</dd>
          </div>
          <div>
            <dt>Bytes</dt>
            <dd>{progress ? `${formatSize(progress.loaded)} of ${formatSize(progress.total)}` : "-"}</dd>
          </div>
          <div>
            <dt>Speed</dt>
            <dd>{progress ? `${formatSize(progress.speed)}/s` : "-"}</dd>
          </div>
          <div>
            <dt>Time left</dt>
            <dd>{progress && progress.timeLeft !== null ? `${(progress.timeLeft / 1000).toFixed(1)} s` : "-"}</dd>
          </div>
        </dl>
        <footer aria-live="polite">
          {submitting && progress?.progress === 100 && <span aria-busy="true">Sent. Waiting for the server...</span>}
          {result && <span>{result}</span>}
        </footer>
      </article>
    </main>
  );
};
