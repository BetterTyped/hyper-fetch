import { useDidMount } from "@reins/hooks";
import { useCallback, useEffect } from "react";
import { QueueDataType, RequestInstance, RequestResponseType, ResponseDetailsType } from "@hyper-fetch/core";

import {
  DevtoolsCacheEvent,
  DevtoolsElement,
  DevtoolsRequestEvent,
  DevtoolsRequestQueueStats,
  DevtoolsRequestResponse,
} from "../types";
import { useConnections } from "../connection/connection";
import { initialProjectState, useProjectStates } from "./state.context";
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

  const handleStats = useCallback(
    (request: RequestInstance, response: RequestResponseType<RequestInstance>, details: ResponseDetailsType) => {
      const key = request.queryKey;

      setProjectStates((draft) => {
        const current: DevtoolsRequestQueueStats = draft[project].stats[key] || {
          total: 0,
          success: 0,
          failed: 0,
          canceled: 0,
          avgTime: 0,
          minTime: 0,
          maxTime: 0,
          lastTime: 0,
          avgQueueTime: 0,
          minQueueTime: 0,
          maxQueueTime: 0,
          lastQueueTime: 0,
          avgProcessingTime: 0,
          minProcessingTime: 0,
          maxProcessingTime: 0,
          lastProcessingTime: 0,
        };

        const reqTime = details.responseTimestamp - response.requestTimestamp;
        const processTime = details.requestTimestamp - details.triggerTimestamp;
        const queueTime = details.triggerTimestamp - details.addedTimestamp;

        const avgTime = current.avgTime ? (current.avgTime + reqTime) / 2 : reqTime;
        const avgProcessingTime = current.avgProcessingTime
          ? (current.avgProcessingTime + processTime) / 2
          : processTime;
        const avgQueueTime = current.avgProcessingTime ? (current.avgProcessingTime + queueTime) / 2 : queueTime;

        draft[project].stats[key] = {
          total: current.total + 1,
          success: response.success ? current.success + 1 : current.success,
          failed: !response.success && !details.isCanceled ? current.failed + 1 : current.failed,
          canceled: details.isCanceled ? current.canceled + 1 : current.canceled,
          avgTime,
          minTime: current.minTime ? Math.min(current.minTime, reqTime) : reqTime,
          maxTime: Math.max(current.maxTime, reqTime),
          lastTime: reqTime,
          avgQueueTime,
          minQueueTime: current.minQueueTime ? Math.min(current.minQueueTime, queueTime) : queueTime,
          maxQueueTime: Math.max(current.maxQueueTime, queueTime),
          lastQueueTime: queueTime,
          avgProcessingTime,
          minProcessingTime: current.minProcessingTime ? Math.min(current.minProcessingTime, processTime) : processTime,
          maxProcessingTime: Math.max(current.maxProcessingTime, processTime),
          lastProcessingTime: processTime,
        };
      });
    },
    [project, setProjectStates],
  );

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
      if (!details.isCanceled) {
        handleStats(request, response, details);
      }

      if (response.success) {
        setProjectStates((draft) => {
          draft[project].success = [
            ...draft[project].success,
            { requestId, response, details } satisfies DevtoolsRequestResponse,
          ].filter((_, index) => index < settings.maxRequestsHistorySize);
        });
      } else if (!details.isCanceled) {
        setProjectStates((draft) => {
          draft[project].failed = [
            ...draft[project].failed,
            { requestId, response, details } satisfies DevtoolsRequestResponse,
          ].filter((_, index) => index < settings.maxRequestsHistorySize);
        });
      }
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
  }, [client, handleCacheChange, handleStats, project, setProjectStates]);

  useDidMount(() => {
    setProjectStates((draft) => {
      draft[project] = initialProjectState;
    });
  });

  return null;
};
