import { useDidMount } from "@better-hooks/lifecycle";
import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { NonNullableKeys, RequestInstance, RequestJSON } from "@hyper-fetch/core";

import { initialApplicationState, useApplicationStates } from "./state.context";

import { DevtoolsCacheEvent, DevtoolsRequestEvent } from "@/context/applications/types";
import { useNetworkStore } from "@/store/applications/network.store";
import { useErrorStatsStore } from "@/store/applications/error-stats.store";
import { useCacheStatsStore } from "@/store/applications/cache-stats.store";
import { useMethodStatsStore } from "@/store/applications/method-stats.store";
import { useNetworkStatsStore } from "@/store/applications/network-stats.store";
import { useCacheStore } from "@/store/applications/cache.store";
import { useQueueStore } from "@/store/applications/queue.store";
import { useQueueStatsStore } from "@/store/applications/queue-stats.store";
import { useConnectionStore } from "@/store/applications/connection.store";

export const State = ({ application }: { application: string }) => {
  const { setApplicationStates } = useApplicationStates("State");

  const { setNetworkRequest, setNetworkResponse } = useNetworkStore(
    useShallow((selector) => ({
      setNetworkRequest: selector.setNetworkRequest,
      setNetworkResponse: selector.setNetworkResponse,
    })),
  );
  const { setCache, invalidateCache, addLoadingKey, removeLoadingKey } = useCacheStore(
    useShallow((selector) => ({
      setCache: selector.setCache,
      invalidateCache: selector.invalidateCache,
      addLoadingKey: selector.addLoadingKey,
      removeLoadingKey: selector.removeLoadingKey,
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

  const { setQueue } = useQueueStore(
    useShallow((selector) => ({
      setQueue: selector.setQueue,
    })),
  );

  const { connections } = useConnectionStore();
  const { client } = connections[application as keyof typeof connections];

  const handleCacheChange = useCallback(() => {
    if (!client?.cache) {
      return;
    }

    const cacheKeys = [...client.cache.storage.keys()];
    const cacheItems = cacheKeys
      .map((key) => {
        const data = client.cache.get(key);
        return {
          cacheKey: key,
          cacheData: data,
        };
      })
      .filter(({ cacheData }) => !!cacheData) as DevtoolsCacheEvent[];

    setApplicationStates((draft) => {
      draft[application].cache = cacheItems;
    });
  }, [client?.cache, application, setApplicationStates]);

  useEffect(() => {
    if (!client) {
      return;
    }

    const unmountOffline = client.appManager.events.onOffline(() => {
      setApplicationStates((draft) => {
        draft[application].isOnline = false;
      });
    });

    const unmountOnline = client.appManager.events.onOnline(() => {
      setApplicationStates((draft) => {
        draft[application].isOnline = true;
      });
    });

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
        // TODO: use request start time for every timestamp
        timestamp: Date.now(),
      };

      setNetworkRequest({
        application,
        data,
      });

      addLoadingKey({
        application,
        cacheKey: item.request.cacheKey,
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
    const unmountOnRequestPause = client.requestManager.events.onAbort((item) => {
      const data: DevtoolsRequestEvent = {
        requestId: item.requestId,
        request: item.request as unknown as RequestJSON<RequestInstance>,
        client,
        isRemoved: false,
        isCanceled: true,
        isSuccess: false,
        isFinished: false,
        isPaused: false,
        timestamp: Date.now(),
      };

      setNetworkResponse({
        application,
        data,
      });
    });
    const unmountOnFetchQueueChange = client.fetchDispatcher.events.onQueueChange((data) => {
      if (!data.requests.length) {
        removeLoadingKey({
          application,
          cacheKey: data.queryKey,
        });
      }
      setQueue({
        application,
        data,
      });
    });
    const unmountOnFetchQueueStatusChange = client.fetchDispatcher.events.onQueueStatusChange((data) => {
      setQueue({
        application,
        data,
      });
    });
    const unmountOnSubmitQueueChange = client.submitDispatcher.events.onQueueChange((data) => {
      if (!data.requests.length) {
        removeLoadingKey({
          application,
          cacheKey: data.queryKey,
        });
      }
      setQueue({
        application,
        data,
      });
    });
    const unmountOnSubmitQueueStatusChange = client.submitDispatcher.events.onQueueStatusChange((data) => {
      setQueue({
        application,
        data,
      });
    });
    const unmountOnRemove = client.requestManager.events.onRemove((item) => {
      if (!item.resolved) {
        const data: DevtoolsRequestEvent = {
          requestId: item.requestId,
          request: item.request as unknown as RequestJSON<RequestInstance>,
          client,
          isRemoved: true,
          isCanceled: false,
          isSuccess: false,
          isFinished: false,
          isPaused: false,
          timestamp: Date.now(),
        };

        setNetworkResponse({
          application,
          data,
        });
      }
    });
    const unmountOnCacheChange = client.cache.events.onData((data, isTriggeredExternally) => {
      console.log("DATA DATA", data, isTriggeredExternally);
      if (data.cached) {
        setCache({
          application,
          data: { ...data, isTriggeredExternally: !!isTriggeredExternally },
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
      setApplicationStates((draft) => {
        const toRemove = draft[application].cache.findIndex((cacheElement) => cacheElement.cacheKey === cacheKey);
        if (toRemove !== -1) {
          draft[application].cache.splice(toRemove, 1);
        }
      });
    });

    return () => {
      unmountOffline();
      unmountOnline();
      unmountOnResponse();
      unmountOnRequestStart();
      unmountOnRequestPause();
      unmountOnFetchQueueChange();
      unmountOnFetchQueueStatusChange();
      unmountOnSubmitQueueChange();
      unmountOnSubmitQueueStatusChange();
      unmountOnRemove();
      unmountOnCacheChange();
      unmountOnCacheInvalidate();
      unmountCacheDelete();
    };
  }, [
    client,
    application,
    addLoadingKey,
    handleCacheChange,
    invalidateCache,
    removeLoadingKey,
    setCache,
    setCacheStats,
    setErrorStats,
    setMethodStats,
    setNetworkRequest,
    setNetworkResponse,
    setNetworkStats,
    setApplicationStates,
    setQueue,
    setQueueStats,
  ]);

  useDidMount(() => {
    setApplicationStates((draft) => {
      draft[application] = initialApplicationState;
    });
  });

  return null;
};
