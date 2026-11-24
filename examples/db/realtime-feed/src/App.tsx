import { eq } from "@hyper-fetch/db";
import { useLiveQuery } from "@hyper-fetch/react";
import { useState } from "react";

import { db, type Post, socket } from "./db";
import { setServerFailing, simulateDelete, simulateNewPost, simulateRename } from "./server";

const teams = [
  { id: "design", name: "Design" },
  { id: "platform", name: "Platform" },
];

/** Each team is its own query. Queries are compared by structure, so switching teams needs no dependency array. */
const queryFor = (teamId: string) =>
  db.post.where((post) => eq(post.teamId, teamId)).orderBy((post) => post.createdAt, "desc");

const timeAgo = (timestamp: number) => {
  const minutes = Math.round((Date.now() - timestamp) / 60_000);
  return minutes < 1 ? "just now" : `${minutes} min ago`;
};

export const App = () => {
  const [teamId, setTeamId] = useState(teams[0].id);
  const [fail, setFail] = useState(false);
  const [connected, setConnected] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const addLog = (line: string) =>
    setLog((lines) => [`${new Date().toLocaleTimeString()} ${line}`, ...lines].slice(0, 6));

  const query = queryFor(teamId);
  // `stale` turns on when the socket drops and off once the reconnect refetch is back.
  const { data, status, stale } = useLiveQuery(query);

  // Writes resolve with the result and never throw. On failure the db has already reverted the change.
  const like = async (post: Post) => {
    const { success } = await db.post.update(post.id, { likes: post.likes + 1 });
    addLog(success ? `Like "${post.title}": saved` : `Like "${post.title}": failed, reverted`);
  };

  const handleFailChange = (checked: boolean) => {
    setFail(checked);
    setServerFailing(checked);
  };

  const toggleConnection = async () => {
    if (connected) {
      await socket.disconnect();
      addLog("Socket disconnected");
    } else {
      await socket.connect();
      addLog("Socket connected, refetching what it missed");
    }
    setConnected(!connected);
  };

  const simulate = (label: string, action: (teamId: string) => void) => {
    action(teamId);
    addLog(`Another user: ${label}`);
  };

  return (
    <main className="container narrow">
      <hgroup>
        <h1>Team feed</h1>
        <p>Posts load once. Socket events add, change and remove them without a refetch.</p>
      </hgroup>

      <div className="toolbar">
        <div role="group">
          {teams.map((team) => (
            <button key={team.id} className={team.id === teamId ? "" : "outline"} onClick={() => setTeamId(team.id)}>
              {team.name}
            </button>
          ))}
        </div>
        <span className={stale ? "badge stale" : "badge live"}>{stale ? "Reconnecting..." : "Live"}</span>
      </div>

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
        <button className="secondary outline" onClick={toggleConnection}>
          {connected ? "Disconnect socket" : "Reconnect socket"}
        </button>
      </div>

      {status === "loading" && <p aria-busy="true">Loading posts...</p>}
      {status === "error" && <p>Could not load the posts.</p>}

      <ul className="posts">
        {data?.map((post) => (
          <li key={post.id}>
            <div>
              <strong>{post.title}</strong>
              <br />
              <small className="muted">
                {post.author}, {timeAgo(post.createdAt)}
              </small>
            </div>
            <button className="outline" aria-label={`Like ${post.title}`} onClick={() => like(post)}>
              ♥ {post.likes}
            </button>
          </li>
        ))}
      </ul>
      {status === "ready" && data?.length === 0 && <p className="muted">No posts in this team.</p>}

      <article>
        <header>Simulate another user</header>
        <p className="muted">
          The server changes its data and publishes a socket event. Open this page in a second tab to see both update.
        </p>
        <div className="actions">
          <button onClick={() => simulate("new post", simulateNewPost)}>New post</button>
          <button className="secondary" onClick={() => simulate("renamed the top post", simulateRename)}>
            Rename top post
          </button>
          <button className="secondary" onClick={() => simulate("deleted the top post", simulateDelete)}>
            Delete top post
          </button>
        </div>
      </article>

      <details>
        <summary>Syncs for this query</summary>
        <pre>{JSON.stringify(query.explain().syncs, null, 2)}</pre>
      </details>

      <article>
        <header>Log</header>
        {log.length === 0 && <small className="muted">Like a post or simulate another user.</small>}
        <ul className="log">
          {log.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </article>
    </main>
  );
};
