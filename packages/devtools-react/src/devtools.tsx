import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { ClientInstance, LogType, LoggerManager, QueueDataType } from "@hyper-fetch/core";
import { Resizable } from "re-resizable";
import { css } from "goober";

import { Header } from "./components/header/header";
import { Cache } from "./pages/cache/cache";
import { Logs } from "./pages/logs/logs";
import { Network } from "./pages/network/network";
import { Processing } from "./pages/processing/processing";
import { DevtoolsProvider } from "devtools.context";
import {
  DevtoolsCacheEvent,
  DevtoolsModule,
  DevtoolsQueueItemData,
  DevtoolsRequestEvent,
  RequestEvent,
  RequestResponse,
} from "devtools.types";
import { Status } from "utils/request.status.utils";
import { DevtoolsToggle } from "components/devtools-toggle/devtools-toggle";

const modules = {
  Network,
  Cache,
  Logs,
  Processing,
};

/**
 * TODO:  Add description
 * - errors drafts - allowing to test the error handling with button clicks
 *
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

  const [requests, setRequests] = useState<(RequestEvent<T> & { addedTimestamp: number })[]>([]);
  const [success, setSuccess] = useState<RequestResponse<T>[]>([]);
  const [failed, setFailed] = useState<RequestResponse<T>[]>([]);
  const [removed, setRemoved] = useState<RequestEvent<T>[]>([]);
  const [inProgress, setInProgress] = useState<(RequestEvent<T> & { addedTimestamp: number })[]>([]);
  const [paused, setPaused] = useState<RequestEvent<T>[]>([]);
  const [canceled, setCanceled] = useState<RequestEvent<T>[]>([]);
  const [fetchQueues, setFetchQueues] = useState<QueueDataType[]>([]);
  const [submitQueues, setSubmitQueues] = useState<QueueDataType[]>([]);
  const [cache, setCache] = useState<DevtoolsCacheEvent[]>([]);
  const [logs, setLogs] = useState<LogType[]>([]);

  // Network
  const [detailsRequestId, setDetailsRequestId] = useState<string | null>(null);
  const [networkFilter, setNetworkFilter] = useState<Status | null>(null);
  // Cache
  const [detailsCacheKey, setDetailsCacheKey] = useState<string | null>(null);
  // Logs
  // ....
  // Processing
  const [detailsQueue, setDetailsQueue] = useState<DevtoolsQueueItemData | null>(null);

  const countProgressRequests = useCallback(() => {
    const fetchRequests = client.fetchDispatcher.getAllRunningRequest();
    const submitRequests = client.submitDispatcher.getAllRunningRequest();

    const allQueuedRequest = [...fetchRequests, ...submitRequests].map((item) => {
      return {
        requestId: item.requestId,
        request: item.request,
        addedTimestamp: item.timestamp,
      } as RequestEvent<T> & { addedTimestamp: number };
    });

    const fetchQueuesArray = Array.from(
      client.fetchDispatcher.storage.entries() as unknown as Array<[string, QueueDataType]>,
    ).map(([, value]) => value);
    const submitQueuesArray = Array.from(
      client.submitDispatcher.storage.entries() as unknown as Array<[string, QueueDataType]>,
    ).map(([, value]) => value);

    const pausedRequests: RequestEvent<T>[] = [...fetchQueuesArray, ...submitQueuesArray].reduce((acc, queue) => {
      if (queue.stopped) {
        return [
          ...acc,
          ...queue.requests.map((item) => {
            return {
              requestId: item.requestId,
              request: item.request,
            };
          }),
        ] as RequestEvent<T>[];
      }

      queue.requests.forEach((item) => {
        if (item.stopped) {
          acc.push({
            requestId: item.requestId,
            request: item.request,
          } as RequestEvent<T>);
        }
      });

      return acc;
    }, [] as RequestEvent<T>[]);

    setInProgress(allQueuedRequest);
    setPaused(pausedRequests);
    setFetchQueues(fetchQueuesArray);
    setSubmitQueues(submitQueuesArray);
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

  useEffect(() => {
    const unmountOnRequestStart = client.requestManager.events.onRequestStart((details) => {
      setRequests(
        (prev) =>
          [{ ...details, addedTimestamp: new Date() }, ...prev] as (RequestEvent<T> & { addedTimestamp: number })[],
      );
      countProgressRequests();
    });
    const unmountOnResponse = client.requestManager.events.onResponse(({ response, details, request, requestId }) => {
      countProgressRequests();

      if (response.success) {
        setSuccess((prev) => [...prev, { response, details, request, requestId }] as RequestResponse<T>[]);
      } else if (!details.isCanceled) {
        setFailed((prev) => [...prev, { response, details, request, requestId }] as RequestResponse<T>[]);
      }
    });
    const unmountOnRequestPause = client.requestManager.events.onAbort((details) => {
      setCanceled((prev) => [...prev, details] as RequestEvent<T>[]);

      countProgressRequests();
    });
    const unmountOnFetchQueueChange = client.fetchDispatcher.events.onQueueChange(() => {
      countProgressRequests();
    });
    const unmountOnFetchQueueStatusChange = client.fetchDispatcher.events.onQueueStatusChange(() => {
      countProgressRequests();
    });
    const unmountOnSubmitQueueChange = client.submitDispatcher.events.onQueueChange(() => {
      countProgressRequests();
    });
    const unmountOnSubmitQueueStatusChange = client.submitDispatcher.events.onQueueStatusChange(() => {
      countProgressRequests();
    });
    const unmountOnRemove = client.requestManager.events.onRemove((details) => {
      if (!details.resolved) {
        setRemoved((prev) => [...prev, details] as RequestEvent<T>[]);
      }
      countProgressRequests();
    });
    const unmountOnCacheChange = client.cache.events.onData(() => {
      handleCacheChange();
    });
    const unmountOnCacheInvalidate = client.cache.events.onInvalidate(() => {
      handleCacheChange();
    });

    return () => {
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
    };
  }, [client, countProgressRequests, handleCacheChange, requests]);

  useLayoutEffect(() => {
    client
      .setLogger((oldClient) => {
        return new LoggerManager(oldClient, {
          logger: (log) => {
            setLogs((prev) => [...prev, log]);
          },
          severity: 0,
        });
      })
      .setDebug(true);
  }, [client]);

  const allRequests: Array<DevtoolsRequestEvent> = requests.map((item) => {
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
      addedTimestamp: item.addedTimestamp,
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
      fetchQueues={fetchQueues}
      submitQueues={submitQueues}
      cache={cache}
      logs={logs}
      detailsRequestId={detailsRequestId}
      setDetailsRequestId={setDetailsRequestId}
      networkFilter={networkFilter}
      setNetworkFilter={setNetworkFilter}
      detailsCacheKey={detailsCacheKey}
      setDetailsCacheKey={setDetailsCacheKey}
      detailsQueue={detailsQueue}
      setDetailsQueue={setDetailsQueue}
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
            fontFamily:
              "Optimistic Text,-apple-system,ui-sans-serif,system-ui,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji",
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
