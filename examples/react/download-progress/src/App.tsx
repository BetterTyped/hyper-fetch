import { useSubmit } from "@hyper-fetch/react";
import { useEffect, useState } from "react";

import { downloadFileRequest, fileSize } from "./api";

type Progress = { progress: number; loaded: number; total: number; speed: number; timeLeft: number | null };

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} kB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

export const App = () => {
  const [duration, setDuration] = useState(5);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { submit, submitting, abort, onSubmitDownloadProgress, onSubmitSuccess, onSubmitError, onSubmitAbort } =
    useSubmit(downloadFileRequest.setParams({ size: fileSize }));

  // Fires for every chunk the browser receives.
  onSubmitDownloadProgress(({ progress: percent, loaded, total, timeLeft, startTimestamp }) => {
    const seconds = Math.max((Date.now() - startTimestamp) / 1000, 0.001);
    setProgress({ progress: percent, loaded, total, timeLeft, speed: loaded / seconds });
  });
  // The whole body is here. A Blob URL lets the user save it without downloading it again.
  onSubmitSuccess(({ response }) => {
    setFileUrl(URL.createObjectURL(new Blob([response.data], { type: "text/plain" })));
    setMessage("Download complete.");
  });
  onSubmitError(({ response }) => setMessage(`Download failed: ${response.error?.message ?? response.status}`));
  onSubmitAbort(() => setMessage("Download canceled."));

  // Blob URLs keep the data in memory until they are revoked.
  useEffect(
    () => () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    },
    [fileUrl],
  );

  const handleDownload = () => {
    setProgress(null);
    setFileUrl(null);
    setMessage(null);
    submit({ queryParams: { duration, chunk_size: 8192 } });
  };

  return (
    <main className="container narrow">
      <hgroup>
        <h1>Download progress</h1>
        <p>Download a 1 MB file from httpbin. Pick how long the server takes to send it, then save the result.</p>
      </hgroup>

      <div className="actions">
        <select
          aria-label="Server speed"
          value={duration}
          disabled={submitting}
          onChange={(event) => setDuration(Number(event.target.value))}
        >
          {[2, 5, 10].map((seconds) => (
            <option key={seconds} value={seconds}>
              Sent over {seconds} seconds
            </option>
          ))}
        </select>
        <button type="button" onClick={handleDownload} disabled={submitting} aria-busy={submitting}>
          Download 1 MB
        </button>
        <button type="button" className="secondary" onClick={abort} disabled={!submitting}>
          Cancel
        </button>
      </div>

      <article>
        <progress value={progress?.progress ?? 0} max={100} />
        <dl className="stats">
          <div>
            <dt>Received</dt>
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
        <footer aria-live="polite" className="toolbar">
          <span>{message ?? (submitting ? "Downloading..." : "Nothing downloaded yet.")}</span>
          {fileUrl && (
            <a href={fileUrl} download="hyper-fetch-download.txt" role="button" className="outline">
              Save file
            </a>
          )}
        </footer>
      </article>
    </main>
  );
};
