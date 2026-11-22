import { useCacheStatsStore } from "./cache-stats.store";
import { useCacheStore } from "./cache.store";
import { useDbStore } from "./db.store";
import { useErrorStatsStore } from "./error-stats.store";
import { useInitializerStore } from "./initialization.store";
import { useMethodStatsStore } from "./method-stats.store";
import { useNetworkStatsStore } from "./network-stats.store";
import { useNetworkStore } from "./network.store";
import { useQueueStatsStore } from "./queue-stats.store";
import { useQueueStore } from "./queue.store";
import { useSocketsStore } from "./sockets.store";

/**
 * Create the per-application state of every store. Runs synchronously, before anything renders the application's
 * pages, and only once per application so reconnecting keeps the collected history.
 */
export const initializeApplicationStores = (application: string) => {
  if (useInitializerStore.getState().applications[application]) {
    return;
  }

  useNetworkStore.getState().initialize(application);
  useCacheStore.getState().initialize(application);
  useNetworkStatsStore.getState().initialize(application);
  useMethodStatsStore.getState().initialize(application);
  useCacheStatsStore.getState().initialize(application);
  useErrorStatsStore.getState().initialize(application);
  useQueueStore.getState().initialize(application);
  useQueueStatsStore.getState().initialize(application);
  useSocketsStore.getState().initialize(application);
  useDbStore.getState().initialize(application);
  useInitializerStore.getState().initialize(application);
};
