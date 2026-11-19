import type { NonNullableKeys, QueueDataType, RequestInstance, RequestJSON } from "@hyper-fetch/core";
import { memo, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

import type { DevtoolsRequestEvent } from "@/context/applications/types";
import { useCacheStatsStore } from "@/store/applications/cache-stats.store";
import { useCacheStore } from "@/store/applications/cache.store";
import { useConnectionStore } from "@/store/applications/connection.store";
import { useErrorStatsStore } from "@/store/applications/error-stats.store";
import { useMethodStatsStore } from "@/store/applications/method-stats.store";
import { useNetworkStatsStore } from "@/store/applications/network-stats.store";
import { useNetworkStore } from "@/store/applications/network.store";
import { useQueueStatsStore } from "@/store/applications/queue-stats.store";
import { useQueueStore } from "@/store/applications/queue.store";

export const State = memo(({ application }: { application: string }) => {
  const { setNetworkRequest, setNetworkResponse, updateNetworkRequest, setPausedRequests } = useNetworkStore(
    useShallow((selector) => ({
      setNetworkRequest: selector.setNetworkRequest,
      setPausedRequests: selector.setPausedRequests,
      setNetworkResponse: selector.setNetworkResponse,
      updateNetworkRequest: selector.updateNetworkRequest,
    })),
  );
  const { setCache, invalidateCache, removeCache } = useCacheStore(
    useShallow((selector) => ({
      setCache: selector.setCache,
      invalidateCache: selector.invalidateCache,
      removeCache: selector.removeCache,
    })),
  );
  const { setNetworkStats } = useNetworkStatsStore(
    useShallow((selector) => ({
      setNetworkStats: selector.setNetworkStats,
    })),
  );
  const { setMethodStats } = useMethodStatsStore(
    useShallow((selector) => ({
      setMethodStats: selector.setMethodStats,
    })),
  );
  const { setCacheStats } = useCacheStatsStore(
    useShallow((selector) => ({
      setCacheStats: selector.setCacheStats,
    })),
  );
  const { setErrorStats } = useErrorStatsStore(
    useShallow((selector) => ({
      setErrorStats: selector.setErrorStats,
    })),
  );

  const { setQueueStats } = useQueueStatsStore(
    useShallow((selector) => ({
      setQueueStats: selector.setQueueStats,
    })),
  );

  const { setQueue, addLoadingKey, removeLoadingKey } = useQueueStore(
    useShallow((selector) => ({
      setQueue: selector.setQueue,
      addLoadingKey: selector.addLoadingKey,
      removeLoadingKey: selector.removeLoadingKey,
    })),
  );

  const { connections } = useConnectionStore();
  const { client } = connections[application as keyof typeof connections];

  useEffect(() => {
    if (!client) {
      return;
    }

    const unmountOnRequestStart = client.requestManager.events.onRequestStart((item) => {
      const data: DevtoolsRequestEvent = {
        requestId: item.requestId,
        request: item.request as unknown as RequestJSON<RequestInstance>,
        client,
        isRemoved: false,
        isCanceled: false,
        isSuccess: false,
        isFinished: false,
        isPaused: false,
        timestamp: Date.now(),
      };

      setNetworkRequest({
        application,
        data,
      });

      addLoadingKey({
        application,
        queryKey: item.request.queryKey,
      });
    });

    const unmountOnResponse = client.requestManager.events.onResponse(({ response, details, request, requestId }) => {
      if (details.isCanceled) {
        return;
      }

      const data: NonNullableKeys<DevtoolsRequestEvent> = {
        requestId,
        response,
        details,
        request: request as unknown as RequestJSON<RequestInstance>,
        client,
        isRemoved: false,
        isCanceled: false,
        isSuccess: !!response.success,
        isFinished: true,
        isPaused: false,
        timestamp: Date.now(),
      };

      setNetworkResponse({
        application,
        data,
      });

      setNetworkStats({
        application,
        data,
      });

      setCacheStats({
        application,
        data,
      });

      setMethodStats({
        application,
        data,
      });

      setQueueStats({
        application,
        data,
      });

      if (!response.success) {
        setErrorStats({
          application,
          data,
        });
      }
    });
    // Core emits abort, then a canceled response, then removes the request from its queue
    const unmountOnRequestPause = client.requestManager.events.onAbort((item) => {
      updateNetworkRequest({
        application,
        requestId: item.requestId,
        update: { isCanceled: true, timestamp: Date.now() },
      });
    });
    /**
     * Requests are listed once they are queued, so the ones waiting in a stopped queue are visible too,
     * and follow the paused state of their queue.
     */
    const syncQueuedRequests = (data: QueueDataType<RequestInstance>) => {
      const listed = new Set(
        (useNetworkStore.getState().applications[application]?.requests ?? []).map((request) => request.requestId),
      );
      data.requests
        .filter((item) => !listed.has(item.requestId))
        .forEach((item) => {
          setNetworkRequest({
            application,
            data: {
              requestId: item.requestId,
              request: item.request as unknown as RequestJSON<RequestInstance>,
              client,
              isRemoved: false,
              isCanceled: false,
              isSuccess: false,
              isFinished: false,
              isPaused: data.stopped || item.stopped,
              timestamp: Date.now(),
            },
          });
        });
      setPausedRequests({
        application,
        requestIds: data.requests.filter((item) => data.stopped || item.stopped).map((item) => item.requestId),
        paused: true,
      });
      setPausedRequests({
        application,
        requestIds: data.requests.filter((item) => !data.stopped && !item.stopped).map((item) => item.requestId),
        paused: false,
      });
    };
    const unmountOnFetchQueueChange = client.fetchDispatcher.events.onQueueChange((data) => {
      syncQueuedRequests(data);
      if (data.requests.length === 0) {
        removeLoadingKey({
          application,
          queryKey: data.queryKey,
        });
      }
      setQueue({
        application,
        data,
      });
    });
    const unmountOnFetchQueueStatusChange = client.fetchDispatcher.events.onQueueStatusChange((data) => {
      syncQueuedRequests(data);
      setQueue({
        application,
        data,
      });
    });
    const unmountOnFetchQueueClear = client.fetchDispatcher.events.onDrained((data) => {
      setQueue({
        application,
        data,
      });
    });
    const unmountOnSubmitQueueChange = client.submitDispatcher.events.onQueueChange((data) => {
      syncQueuedRequests(data);
      if (data.requests.length === 0) {
        removeLoadingKey({
          application,
          queryKey: data.queryKey,
        });
      }
      setQueue({
        application,
        data,
      });
    });
    const unmountOnSubmitQueueStatusChange = client.submitDispatcher.events.onQueueStatusChange((data) => {
      syncQueuedRequests(data);
      setQueue({
        application,
        data,
      });
    });
    const unmountOnSubmitQueueClear = client.submitDispatcher.events.onDrained((data) => {
      setQueue({
        application,
        data,
      });
    });
    const unmountOnRemove = client.requestManager.events.onRemove((item) => {
      if (!item.resolved) {
        updateNetworkRequest({
          application,
          requestId: item.requestId,
          update: { isRemoved: true, timestamp: Date.now() },
        });
      }
    });
    const unmountOnCacheChange = client.cache.events.onData((data, isTriggeredExternally?: boolean) => {
      if (data.cached) {
        setCache({
          application,
          data,
          isTriggeredExternally: !!isTriggeredExternally,
        });
      }
    });
    const unmountOnCacheInvalidate = client.cache.events.onInvalidate((cacheKey) => {
      invalidateCache({
        application,
        cacheKey,
      });
    });

    const unmountCacheDelete = client.cache.events.onDelete((cacheKey) => {
      removeCache({
        application,
        cacheKey,
      });
    });

    return () => {
      unmountOnResponse();
      unmountOnRequestStart();
      unmountOnRequestPause();
      unmountOnFetchQueueChange();
      unmountOnFetchQueueStatusChange();
      unmountOnFetchQueueClear();
      unmountOnSubmitQueueChange();
      unmountOnSubmitQueueStatusChange();
      unmountOnSubmitQueueClear();
      unmountOnRemove();
      unmountOnCacheChange();
      unmountOnCacheInvalidate();
      unmountCacheDelete();
    };
  }, [
    client,
    application,
    addLoadingKey,
    invalidateCache,
    removeCache,
    removeLoadingKey,
    setCache,
    setCacheStats,
    setErrorStats,
    setMethodStats,
    setNetworkRequest,
    setNetworkResponse,
    setNetworkStats,
    setPausedRequests,
    updateNetworkRequest,
    setQueue,
    setQueueStats,
  ]);

  return null;
});
