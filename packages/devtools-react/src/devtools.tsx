import { useCallback, useEffect, useState } from "react";
import { ClientInstance, QueueDataType, RequestInstance, Response, ResponseDetailsType } from "@hyper-fetch/core";
import { css } from "goober";
import { Resizable, Size } from "re-resizable";

import { Header } from "./components/header/header";
import { DevtoolsProvider, Sort } from "devtools.context";
import {
  DevtoolsCacheEvent,
  DevtoolsModule,
  DevtoolsElement,
  DevtoolsRequestEvent,
  DevtoolsRequestQueueStats,
  DevtoolsRequestResponse,
} from "devtools.types";
import { Status } from "utils/request.status.utils";
import { DevtoolsToggle } from "components/devtools-toggle/devtools-toggle";
import { Sidebar } from "components/sidebar/sidebar";
import { NetworkList } from "pages/network/list/network";
import { CacheList } from "pages/cache/list/cache";
import { ProcessingList } from "pages/processing/list/processing";
import { ExplorerList } from "pages/explorer/list/explorer";
import { NetworkDetails } from "pages/network/details/details";
import { CacheDetails } from "pages/cache/details/details";
import { ProcessingDetails } from "pages/processing/details/details";
import { ExplorerDetails } from "pages/explorer/details/details";
import { DevtoolsDataProvider } from "pages/explorer/list/content/content.state";
import { DevtoolsWrapper } from "devtools.wrapper";
import { DevtoolsExplorerRequest } from "pages/explorer/list/content/content.types";

const SidebarModules = {
  Network: NetworkList,
  Cache: CacheList,
  Processing: ProcessingList,
  Explorer: ExplorerList,
};

const DetailsModules = {
  Network: NetworkDetails,
  Cache: CacheDetails,
  Processing: ProcessingDetails,
  Explorer: ExplorerDetails,
};

/**
 * TODO:
 * - max network elements - performance handling?
 * - max cache elements - performance handling?
 * - Do not show for production use
 * - Prop for default sizes
 */
export type DevtoolsProps<T extends ClientInstance> = {
  client: T;
  initiallyOpen?: boolean;
  initialTheme?: "light" | "dark";
  initialPosition?: "Top" | "Left" | "Right" | "Bottom";
  simulatedError?: any;
};

export const Devtools = <T extends ClientInstance>({
  client,
  initialTheme = "dark",
  initiallyOpen = false,
  initialPosition = "Right",
  simulatedError = new Error("This is error simulated by HyperFetch Devtools"),
}: DevtoolsProps<T>) => {
  const [open, setOpen] = useState(initiallyOpen);
  const [module, setModule] = useState(DevtoolsModule.NETWORK);
  const [theme, setTheme] = useState<"light" | "dark">(initialTheme);
  const [isOnline, setIsOnline] = useState(client.appManager.isOnline);
  const [position, setPosition] = useState<"Top" | "Left" | "Right" | "Bottom">(initialPosition);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  const DetailsComponent = DetailsModules[module];
  const ListComponent = SidebarModules[module];

  // TODO REMOVE
  console.error(DetailsComponent);

  // Network
  const [networkSearchTerm, setNetworkSearchTerm] = useState("");
  const [networkSort, setNetworkSort] = useState<Sort | null>(null);
  const [requests, setRequests] = useState<DevtoolsRequestEvent[]>([] as unknown as DevtoolsRequestEvent[]);
  const [success, setSuccess] = useState<DevtoolsRequestResponse[]>([]);
  const [failed, setFailed] = useState<DevtoolsRequestResponse[]>([]);
  const [removed, setRemoved] = useState<DevtoolsElement[]>([]);
  const [inProgress, setInProgress] = useState<DevtoolsElement[]>([]);
  const [paused, setPaused] = useState<DevtoolsElement[]>([]);
  const [canceled, setCanceled] = useState<DevtoolsElement[]>([]);
  const [detailsRequestId, setDetailsRequestId] = useState<string | null>(null);
  const [networkFilter, setNetworkFilter] = useState<Status | null>(null);
  // Cache
  const [cacheSearchTerm, setCacheSearchTerm] = useState("");
  const [cacheSort, setCacheSort] = useState<Sort | null>(null);
  const [cache, setCache] = useState<DevtoolsCacheEvent[]>([]);
  const [detailsCacheKey, setDetailsCacheKey] = useState<string | null>(null);
  const [loadingKeys, setLoadingKeys] = useState<string[]>([]);
  // Processing
  const [processingSearchTerm, setProcessingSearchTerm] = useState("");
  const [processingSort, setProcessingSort] = useState<Sort | null>(null);
  const [queues, setQueues] = useState<QueueDataType[]>([]);
  const [detailsQueueKey, setDetailsQueueKey] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    [queueKey: string]: DevtoolsRequestQueueStats;
  }>({});
  // Explorer
  const [explorerSearchTerm, setExplorerSearchTerm] = useState("");
  const [detailsExplorerRequest, setDetailsExplorerRequest] = useState<DevtoolsExplorerRequest | null>(null);

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

  const updateQueues = useCallback(() => {
    const fetchRequests = client.fetchDispatcher.getAllRunningRequest();
    const submitRequests = client.submitDispatcher.getAllRunningRequest();

    const allQueuedRequest: DevtoolsElement[] = [...fetchRequests, ...submitRequests].map((item) => {
      return {
        requestId: item.requestId,
        queueKey: item.request.queueKey,
        cacheKey: item.request.cacheKey,
        abortKey: item.request.abortKey,
      };
    });

    const fetchQueuesArray = Array.from(
      client.fetchDispatcher.storage.entries() as unknown as Array<[string, QueueDataType]>,
    ).map(([, value]) => value);
    const submitQueuesArray = Array.from(
      client.submitDispatcher.storage.entries() as unknown as Array<[string, QueueDataType]>,
    ).map(([, value]) => value);

    const pausedRequests: DevtoolsElement[] = [...fetchQueuesArray, ...submitQueuesArray].reduce((acc, queue) => {
      if (queue.stopped) {
        return [
          ...acc,
          ...queue.requests.map((item) => {
            return {
              requestId: item.requestId,
              queueKey: item.request.queueKey,
              cacheKey: item.request.cacheKey,
              abortKey: item.request.abortKey,
            };
          }),
        ];
      }

      queue.requests.forEach((item) => {
        if (item.stopped) {
          acc.push({
            requestId: item.requestId,
            queueKey: item.request.queueKey,
            cacheKey: item.request.cacheKey,
            abortKey: item.request.abortKey,
          });
        }
      });

      return acc;
    }, [] as DevtoolsElement[]);

    setInProgress(allQueuedRequest);
    setPaused(pausedRequests);
    setQueues([...fetchQueuesArray, ...submitQueuesArray]);
  }, [client.fetchDispatcher, client.submitDispatcher]);

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
    (request: RequestInstance, response: Response<RequestInstance>, details: ResponseDetailsType) => {
      const key = request.queueKey;

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
      setRequests((prev) => [{ ...details, triggerTimestamp: new Date() }, ...prev] as DevtoolsRequestEvent[]);
      setLoadingKeys((prev) => prev.filter((i) => i !== details.request.cacheKey));
      updateQueues();
    });
    const unmountOnResponse = client.requestManager.events.onResponse(({ response, details, request, requestId }) => {
      updateQueues();

      if (!details.isCanceled) {
        handleStats(request, response, details);
      }

      if (response.success) {
        setSuccess((prev) => [...prev, { requestId, response, details } satisfies DevtoolsRequestResponse]);
      } else if (!details.isCanceled) {
        setFailed((prev) => [...prev, { requestId, response, details } satisfies DevtoolsRequestResponse]);
      }
    });
    const unmountOnRequestPause = client.requestManager.events.onAbort(({ requestId, request }) => {
      setCanceled((prev) => [
        ...prev,
        { requestId, queueKey: request.queueKey, cacheKey: request.cacheKey, abortKey: request.abortKey },
      ]);

      updateQueues();
    });
    const unmountOnFetchQueueChange = client.fetchDispatcher.events.onQueueChange(() => {
      updateQueues();
    });
    const unmountOnFetchQueueStatusChange = client.fetchDispatcher.events.onQueueStatusChange(() => {
      updateQueues();
    });
    const unmountOnSubmitQueueChange = client.submitDispatcher.events.onQueueChange(() => {
      updateQueues();
    });
    const unmountOnSubmitQueueStatusChange = client.submitDispatcher.events.onQueueStatusChange(() => {
      updateQueues();
    });
    const unmountOnRemove = client.requestManager.events.onRemove(({ requestId, request, resolved }) => {
      if (!resolved) {
        setRemoved((prev) => [
          ...prev,
          { requestId, queueKey: request.queueKey, cacheKey: request.cacheKey, abortKey: request.abortKey },
        ]);
      }
      updateQueues();
    });
    const unmountOnCacheChange = client.cache.events.onData(() => {
      handleCacheChange();
    });
    const unmountOnCacheInvalidate = client.cache.events.onInvalidate(() => {
      handleCacheChange();
    });

    const unmountCacheDelete = client.cache.events.onDelete(() => {
      handleCacheChange();
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
  }, [client, updateQueues, handleCacheChange, handleStats, requests]);

  useEffect(() => {
    updateQueues();
  }, [updateQueues]);

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

  return (
    <DevtoolsProvider
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
      treeState={new DevtoolsDataProvider([...client.__requestsMap.values()])}
      explorerSearchTerm={explorerSearchTerm}
      setExplorerSearchTerm={setExplorerSearchTerm}
      detailsExplorerRequest={detailsExplorerRequest}
      setDetailsExplorerRequest={setDetailsExplorerRequest}
      simulatedError={simulatedError}
      size={size}
      setSize={setSize}
    >
      {open && (
        <DevtoolsWrapper>
          <Header />
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              overflow: "hidden",
            }}
          >
            <Resizable
              defaultSize={{
                width: "400",
                height: "100%",
              }}
              minHeight="100%"
              maxWidth="80vw"
            >
              <Sidebar>
                <ListComponent />
              </Sidebar>
            </Resizable>
            <div style={{ position: "relative", flex: "1 1 auto", height: "100%" }}>{/* <DetailsComponent /> */}</div>
          </div>
        </DevtoolsWrapper>
      )}
      {!open && <DevtoolsToggle onClick={() => setOpen(true)} />}
    </DevtoolsProvider>
  );
};
