import { useDidMount } from "@reins/hooks";
import { useCallback, useEffect } from "react";
import { QueueDataType } from "@hyper-fetch/core";

import { DevtoolsCacheEvent, DevtoolsElement, DevtoolsRequestEvent, DevtoolsRequestResponse } from "../types";
import { useConnections } from "../connection/connection";
import {
  generateEndpointStats,
  generateMethodStats,
  getEndpointStatsKey,
  initialProjectState,
  useProjectStates,
} from "./state.context";
import { useProjects } from "frontend/store/projects.store";

export const State = ({ project }: { project: string }) => {
  const { projects } = useProjects();
  const { setProjectStates } = useProjectStates("State");

  const { connections } = useConnections("State");
  const { client } = connections[project as keyof typeof connections];
  const { settings } = projects[project as keyof typeof projects];

  const updateQueues = (queue: QueueDataType) => {
    const inQueueRequests: DevtoolsElement[] = queue.requests.map((item) => {
      return {
        requestId: item.requestId,
        queryKey: item.request.queryKey,
        cacheKey: item.request.cacheKey,
        abortKey: item.request.abortKey,
      };
    });

    const pausedQueueRequests: DevtoolsElement[] = queue.stopped
      ? inQueueRequests
      : queue.requests
          .filter((item) => item.stopped)
          .map((item) => ({
            requestId: item.requestId,
            queryKey: item.request.queryKey,
            cacheKey: item.request.cacheKey,
            abortKey: item.request.abortKey,
          }));

    setProjectStates((draft) => {
      // Update inProgress
      draft[project].inProgress = [
        ...draft[project].inProgress.filter((el) => el.queryKey !== queue.queryKey),
        ...inQueueRequests,
      ].filter((_, index) => index < settings.maxRequestsHistorySize);

      // Update paused
      draft[project].paused = [
        ...draft[project].paused.filter((el) => el.queryKey !== queue.queryKey),
        ...pausedQueueRequests,
      ].filter((_, index) => index < settings.maxRequestsHistorySize);

      // Update queues
      const currentQueue = draft[project].queues.findIndex((el) => el.queryKey === queue.queryKey);
      if (currentQueue === -1) {
        draft[project].queues.push(queue);
      } else {
        draft[project].queues[currentQueue] = queue;
      }
    });
  };

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

    const unmountOnRequestStart = client.requestManager.events.onRequestStart((details) => {
      setProjectStates((draft) => {
        draft[project].requests = [{ ...details, triggerTimestamp: new Date() }, ...draft[project].requests].filter(
          (_, index) => index < settings.maxRequestsHistorySize,
        ) as DevtoolsRequestEvent[];

        draft[project].loadingKeys = draft[project].loadingKeys.filter((i) => i !== details.request.cacheKey);
      });
    });
    const unmountOnResponse = client.requestManager.events.onResponse(({ response, details, request, requestId }) => {
      const { method, endpoint } = request;
      const methodAndEndpoint = getEndpointStatsKey(request);

      if (details.isCanceled) {
        return;
      }

      setProjectStates((draft) => {
        const requestIndex = draft[project].requests.findIndex((el) => el.requestId === requestId);

        if (requestIndex !== -1) {
          draft[project].requests[requestIndex] = {
            ...draft[project].requests[requestIndex],
            response,
            details,
          } as DevtoolsRequestEvent;
        }

        draft[project].generalStats = generateEndpointStats({
          existingStats: draft[project].generalStats,
          request,
          response,
          details,
        });

        draft[project].endpointsStats[methodAndEndpoint] = {
          ...generateEndpointStats({
            existingStats: draft[project].endpointsStats[methodAndEndpoint],
            request,
            response,
            details,
          }),
          method,
          endpoint,
        };

        draft[project].methodStats[method] = generateMethodStats({
          existingStats: draft[project].methodStats[method],
          request,
          response,
          details,
        });

        if (response.success) {
          draft[project].success = [
            ...draft[project].success,
            { requestId, response, details } satisfies DevtoolsRequestResponse,
          ].filter((_, index) => index < settings.maxRequestsHistorySize);
        } else {
          draft[project].failed = [
            ...draft[project].failed,
            { requestId, response, details } satisfies DevtoolsRequestResponse,
          ].filter((_, index) => index < settings.maxRequestsHistorySize);
        }
      });
    });
    const unmountOnRequestPause = client.requestManager.events.onAbort(({ requestId, request }) => {
      setProjectStates((draft) => {
        draft[project].canceled = [
          { requestId, queryKey: request.queryKey, cacheKey: request.cacheKey, abortKey: request.abortKey },
          ...draft[project].canceled,
        ].filter((_, index) => index < settings.maxRequestsHistorySize);
      });
    });
    const unmountOnFetchQueueChange = client.fetchDispatcher.events.onQueueChange((values) => {
      updateQueues(values);
    });
    const unmountOnFetchQueueStatusChange = client.fetchDispatcher.events.onQueueStatusChange((values) => {
      updateQueues(values);
    });
    const unmountOnSubmitQueueChange = client.submitDispatcher.events.onQueueChange((values) => {
      updateQueues(values);
    });
    const unmountOnSubmitQueueStatusChange = client.submitDispatcher.events.onQueueStatusChange((values) => {
      updateQueues(values);
    });
    const unmountOnRemove = client.requestManager.events.onRemove(({ requestId, request, resolved }) => {
      if (!resolved) {
        setProjectStates((draft) => {
          draft[project].removed = [
            ...draft[project].removed,
            { requestId, queryKey: request.queryKey, cacheKey: request.cacheKey, abortKey: request.abortKey },
          ].filter((_, index) => index < settings.maxRequestsHistorySize);
        });
      }
    });
    const unmountOnCacheChange = client.cache.events.onData((cacheData) => {
      setProjectStates((draft) => {
        const { cacheKey, isTriggeredExternally, ...rest } = cacheData;
        const changedElement = draft[project].cache.find((cacheElement) => cacheElement.cacheKey === cacheKey);
        if (changedElement) {
          changedElement.cacheData = cacheData;
        } else {
          draft[project].cache.push({ cacheKey: cacheData.cacheKey, cacheData: { ...rest, cacheKey } });
        }
      });
    });
    const unmountOnCacheInvalidate = client.cache.events.onInvalidate((cacheKey) => {
      setProjectStates((draft) => {
        const invalidatedElement = draft[project].cache.find((cacheElement) => cacheElement.cacheKey === cacheKey);
        if (invalidatedElement) {
          invalidatedElement.cacheData.staleTime = 0;
        }
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
  }, [client, handleCacheChange, project, setProjectStates]);

  useDidMount(() => {
    setProjectStates((draft) => {
      draft[project] = initialProjectState;
    });
  });

  return null;
};
