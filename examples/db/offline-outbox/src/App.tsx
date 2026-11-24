import type { DbErrorEvent, TransactionRecord } from "@hyper-fetch/db";
import { DependencyError, eq } from "@hyper-fetch/db";
import { useAppManager, useLiveQuery } from "@hyper-fetch/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";

import { client, db, type Project, type Task } from "./db";
import { getServerLog, resetServer, type ServerMode, setServerMode, subscribeToServerLog } from "./server";

/** `inspect()` builds a new object on every call, so the outbox is read once per db change and kept for React. */
let outbox = db.inspect().outbox;
const subscribeToOutbox = (notify: () => void) =>
  db.onChange(() => {
    outbox = db.inspect().outbox;
    notify();
  });
const useOutbox = () => useSyncExternalStore(subscribeToOutbox, () => outbox);

/** One line per write: the row's name for an insert, the key and the changed fields for an update */
const describeWrite = ({ op, collection, key, values }: TransactionRecord) =>
  op === "insert"
    ? `${op} ${collection} "${String(values.name ?? values.title)}"`
    : `${op} ${collection} ${String(key)} ${JSON.stringify(values)}`;

const describeError = ({ error, transaction }: DbErrorEvent) => {
  const reason = error instanceof DependencyError ? "an earlier write it depends on was rejected" : String(error);
  return transaction ? `${describeWrite(transaction)} dropped: ${reason}` : reason;
};

const ProjectCard = ({ project }: { project: Project }) => {
  // The task loader sends no filters, so this filter runs on the loaded tasks without a request.
  const { data: tasks } = useLiveQuery(
    db.task.where((task) => eq(task.projectId, project.id)).orderBy((task) => task.createdAt, "asc"),
  );

  const toggle = (task: Task) => db.task.update(task.id, { done: !task.done });

  return (
    <article>
      <header>
        <strong>{project.name}</strong>
      </header>
      <ul className="tasks">
        {tasks?.map((task) => (
          <li key={db.task.renderKey(task.id)}>
            <label>
              <input type="checkbox" checked={task.done} onChange={() => toggle(task)} />
              <span className={task.done ? "done" : ""}>{task.title}</span>
            </label>
          </li>
        ))}
      </ul>
      {tasks?.length === 0 && <small className="muted">No tasks.</small>}
    </article>
  );
};

export const App = () => {
  const { isOnline, setOnline } = useAppManager(client);
  const [mode, setMode] = useState<ServerMode>("accept");
  const [dropped, setDropped] = useState<string[]>([]);
  const pending = useOutbox();
  const serverLog = useSyncExternalStore(subscribeToServerLog, getServerLog);

  const { data: projects, status, stale } = useLiveQuery(db.project.orderBy((project) => project.createdAt, "asc"));

  // Every rejected write, and every write dropped with it, reaches `db.onError`.
  useEffect(
    () =>
      db.onError((event) => {
        if (event.type !== "mutation") return;
        setDropped((lines) => [describeError(event), ...lines].slice(0, 6));
      }),
    [],
  );

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const title = String(data.get("task") ?? "").trim();
    if (!name) return;
    form.reset();

    // Keys are made on the client, so the task can point at a project the server has not seen yet.
    const projectId = crypto.randomUUID();
    const project = db.project.insert({ id: projectId, name, createdAt: Date.now() });
    if (!title) return;
    // Dropped when the project is rejected, so no task points at a project that never existed.
    db.task.insert(
      { id: crypto.randomUUID(), projectId, title, done: false, createdAt: Date.now() },
      { dependsOn: [project] },
    );
  };

  const handleModeChange = (value: ServerMode) => {
    setMode(value);
    setServerMode(value);
  };

  const handleReset = async () => {
    // Removes the rows, the loaded lists and the outbox of this scope, in memory and in storage
    await db.clear();
    resetServer();
    window.location.reload();
  };

  return (
    <main className="container narrow">
      <hgroup>
        <h1>Projects</h1>
        <p>Go offline and keep working. Writes wait in the outbox, survive a reload and replay in order.</p>
      </hgroup>

      <article>
        <label>
          <input
            type="checkbox"
            role="switch"
            checked={isOnline}
            onChange={(event) => setOnline(event.target.checked)}
          />
          {isOnline ? "Online" : "Offline"}
        </label>
        <div className="toolbar">
          <small className="muted">The server answers</small>
          <div role="group">
            {(
              [
                ["accept", "201 Saved"],
                ["reject", "422 Rejected"],
                ["down", "503 Down"],
              ] as const
            ).map(([value, label]) => (
              <button key={value} className={mode === value ? "" : "outline"} onClick={() => handleModeChange(value)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <small className="muted">
          A 422 drops the write and the writes that depend on it. A 503 is retried with backoff until it succeeds.
        </small>
      </article>

      <form className="add" onSubmit={handleCreate}>
        <input name="name" placeholder="Project name" aria-label="Project name" />
        <input name="task" placeholder="First task" aria-label="First task" />
        <button type="submit">Create</button>
      </form>

      {status === "loading" && <p aria-busy="true">Loading projects...</p>}
      {stale && <p className="muted">Showing saved rows. They refresh once the server answers.</p>}
      {projects?.map((project) => (
        <ProjectCard key={db.project.renderKey(project.id)} project={project} />
      ))}

      <article>
        <header>
          Outbox{" "}
          <small className="muted">
            {pending.length === 0 && "(empty)"}
            {pending.length > 0 &&
              (isOnline ? `(syncing ${pending.length})` : `(${pending.length} waiting for the network)`)}
          </small>
        </header>
        <ul className="log">
          {pending.map((record) => (
            <li key={record.id}>
              {record.sent ? "sent" : "waiting"} · {describeWrite(record)}
              {record.dependsOn.length > 0 && " · depends on an earlier write"}
            </li>
          ))}
        </ul>
        <small className="muted">Reload the page: the rows and the outbox come back from localStorage.</small>
      </article>

      {dropped.length > 0 && (
        <article>
          <header>Dropped writes</header>
          <ul className="log">
            {dropped.map((line, index) => (
              <li key={`${index}-${line}`}>{line}</li>
            ))}
          </ul>
        </article>
      )}

      <article>
        <header>Server log</header>
        {serverLog.length === 0 && <small className="muted">Create a project or check off a task.</small>}
        <ul className="log">
          {serverLog.map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ul>
      </article>

      <button className="secondary outline" onClick={handleReset}>
        Reset the demo
      </button>
    </main>
  );
};
