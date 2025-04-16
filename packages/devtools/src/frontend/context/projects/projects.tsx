import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDidUpdate, useWillMount } from "@reins/hooks";

import { useSettings } from "frontend/store/app/settings.store";
import { Bridge } from "./bridge/bridge";
import { Events } from "./events/events";
import { State } from "./state/state";
import { useInitializerStore } from "frontend/store/project/initialization.store";
import { useNetworkStatsStore } from "frontend/store/project/network-stats.store";
import { useNetworkStore } from "frontend/store/project/network.store";
import { useCacheStore } from "frontend/store/project/cache.store";
import { useMethodStatsStore } from "frontend/store/project/method-stats.store";
import { useCacheStatsStore } from "frontend/store/project/cache-stats.store";
import { useErrorStatsStore } from "frontend/store/project/error-stats.store";
import { useQueueStore } from "frontend/store/project/queue.store";
import { useProjects } from "frontend/store/project/projects.store";
import { useConnectionStore } from "frontend/store/project/connection.store";

export const ProjectsProvider = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useSettings();
  const { connections } = useConnectionStore();
  const { projects } = useProjects();

  const { initializedProjects, initialize } = useInitializerStore(
    useShallow((state) => ({
      initializedProjects: state.projects,
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

  const initializeProjectStates = useCallback(
    (project: string) => {
      if (initializedProjects[project]) return;

      initializeNetworkStore(project);
      initializeCacheStore(project);
      initializeNetworkStatsStore(project);
      initializeMethodStatsStore(project);
      initializeCacheStatsStore(project);
      initializeErrorStatsStore(project);
      initializeQueueStore(project);
      initialize(project);
    },
    [
      initializedProjects,
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
    Object.keys(projects).forEach((project) => {
      initializeProjectStates(project);
    });
  });

  useDidUpdate(() => {
    Object.keys(projects).forEach((project) => {
      initializeProjectStates(project);
    });
  }, [projects, initializeProjectStates]);

  return (
    <>
      {[1234, ...settings.ports].map((port) => (
        <Bridge key={String(port)} port={port} />
      ))}
      {Object.keys(connections).map((connection) => (
        <Events key={connection} project={connection} />
      ))}
      {Object.keys(connections).map((project) => (
        <State key={project} project={project} />
      ))}
      {children}
    </>
  );
};
