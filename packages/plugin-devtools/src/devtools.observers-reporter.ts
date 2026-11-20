import type { CacheValueType, ClientInstance, QueueDataType } from "@hyper-fetch/core";
import {
  getCacheByKey,
  getCacheKey,
  getDispatcherChangeByKey,
  getDispatcherChangeKey,
  getLoadingByQueryKey,
} from "@hyper-fetch/core";

import type { DevtoolsObserversEventData } from "./types/events.types";

type Report = (data: DevtoolsObserversEventData) => void;

/**
 * Reports how many observers the application has for every cache key and query key HyperFlow shows. A key is tracked
 * from its first cache data or queue change - the events HyperFlow lists it from - and its counts are reported on every
 * change from then on.
 * Returns the snapshot to send whenever HyperFlow connects, and the cleanup.
 */
export const createObserversReporter = ({ client, report }: { client: ClientInstance; report: Report }) => {
  const { cache, requestManager, fetchDispatcher, submitDispatcher } = client;
  const dispatchers = [fetchDispatcher, submitDispatcher];
  /** Cleanups of the tracked keys */
  const cacheKeys = new Map<string, VoidFunction>();
  const queryKeys = new Map<string, VoidFunction>();

  const countCache = (cacheKey: string) => cache.emitter.listenerCount(getCacheByKey(cacheKey));
  const countQueue = (queryKey: string) =>
    requestManager.emitter.listenerCount(getLoadingByQueryKey(queryKey)) +
    dispatchers.reduce(
      (count, dispatcher) => count + dispatcher.emitter.listenerCount(getDispatcherChangeByKey(queryKey)),
      0,
    );

  const reportCache = (cacheKey: string) => report({ cache: { [cacheKey]: countCache(cacheKey) }, queues: {} });
  const reportQueue = (queryKey: string) => report({ cache: {}, queues: { [queryKey]: countQueue(queryKey) } });

  /** Starts following the observers of the key, returns false when they are already followed */
  const trackCacheKey = (cacheKey: string) => {
    if (cacheKeys.has(cacheKey)) {
      return false;
    }
    cacheKeys.set(
      cacheKey,
      cache.emitter.onListener(getCacheByKey(cacheKey), () => reportCache(cacheKey)),
    );
    return true;
  };

  /** Starts following the observers of the key, returns false when they are already followed */
  const trackQueryKey = (queryKey: string) => {
    if (queryKeys.has(queryKey)) {
      return false;
    }
    const unmounts = [
      requestManager.emitter.onListener(getLoadingByQueryKey(queryKey), () => reportQueue(queryKey)),
      ...dispatchers.map((dispatcher) =>
        dispatcher.emitter.onListener(getDispatcherChangeByKey(queryKey), () => reportQueue(queryKey)),
      ),
    ];
    queryKeys.set(queryKey, () => unmounts.forEach((unmount) => unmount()));
    return true;
  };

  const unmounts = [
    cache.emitter.onEmit((eventName, data: CacheValueType) => {
      // The observers subscribed before the key got its first data
      if (eventName === getCacheKey() && trackCacheKey(data.cacheKey)) {
        reportCache(data.cacheKey);
      }
    }),
    ...dispatchers.map((dispatcher) =>
      dispatcher.emitter.onEmit((eventName, data: QueueDataType) => {
        // The observers subscribed before the first request of the key
        if (eventName === getDispatcherChangeKey() && trackQueryKey(data.queryKey)) {
          reportQueue(data.queryKey);
        }
      }),
    ),
  ];

  return {
    /** Tells HyperFlow the observers of every key the application has */
    sendSnapshot: () => {
      const data: DevtoolsObserversEventData = { cache: {}, queues: {} };
      cacheKeys.forEach((_, cacheKey) => {
        data.cache[cacheKey] = countCache(cacheKey);
      });
      queryKeys.forEach((_, queryKey) => {
        data.queues[queryKey] = countQueue(queryKey);
      });
      report(data);
    },
    unmount: () => {
      unmounts.forEach((unmount) => unmount());
      cacheKeys.forEach((unmount) => unmount());
      queryKeys.forEach((unmount) => unmount());
      cacheKeys.clear();
      queryKeys.clear();
    },
  };
};
