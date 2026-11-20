import { useMemo } from "react";

import { Bridge } from "./bridge/bridge";
import { Events } from "./events/events";
import { State } from "./state/state";
import { useApplications } from "@/store/applications/apps.store";
import { useConnectionStore } from "@/store/applications/connection.store";
import { initializeApplicationStores } from "@/store/applications/initialize";
import { useSettings } from "@/store/general/settings.store";

export const ApplicationsProvider = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useSettings();
  const { connections } = useConnectionStore();
  const { applications } = useApplications();

  // Persisted applications get their state before their pages render; connecting ones get it in the bridge
  useMemo(() => {
    Object.keys(applications).forEach(initializeApplicationStores);
  }, [applications]);

  return (
    <>
      <Bridge key={String(settings.serverPort)} port={settings.serverPort} />
      {Object.entries(connections)
        .filter(([, connection]) => connection.connected)
        .map(([connectionName]) => (
          <Events key={connectionName} application={connectionName} />
        ))}
      {Object.keys(connections).map((application) => (
        <State key={application} application={application} />
      ))}
      {children}
    </>
  );
};
