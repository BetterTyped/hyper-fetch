import { useFetch } from "@hyper-fetch/react";
import { useState } from "react";

import { addUser, client, getSlowUsers, getStatus, getUsers } from "./api";

const slowRequest = getSlowUsers.setQueryParams({ limit: 3, delay: 4000 });

const Users = () => {
  const { data, error, loading, refetch } = useFetch(
    getUsers.setQueryParams({ limit: 5, select: "firstName,lastName,email" }),
  );

  return (
    <article>
      <header className="toolbar">
        <strong>Users</strong>
        <button type="button" className="outline secondary" onClick={refetch} disabled={loading}>
          Refetch
        </button>
      </header>
      {loading && !data && <p aria-busy="true">Loading users...</p>}
      {error && <p className="error">Could not load users: {error.message}</p>}
      <ul>
        {data?.users.map((user) => (
          <li key={user.id}>
            {user.firstName} {user.lastName} <small className="muted">{user.email}</small>
          </li>
        ))}
      </ul>
    </article>
  );
};

export const App = () => {
  const [log, setLog] = useState<string[]>([]);
  const addLog = (entry: string) => setLog((prev) => [entry, ...prev].slice(0, 6));

  // Each action produces something different to look at in HyperFlow.
  const actions = {
    add: async () => {
      const { data, status } = await addUser.send({
        payload: { firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
      });
      addLog(`POST /users/add -> ${status}, created user ${data?.id}`);
    },
    fail: async () => {
      const { error, status } = await getStatus.setParams({ status: 500 }).send();
      addLog(`GET /http/500 -> ${status}, ${error?.message}`);
    },
    slow: async () => {
      addLog("GET /users?delay=4000 sent");
      const { status, error } = await slowRequest.send();
      addLog(`GET /users?delay=4000 -> ${error ? error.message : status}`);
    },
    cancel: () => slowRequest.abort(),
    clearCache: async () => {
      await client.cache.clear();
      addLog("Cache cleared");
    },
  };

  return (
    <main className="container">
      <hgroup>
        <h1>Devtools</h1>
        <p>Open HyperFlow, then use the app. Every request, response and cache change shows up there live.</p>
      </hgroup>
      <div className="grid-2">
        <Users />
        <article>
          <header>
            <strong>Things to inspect</strong>
          </header>
          <div className="actions">
            <button type="button" onClick={actions.add}>
              Add a user
            </button>
            <button type="button" className="secondary" onClick={actions.fail}>
              Fail with 500
            </button>
            <button type="button" className="secondary" onClick={actions.slow}>
              Slow request
            </button>
            <button type="button" className="outline secondary" onClick={actions.cancel}>
              Cancel it
            </button>
            <button type="button" className="outline" onClick={actions.clearCache}>
              Clear cache
            </button>
          </div>
          <ol className="log">
            {log.map((entry, index) => (
              <li key={log.length - index}>{entry}</li>
            ))}
          </ol>
        </article>
      </div>
    </main>
  );
};
