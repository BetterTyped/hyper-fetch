import { useCallback, useEffect, useState } from "react";
import {
  ClientInstance,
  QueueDataType,
  RequestInstance,
  RequestResponseType,
  ResponseDetailsType,
} from "@hyper-fetch/core";
import { css } from "goober";
import { Size } from "re-resizable";
import { useImmer } from "use-immer";
import { setAutoFreeze } from "immer";

import { DevtoolsProvider, Sort, useDevtoolsWorkspaces } from "frontend/pages/_root/devtools.context";
import {
  DevtoolsCacheEvent,
  DevtoolsModule,
  DevtoolsElement,
  DevtoolsRequestEvent,
  DevtoolsRequestQueueStats,
  DevtoolsRequestResponse,
} from "frontend/pages/_root/devtools.types";
import { Status } from "frontend/utils/request.status.utils";
import { DevtoolsToggle } from "frontend/components/devtools-toggle/devtools-toggle";
import { Network } from "frontend/pages/network/network";
import { DevtoolsDataProvider } from "frontend/pages/explorer/list/content.state";
import { DevtoolsExplorerRequest } from "frontend/pages/explorer/list/content.types";
import { Application } from "frontend/components/app/app";
import { Explorer } from "frontend/pages/explorer/explorer";
import { Queues } from "frontend/pages/queues/queues";
import { Cache } from "frontend/pages/cache/cache";
import { Workspace } from "frontend/pages/workspace/workspace";

const Modules = {
  [DevtoolsModule.WORKSPACE]: Workspace,
  [DevtoolsModule.NETWORK]: Network,
  [DevtoolsModule.CACHE]: Cache,
  [DevtoolsModule.QUEUES]: Queues,
  [DevtoolsModule.EXPLORER]: Explorer,
};

export type DevtoolsProps<T extends ClientInstance> = {
  client: T;
  initiallyOpen?: boolean;
  initialTheme?: "light" | "dark";
  initialPosition?: "Top" | "Left" | "Right" | "Bottom";
  simulatedError?: any;
  workspace?: string;
  /**
   * Max size of stored elements (requests, responses, events)
   */
  dataMaxSize?: number;
};

export const Devtools = <T extends ClientInstance>({
  client,
  initialTheme = "dark",
  initiallyOpen = false,
  initialPosition = "Right",
  simulatedError = new Error("This is error simulated by HyperFetch Devtools"),
  workspace,
  dataMaxSize = 10000,
}: DevtoolsProps<T>) => {
  setAutoFreeze(false);
  const [open, setOpen] = useState(initiallyOpen);
  const [module, setModule] = useState(DevtoolsModule.NETWORK);
  const [theme, setTheme] = useState<"light" | "dark">(initialTheme);
  const [isOnline, setIsOnline] = useState(client.appManager.isOnline);
  const [position, setPosition] = useState<"Top" | "Left" | "Right" | "Bottom">(initialPosition);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  const { workspaces, activeWorkspace } = useDevtoolsWorkspaces("Devtools");

  const Module = Modules[module];

  // Network
  const [networkSearchTerm, setNetworkSearchTerm] = useState("");
  const [networkSort, setNetworkSort] = useState<Sort | null>(null);
  const [requests, setRequests] = useState<DevtoolsRequestEvent[]>([] as unknown as DevtoolsRequestEvent[]);
  const [success, setSuccess] = useState<DevtoolsRequestResponse[]>([]);
  const [failed, setFailed] = useState<DevtoolsRequestResponse[]>([]);
  const [removed, setRemoved] = useState<DevtoolsElement[]>([]);
  const [inProgress, setInProgress] = useImmer<DevtoolsElement[]>([]);
  const [paused, setPaused] = useImmer<DevtoolsElement[]>([]);
  const [canceled, setCanceled] = useImmer<DevtoolsElement[]>([]);
  const [detailsRequestId, setDetailsRequestId] = useState<string | null>(null);
  const [networkFilter, setNetworkFilter] = useState<Status | null>(null);
  // Cache
  const [cacheSearchTerm, setCacheSearchTerm] = useState("");
  const [cacheSort, setCacheSort] = useState<Sort | null>(null);
  const [cache, setCache] = useImmer<DevtoolsCacheEvent[]>([]);
  const [detailsCacheKey, setDetailsCacheKey] = useState<string | null>(null);
  const [loadingKeys, setLoadingKeys] = useState<string[]>([]);
  // Processing
  const [processingSearchTerm, setProcessingSearchTerm] = useState("");
  const [processingSort, setProcessingSort] = useState<Sort | null>(null);
  const [queues, setQueues] = useImmer<QueueDataType[]>([]);
  const [detailsQueueKey, setDetailsQueueKey] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    [queryKey: string]: DevtoolsRequestQueueStats;
  }>({});
  // Explorer
  const [explorerSearchTerm, setExplorerSearchTerm] = useState("");
  const [detailsExplorerRequest, setDetailsExplorerRequest] = useState<DevtoolsExplorerRequest | null>(null);
  const [explorerRequests] = useState<RequestInstance[]>([]);

  const handleClearNetwork = useCallback(() => {
    setRequests([]);
    setSuccess([]);
    setFailed([]);
    setInProgress([]);
    setPaused([]);
    setCanceled([]);
    setRemoved([]);
  }, []);

  const removeNetworkRequest = (requestId: string) => {
    setRequests((prev) => prev.filter((i) => i.requestId !== requestId));
    setSuccess((prev) => prev.filter((i) => i.requestId !== requestId));
    setFailed((prev) => prev.filter((i) => i.requestId !== requestId));
  };

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
          .map((item) => {
            return {
              requestId: item.requestId,
              queryKey: item.request.queryKey,
              cacheKey: item.request.cacheKey,
              abortKey: item.request.abortKey,
            };
          });
    setInProgress((draft) => {
      return [...draft.filter((el) => el.queryKey !== queue.queryKey), ...inQueueRequests].filter(
        (_, index) => index < dataMaxSize,
      );
    });
    setPaused((prevState) => {
      return [...prevState.filter((el) => el.queryKey !== queue.queryKey), ...pausedQueueRequests].filter(
        (_, index) => index < dataMaxSize,
      );
    });
    setQueues((draft) => {
      const currentQueue = draft.findIndex((el) => el.queryKey === queue.queryKey);
      if (currentQueue === -1) {
        return [...draft, queue];
      }
      draft[currentQueue] = queue;
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

    setCache(cacheItems);
  }, [client.cache]);

  const handleSetOnline = useCallback(
    (value: boolean) => {
      client.appManager.setOnline(value);
      setIsOnline(value);
    },
    [client.appManager],
  );

  const handleStats = useCallback(
    (request: RequestInstance, response: RequestResponseType<RequestInstance>, details: ResponseDetailsType) => {
      const key = request.queryKey;

      setStats((prev) => {
        const current: DevtoolsRequestQueueStats = prev[key] || {
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

        return {
          ...prev,
          [key]: {
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
            minProcessingTime: current.minProcessingTime
              ? Math.min(current.minProcessingTime, processTime)
              : processTime,
            maxProcessingTime: Math.max(current.maxProcessingTime, processTime),
            lastProcessingTime: processTime,
          },
        };
      });
    },
    [],
  );

  useEffect(() => {
    const unmountOffline = client.appManager.events.onOffline(() => {
      setIsOnline(false);
    });

    const unmountOnline = client.appManager.events.onOnline(() => {
      setIsOnline(true);
    });

    const unmountOnRequestStart = client.requestManager.events.onRequestStart((details) => {
      setRequests(
        (prev) =>
          [{ ...details, triggerTimestamp: new Date() }, ...prev].filter(
            (_, index) => index < dataMaxSize,
          ) as DevtoolsRequestEvent[],
      );
      setLoadingKeys((prev) => prev.filter((i) => i !== details.request.cacheKey));
    });
    const unmountOnResponse = client.requestManager.events.onResponse(({ response, details, request, requestId }) => {
      if (!details.isCanceled) {
        handleStats(request, response, details);
      }

      if (response.success) {
        setSuccess((prev) =>
          [...prev, { requestId, response, details } satisfies DevtoolsRequestResponse].filter(
            (_, index) => index < dataMaxSize,
          ),
        );
      } else if (!details.isCanceled) {
        setFailed((prev) =>
          [...prev, { requestId, response, details } satisfies DevtoolsRequestResponse].filter(
            (_, index) => index < dataMaxSize,
          ),
        );
      }
    });
    const unmountOnRequestPause = client.requestManager.events.onAbort(({ requestId, request }) => {
      setCanceled((prev) => {
        return [
          { requestId, queryKey: request.queryKey, cacheKey: request.cacheKey, abortKey: request.abortKey },
          ...prev,
        ].filter((_, index) => index < dataMaxSize);
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
        setRemoved((prev) =>
          [
            { requestId, queryKey: request.queryKey, cacheKey: request.cacheKey, abortKey: request.abortKey },
            ...prev,
          ].filter((_, index) => index < dataMaxSize),
        );
      }
    });
    const unmountOnCacheChange = client.cache.events.onData((cacheData) => {
      setCache((draft) => {
        const { cacheKey, isTriggeredExternally, ...rest } = cacheData;
        const changedElement = draft.find((cacheElement) => cacheElement.cacheKey === cacheKey);
        if (changedElement) {
          changedElement.cacheData = cacheData;
        } else {
          draft.push({ cacheKey: cacheData.cacheKey, cacheData: { ...rest, cacheKey } });
        }
      });
    });
    const unmountOnCacheInvalidate = client.cache.events.onInvalidate((cacheKey) => {
      setCache((draft) => {
        const invalidatedElement = draft.find((cacheElement) => cacheElement.cacheKey === cacheKey);
        if (invalidatedElement) {
          invalidatedElement.cacheData.staleTime = 0;
        }
      });
    });

    const unmountCacheDelete = client.cache.events.onDelete((cacheKey) => {
      setCache((draft) => {
        const toRemove = draft.findIndex((cacheElement) => cacheElement.cacheKey === cacheKey);
        if (toRemove !== -1) {
          draft.splice(toRemove, 1);
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
  }, [client, handleCacheChange, handleStats, requests]);

  // useEffect(() => {
  //   setExplorerRequests(client.__requestsMap);
  // }, [client.__requestsMap, workspaces]);

  const allRequests: DevtoolsRequestEvent[] = requests.map((item) => {
    const isCanceled = !!canceled.find((el) => el.requestId === item.requestId);
    const isSuccess = !!success.find((el) => el.requestId === item.requestId);
    const isRemoved = !!removed.find((el) => el.requestId === item.requestId);
    const isPaused = !!paused.find((el) => el.requestId === item.requestId);
    const response: any =
      success.find((el) => el.requestId === item.requestId) || failed.find((el) => el.requestId === item.requestId);

    return {
      ...response,
      requestId: item.requestId,
      request: item.request,
      details: response?.details,
      isRemoved,
      isCanceled,
      isSuccess,
      isFinished: !!response,
      isPaused,
      triggerTimestamp: item.triggerTimestamp,
    };
  });

  const isStandalone = !!workspaces.length;
  const isVisible = activeWorkspace === workspace;
  const isDevtoolsVisible = isStandalone ? isVisible : open;
  const isButtonVisible = !isStandalone && !open;

  return (
    <DevtoolsProvider
      isStandalone={isStandalone}
      css={css}
      open={open}
      theme={theme}
      setTheme={setTheme}
      setOpen={setOpen}
      module={module}
      setModule={setModule}
      isOnline={isOnline}
      setIsOnline={handleSetOnline}
      client={client}
      success={success}
      failed={failed}
      inProgress={inProgress}
      paused={paused}
      canceled={canceled}
      requests={allRequests}
      queues={queues}
      cache={cache}
      stats={stats}
      networkSearchTerm={networkSearchTerm}
      setNetworkSearchTerm={setNetworkSearchTerm}
      networkSort={networkSort}
      setNetworkSort={setNetworkSort}
      detailsRequestId={detailsRequestId}
      setDetailsRequestId={setDetailsRequestId}
      networkFilter={networkFilter}
      setNetworkFilter={setNetworkFilter}
      clearNetwork={handleClearNetwork}
      removeNetworkRequest={removeNetworkRequest}
      cacheSearchTerm={cacheSearchTerm}
      setCacheSearchTerm={setCacheSearchTerm}
      cacheSort={cacheSort}
      setCacheSort={setCacheSort}
      detailsCacheKey={detailsCacheKey}
      setDetailsCacheKey={setDetailsCacheKey}
      processingSearchTerm={processingSearchTerm}
      setProcessingSearchTerm={setProcessingSearchTerm}
      processingSort={processingSort}
      setProcessingSort={setProcessingSort}
      detailsQueueKey={detailsQueueKey}
      setDetailsQueueKey={setDetailsQueueKey}
      loadingKeys={loadingKeys}
      setLoadingKeys={setLoadingKeys}
      position={position}
      setPosition={setPosition}
      treeState={new DevtoolsDataProvider([...explorerRequests])}
      explorerSearchTerm={explorerSearchTerm}
      setExplorerSearchTerm={setExplorerSearchTerm}
      detailsExplorerRequest={detailsExplorerRequest}
      setDetailsExplorerRequest={setDetailsExplorerRequest}
      simulatedError={simulatedError}
      size={size}
      setSize={setSize}
    >
      {isDevtoolsVisible && (
        <Application>
          <Module />
        </Application>
      )}
      {isButtonVisible && <DevtoolsToggle onClick={() => setOpen(true)} />}
    </DevtoolsProvider>
  );
};
