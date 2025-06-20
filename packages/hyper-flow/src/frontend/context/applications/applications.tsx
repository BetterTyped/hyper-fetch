import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDidUpdate, useWillMount } from "@better-hooks/lifecycle";

import { useSettings } from "@/store/app/settings.store";
import { Bridge } from "./bridge/bridge";
import { Events } from "./events/events";
import { State } from "./state/state";
import { useInitializerStore } from "@/store/applications/initialization.store";
import { useNetworkStatsStore } from "@/store/applications/network-stats.store";
import { useNetworkStore } from "@/store/applications/network.store";
import { useCacheStore } from "@/store/applications/cache.store";
import { useMethodStatsStore } from "@/store/applications/method-stats.store";
import { useCacheStatsStore } from "@/store/applications/cache-stats.store";
import { useErrorStatsStore } from "@/store/applications/error-stats.store";
import { useQueueStore } from "@/store/applications/queue.store";
import { useApplications } from "@/store/applications/apps.store";
import { useConnectionStore } from "@/store/applications/connection.store";

export const ApplicationsProvider = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useSettings();
  const { connections } = useConnectionStore();
  const { applications } = useApplications();

  const { initializedApplications, initialize } = useInitializerStore(
    useShallow((state) => ({
      initializedApplications: state.applications,
      initialize: state.initialize,
    })),
  );
  const { initializeNetworkStore } = useNetworkStore(
    useShallow((selector) => ({ initializeNetworkStore: selector.initialize })),
  );
  const { initializeCacheStore } = useCacheStore(
    useShallow((selector) => ({ initializeCacheStore: selector.initialize })),
  );
  const { initializeNetworkStatsStore } = useNetworkStatsStore(
    useShallow((selector) => ({ initializeNetworkStatsStore: selector.initialize })),
  );
  const { initializeMethodStatsStore } = useMethodStatsStore(
    useShallow((selector) => ({ initializeMethodStatsStore: selector.initialize })),
  );
  const { initializeCacheStatsStore } = useCacheStatsStore(
    useShallow((selector) => ({ initializeCacheStatsStore: selector.initialize })),
  );
  const { initializeErrorStatsStore } = useErrorStatsStore(
    useShallow((selector) => ({ initializeErrorStatsStore: selector.initialize })),
  );
  const { initializeQueueStore } = useQueueStore(
    useShallow((selector) => ({ initializeQueueStore: selector.initialize })),
  );

  const initializeApplicationStates = useCallback(
    (application: string) => {
      if (initializedApplications[application]) return;

      initializeNetworkStore(application);
      initializeCacheStore(application);
      initializeNetworkStatsStore(application);
      initializeMethodStatsStore(application);
      initializeCacheStatsStore(application);
      initializeErrorStatsStore(application);
      initializeQueueStore(application);
      initialize(application);
    },
    [
      initializedApplications,
      initializeCacheStatsStore,
      initializeCacheStore,
      initializeErrorStatsStore,
      initializeMethodStatsStore,
      initializeNetworkStatsStore,
      initializeNetworkStore,
      initializeQueueStore,
      initialize,
    ],
  );

  useWillMount(() => {
    Object.keys(applications).forEach((application) => {
      initializeApplicationStates(application);
    });
  });

  useDidUpdate(() => {
    Object.keys(applications).forEach((application) => {
      initializeApplicationStates(application);
    });
  }, [applications, initializeApplicationStates]);

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
