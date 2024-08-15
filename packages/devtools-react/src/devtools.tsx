import { useCallback, useEffect, useState } from "react";
import { ClientInstance, QueueDataType, RequestInstance, Response, ResponseDetailsType } from "@hyper-fetch/core";
import { Resizable } from "re-resizable";
import { css } from "goober";

import { Header } from "./components/header/header";
import { Cache } from "./pages/cache/cache";
import { Network } from "./pages/network/network";
import { Processing } from "./pages/processing/processing";
import { DevtoolsProvider } from "devtools.context";
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

const modules = {
  Network,
  Cache,
  Processing,
};

/**
 * TODO:  Add description
 * - errors drafts - allowing to test the error handling with button clicks
 * - max network elements - performance handling
 * - max cache elements - performance handling?
 */
export type DevtoolsProps<T extends ClientInstance> = {
  client: T;
  initiallyOpen?: boolean;
};

export const Devtools = <T extends ClientInstance>({ client, initiallyOpen = false }: DevtoolsProps<T>) => {
  const [open, setOpen] = useState(initiallyOpen);
  const [module, setModule] = useState(DevtoolsModule.NETWORK);
  const [isOnline, setIsOnline] = useState(client.appManager.isOnline);

  const Component = modules[module];

  // Network
  const [networkSearchTerm, setNetworkSearchTerm] = useState("");
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
  const [cache, setCache] = useState<DevtoolsCacheEvent[]>([]);
  const [detailsCacheKey, setDetailsCacheKey] = useState<string | null>(null);
  const [loadingKeys, setLoadingKeys] = useState<string[]>([]);
  // Processing
  const [processingSearchTerm, setProcessingSearchTerm] = useState("");
  const [queues, setQueues] = useState<QueueDataType[]>([]);
  const [detailsQueueKey, setDetailsQueueKey] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    [queueKey: string]: DevtoolsRequestQueueStats;
  }>({});

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

    const queuesArray = Array.from(
      client.fetchDispatcher.storage.entries() as unknown as Array<[string, QueueDataType]>,
    ).map(([, value]) => value);
    const submitQueuesArray = Array.from(
      client.submitDispatcher.storage.entries() as unknown as Array<[string, QueueDataType]>,
    ).map(([, value]) => value);

    const pausedRequests: DevtoolsElement[] = [...queuesArray, ...submitQueuesArray].reduce((acc, queue) => {
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
    setQueues([...queuesArray, ...submitQueuesArray]);
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
      detailsRequestId={detailsRequestId}
      setDetailsRequestId={setDetailsRequestId}
      networkFilter={networkFilter}
      setNetworkFilter={setNetworkFilter}
      clearNetwork={handleClearNetwork}
      removeNetworkRequest={removeNetworkRequest}
      cacheSearchTerm={cacheSearchTerm}
      setCacheSearchTerm={setCacheSearchTerm}
      detailsCacheKey={detailsCacheKey}
      setDetailsCacheKey={setDetailsCacheKey}
      processingSearchTerm={processingSearchTerm}
      setProcessingSearchTerm={setProcessingSearchTerm}
      detailsQueueKey={detailsQueueKey}
      setDetailsQueueKey={setDetailsQueueKey}
      loadingKeys={loadingKeys}
      setLoadingKeys={setLoadingKeys}
    >
      {open && (
        <Resizable
          defaultSize={{ width: "100%", height: 400 }}
          minHeight={44}
          minWidth={44}
          maxHeight="100vh"
          maxWidth="100vw"
          style={{
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            zIndex: 9999,
            left: 0,
            right: 0,
            bottom: 0,
            overflowY: "hidden",
            background: "rgb(35 39 46)",
            border: "1px solid #7e8186",
            borderRadius: "10px 10px 0 0",
            color: "rgb(180, 194, 204)",
            fontFamily: "ui-sans-serif, Inter, system-ui, sans-serif, sans-serif",
          }}
        >
          <Header />
          <div
            style={{
              flex: "1 1 auto",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Component />
          </div>
        </Resizable>
      )}
      {!open && <DevtoolsToggle onClick={() => setOpen(true)} />}
    </DevtoolsProvider>
  );
};
