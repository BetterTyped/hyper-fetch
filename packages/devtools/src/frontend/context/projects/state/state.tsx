import { useDidMount } from "@reins/hooks";
import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { NonNullableKeys } from "@hyper-fetch/core";

import { DevtoolsCacheEvent, DevtoolsRequestEvent } from "../types";
import { useConnections } from "../connection/connection";
import { initialProjectState, useProjectStates } from "./state.context";
import { useNetworkStore } from "frontend/store/project/network.store";
import { useErrorStatsStore } from "frontend/store/project/error-stats.store";
import { useCacheStatsStore } from "frontend/store/project/cache-stats.store";
import { useMethodStatsStore } from "frontend/store/project/method-stats.store";
import { useNetworkStatsStore } from "frontend/store/project/network-stats.store";
import { useCacheStore } from "frontend/store/project/cache.store";
import { useQueueStore } from "frontend/store/project/queue.store";

export const State = ({ project }: { project: string }) => {
  const { setProjectStates } = useProjectStates("State");

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
  const { setQueue } = useQueueStore(
    useShallow((selector) => ({
      setQueue: selector.setQueue,
    })),
  );

  const { connections } = useConnections("State");
  const { client } = connections[project as keyof typeof connections];

  const handleCacheChange = useCallback(() => {
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

    setProjectStates((draft) => {
      draft[project].cache = cacheItems;
    });
  }, [client.cache, project, setProjectStates]);

  useEffect(() => {
    const unmountOffline = client.appManager.events.onOffline(() => {
      setProjectStates((draft) => {
        draft[project].isOnline = false;
      });
    });

    const unmountOnline = client.appManager.events.onOnline(() => {
      setProjectStates((draft) => {
        draft[project].isOnline = true;
      });
    });

    const unmountOnRequestStart = client.requestManager.events.onRequestStart((item) => {
      const data: DevtoolsRequestEvent = {
        requestId: item.requestId,
        request: item.request,
        isRemoved: false,
        isCanceled: false,
        isSuccess: false,
        isFinished: false,
        isPaused: false,
      };

      setNetworkRequest({
        project,
        data,
      });

      addLoadingKey({
        project,
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
        request,
        isRemoved: false,
        isCanceled: false,
        isSuccess: !!response.success,
        isFinished: true,
        isPaused: false,
      };

      setNetworkResponse({
        project,
        data,
      });

      setNetworkStats({
        project,
        data,
      });

      setErrorStats({
        project,
        data,
      });

      setCacheStats({
        project,
        request,
        data,
      });

      setMethodStats({
        project,
        data,
      });
    });
    const unmountOnRequestPause = client.requestManager.events.onAbort((item) => {
      const data: DevtoolsRequestEvent = {
        requestId: item.requestId,
        request: item.request,
        isRemoved: false,
        isCanceled: true,
        isSuccess: false,
        isFinished: false,
        isPaused: false,
      };

      setNetworkResponse({
        project,
        data,
      });
    });
    const unmountOnFetchQueueChange = client.fetchDispatcher.events.onQueueChange((data) => {
      if (!data.requests.length) {
        removeLoadingKey({
          project,
          cacheKey: data.queryKey,
        });
      }
      setQueue({
        project,
        data,
      });
    });
    const unmountOnFetchQueueStatusChange = client.fetchDispatcher.events.onQueueStatusChange((data) => {
      setQueue({
        project,
        data,
      });
    });
    const unmountOnSubmitQueueChange = client.submitDispatcher.events.onQueueChange((data) => {
      if (!data.requests.length) {
        removeLoadingKey({
          project,
          cacheKey: data.queryKey,
        });
      }
      setQueue({
        project,
        data,
      });
    });
    const unmountOnSubmitQueueStatusChange = client.submitDispatcher.events.onQueueStatusChange((data) => {
      setQueue({
        project,
        data,
      });
    });
    const unmountOnRemove = client.requestManager.events.onRemove((item) => {
      if (!item.resolved) {
        const data: DevtoolsRequestEvent = {
          requestId: item.requestId,
          request: item.request,
          isRemoved: true,
          isCanceled: false,
          isSuccess: false,
          isFinished: false,
          isPaused: false,
        };

        setNetworkResponse({
          project,
          data,
        });
      }
    });
    const unmountOnCacheChange = client.cache.events.onData((data) => {
      setCache({
        project,
        data,
      });

      // setProjectStates((draft) => {
      //   const { cacheKey, isTriggeredExternally, ...rest } = cacheData;
      //   const changedElement = draft[project].cache.find((cacheElement) => cacheElement.cacheKey === cacheKey);
      //   if (changedElement) {
      //     changedElement.cacheData = cacheData;
      //   } else {
      //     draft[project].cache.push({ cacheKey: cacheData.cacheKey, cacheData: { ...rest, cacheKey } });
      //   }
      // });
    });
    const unmountOnCacheInvalidate = client.cache.events.onInvalidate((cacheKey) => {
      invalidateCache({
        project,
        cacheKey,
      });
    });

    const unmountCacheDelete = client.cache.events.onDelete((cacheKey) => {
      setProjectStates((draft) => {
        const toRemove = draft[project].cache.findIndex((cacheElement) => cacheElement.cacheKey === cacheKey);
        if (toRemove !== -1) {
          draft[project].cache.splice(toRemove, 1);
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
    project,
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
    setProjectStates,
    setQueue,
  ]);

  useDidMount(() => {
    setProjectStates((draft) => {
      draft[project] = initialProjectState;
    });
  });

  return null;
};
