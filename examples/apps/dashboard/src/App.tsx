import { useAppManager } from "@hyper-fetch/react";
import { useState } from "react";

import { client } from "./api/client";
import { getRevenue, setRevenueFailing } from "./api/stats";
import { FetchingBar, OfflineBanner } from "./components/StatusBar";
import { KpiCards } from "./features/kpis/KpiCards";
import { OnlineNow } from "./features/live/OnlineNow";
import { UsersTable } from "./features/users/UsersTable";

const DemoControls = () => {
  const [revenueFailing, setFailing] = useState(false);
  // `setOnline` drives the same state the browser's online and offline events do.
  const { isOnline, setOnline } = useAppManager(client);

  return (
    <div className="controls">
      <label>
        <input
          type="checkbox"
          role="switch"
          checked={revenueFailing}
          onChange={(event) => {
            setFailing(event.target.checked);
            setRevenueFailing(event.target.checked);
            // Marks the revenue stale, so its card fetches it again right away.
            client.cache.invalidate(getRevenue);
          }}
        />
        Break the revenue service
      </label>
      <label>
        <input
          type="checkbox"
          role="switch"
          checked={!isOnline}
          onChange={(event) => setOnline(!event.target.checked)}
        />
        Go offline
      </label>
    </div>
  );
};

export const App = () => (
  <>
    <FetchingBar />
    <main className="container">
      <header className="toolbar">
        <hgroup>
          <h1>Dashboard</h1>
          <p>Every card loads, fails and retries on its own. Break one or go offline to see it.</p>
        </hgroup>
        <DemoControls />
      </header>
      <OfflineBanner />
      <section className="kpis">
        <KpiCards />
        <OnlineNow />
      </section>
      <UsersTable />
    </main>
  </>
);
