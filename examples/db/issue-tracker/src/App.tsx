import { useLiveQuery } from "@hyper-fetch/react";
import { useEffect, useState } from "react";

import { db, projects, statuses } from "./db";
import { IssueDetail } from "./IssueDetail";
import { type Filters, IssueList, statusLabel } from "./IssueList";
import { resetServer, setServerFailing, simulateTeammate, subscribeToLog } from "./server";

export const App = () => {
  const [filters, setFilters] = useState<Filters>({ projectId: "web", status: "todo", assignee: "anyone", search: "" });
  const [selectedId, setSelectedId] = useState<string>();
  const [fail, setFail] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  // The team, for the assignee filter
  const { data: users } = useLiveQuery(db.user.orderBy((user) => user.name));

  useEffect(
    () =>
      subscribeToLog((line) =>
        setLog((lines) => [`${new Date().toLocaleTimeString()} ${line}`, ...lines].slice(0, 12)),
      ),
    [],
  );

  const setFilter = (changes: Partial<Filters>) => setFilters((current) => ({ ...current, ...changes }));

  const handleFailChange = (checked: boolean) => {
    setFail(checked);
    setServerFailing(checked);
  };

  const handleReset = () => {
    resetServer();
    window.location.reload();
  };

  return (
    <main className="container">
      <hgroup>
        <h1>Issue tracker</h1>
        <p>
          Status and project are sent to the server. Assignee and search run on the rows already loaded. Open this page
          in a second tab to see changes arrive live.
        </p>
      </hgroup>

      <div className="toolbar">
        <label>
          <input
            type="checkbox"
            role="switch"
            checked={fail}
            onChange={(event) => handleFailChange(event.target.checked)}
          />
          Make writes fail
        </label>
        <div>
          <button onClick={() => simulateTeammate(filters.projectId)}>Simulate a teammate</button>{" "}
          <button className="secondary outline" onClick={handleReset}>
            Reset data
          </button>
        </div>
      </div>

      <div className="filters">
        <select
          aria-label="Project"
          value={filters.projectId}
          onChange={(event) => setFilter({ projectId: event.target.value })}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <div role="group">
          {(["all", ...statuses] as const).map((status) => (
            <button
              key={status}
              className={filters.status === status ? "" : "outline"}
              onClick={() => setFilter({ status })}
            >
              {status === "all" ? "All" : statusLabel(status)}
            </button>
          ))}
        </div>
        <select
          aria-label="Assignee"
          value={filters.assignee}
          onChange={(event) => setFilter({ assignee: event.target.value })}
        >
          <option value="anyone">Any assignee</option>
          <option value="unassigned">Unassigned</option>
          {users?.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <input
          type="search"
          aria-label="Search titles"
          placeholder="Search titles"
          value={filters.search}
          onChange={(event) => setFilter({ search: event.target.value })}
        />
      </div>

      <div className="layout">
        <IssueList filters={filters} selectedId={selectedId} onSelect={setSelectedId} />
        <aside>
          {selectedId ? (
            <IssueDetail key={selectedId} issueId={selectedId} onClose={() => setSelectedId(undefined)} />
          ) : (
            <article className="muted">Pick an issue to open it.</article>
          )}
          <article>
            <header>Server log</header>
            {log.length === 0 && <small className="muted">Requests and events show here.</small>}
            <ul className="log">
              {log.map((line, index) => (
                <li key={`${index}-${line}`}>{line}</li>
              ))}
            </ul>
          </article>
        </aside>
      </div>
    </main>
  );
};
