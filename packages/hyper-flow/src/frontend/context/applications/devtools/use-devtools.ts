import type { ClientInstance } from "@hyper-fetch/core";
import { useParams } from "@tanstack/react-router";
import { useMemo } from "react";

import { createMirrorClient } from "@/context/applications/bridge/mirror-client";
import type { Application } from "@/store/applications/apps.store";
import { useApplications } from "@/store/applications/apps.store";
import { useConnectionStore } from "@/store/applications/connection.store";

/** One client per offline application, shared by every component that presents it */
const offlineClients = new Map<string, ClientInstance>();

const getOfflineClient = (url: string, adapterName: string | undefined) => {
  const key = `${adapterName ?? ""}|${url}`;
  let client = offlineClients.get(key);
  if (!client) {
    client = createMirrorClient({ clientOptions: { url }, adapterOptions: { name: adapterName } });
    offlineClients.set(key, client);
  }
  return client;
};

/**
 * The application of the current route and its mirror client.
 * Application pages render only once the application is known (see `ApplicationLayout`).
 */
export const useDevtools = (): { client: ClientInstance; application: Application } => {
  const { applicationName = "" } = useParams({ strict: false });
  const application = useApplications((state) => state.applications[applicationName]);
  const connection = useConnectionStore((state) => state.connections[applicationName]);

  const client = useMemo(() => {
    if (connection) {
      return connection.client;
    }
    // Known from a previous session, but not connected now
    return getOfflineClient(application?.url ?? "", application?.adapterName);
  }, [connection, application?.url, application?.adapterName]);

  return {
    client,
    application,
  };
};
