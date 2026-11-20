import { useListener, useSubmit } from "@hyper-fetch/react";
import { useState } from "react";

import { onProgress, startJob } from "./api";

type Job = { id: string; steps: number };

const JobCard = ({ job }: { job: Job }) => {
  const [log, setLog] = useState<string[]>([]);
  // The payload is the procedure input. Each job is its own stream.
  const { data, extra, status, error, onEvent } = useListener(onProgress.setPayload({ id: job.id }));

  onEvent(({ data: event }) => {
    // `at` is a Date: the oRPC serializer keeps rich types in every event.
    setLog((current) => [`${event.at.toLocaleTimeString()} ${event.stage}`, ...current].slice(0, 4));
  });

  return (
    <article>
      <header className="toolbar">
        <strong>{job.id}</strong>
        <small className="muted" aria-busy={status === "starting"}>
          {status} / event {extra?.id ?? "-"}
        </small>
      </header>
      <progress value={data?.step ?? 0} max={job.steps} />
      {status === "ended" && <p>Done in {job.steps} steps.</p>}
      {status === "failed" && <p className="error">{error?.message}</p>}
      <ul className="log">
        {log.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </article>
  );
};

export const App = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const { submit, submitting, error } = useSubmit(startJob);

  const start = async (steps: number) => {
    const { data } = await submit({ payload: { steps } });
    if (data) setJobs((current) => [data, ...current]);
  };

  return (
    <main className="container">
      <hgroup>
        <h1>oRPC event iterators</h1>
        <p>Each job streams its progress from an async generator on the server into useListener.</p>
      </hgroup>
      <div role="group">
        {[4, 8, 12].map((steps) => (
          <button key={steps} type="button" aria-busy={submitting} disabled={submitting} onClick={() => start(steps)}>
            Start a {steps}-step job
          </button>
        ))}
      </div>
      {error && <p className="error">Could not start the job: {error.message}</p>}
      {jobs.length === 0 && <p className="muted">Start a job, or a few at once.</p>}
      <div className="grid-2">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </main>
  );
};
