import { useState } from "react";

import { getCards } from "./api/cards";
import { client } from "./api/client";
import { resetServer, setServerFailing } from "./api/mock-server";
// Side effect: shares cache changes with the other tabs over a BroadcastChannel.
import "./api/tab-sync";
import { SyncStatus } from "./components/SyncStatus";
import { Board } from "./features/board/Board";

export const App = () => {
  const [failing, setFailing] = useState(false);

  const handleFailingChange = (checked: boolean) => {
    setFailing(checked);
    setServerFailing(checked);
  };

  const handleReset = () => {
    resetServer();
    // Marks the board stale, so `useFetch` loads it again from the server.
    client.cache.invalidate(getCards);
  };

  return (
    <main className="container-fluid">
      <hgroup>
        <h1>Kanban</h1>
        <p>
          Drag cards between columns. Changes show up at once and save in the background. Open a{" "}
          <a href={window.location.href} target="_blank" rel="noreferrer">
            second tab
          </a>{" "}
          to see them sync.
        </p>
      </hgroup>
      <div className="toolbar">
        <label>
          <input
            type="checkbox"
            role="switch"
            checked={failing}
            onChange={(event) => handleFailingChange(event.target.checked)}
          />
          Make the server fail
        </label>
        <button type="button" className="secondary outline" onClick={handleReset}>
          Reset board
        </button>
      </div>
      <div className="layout">
        <Board />
        <SyncStatus />
      </div>
    </main>
  );
};
