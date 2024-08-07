import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  CacheValueType,
  ClientInstance,
  ExtractClientAdapterType,
  LogType,
  LoggerManager,
  QueueDataType,
} from "@hyper-fetch/core";

import { Header } from "./components/header/header";
import { Cache } from "./pages/cache/cache";
import { Logs } from "./pages/logs/logs";
import { Network } from "./pages/network/network";
import { Processing } from "./pages/processing/processing";
import { DevtoolsProvider } from "devtools.context";
import { DevtoolsModule, DevtoolsRequestEvent, RequestEvent, RequestResponse } from "devtools.types";
import { IconButton } from "components/icon-button/icon-button";

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
  const [cache, setCache] = useState<CacheValueType<unknown, unknown, ExtractClientAdapterType<T>>[]>([]);
  const [logs, setLogs] = useState<LogType[]>([]);

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
    const cacheItems = requests
      .map((item) => {
        const key = item.request.cacheKey;
        return client.cache.get(key);
      })
      .filter(Boolean) as CacheValueType<unknown, unknown, ExtractClientAdapterType<T>>[];

    setCache(cacheItems);
  }, [client.cache, requests]);

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
          [...prev, { ...details, addedTimestamp: new Date() }] as (RequestEvent<T> & { addedTimestamp: number })[],
      );
      countProgressRequests();
    });
    const unmountOnResponse = client.requestManager.events.onResponse(({ response, details, request, requestId }) => {
      countProgressRequests();

      if (response.success) {
        setSuccess((prev) => [...prev, { response, details, request, requestId }] as RequestResponse<T>[]);
      } else {
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
      addedTimestamp: item.addedTimestamp,
    };
  });

  return (
    <DevtoolsProvider
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
    >
      {open && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            height: "300px",
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
          <Component />
        </div>
      )}
      {!open && (
        <IconButton
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "rgb(35 39 46)",
            color: "white",
            width: "40px",
            height: "40px",
            padding: "10px",
          }}
          onClick={() => setOpen(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            zoomAndPan="magnify"
            viewBox="0 0 224.87999 299.999988"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            version="1.0"
            style={{ padding: "2px 0 0 2px" }}
          >
            <defs>
              <clipPath id="58708a0c3a">
                <path
                  d="M 28.484375 0.078125 L 202.390625 0.078125 L 202.390625 299.917969 L 28.484375 299.917969 Z M 28.484375 0.078125 "
                  clipRule="nonzero"
                />
              </clipPath>
            </defs>
            <g clipPath="url(#58708a0c3a)">
              <path
                fill="#fbc646"
                d="M 80.019531 0.0859375 L 191.648438 0.0859375 L 144.414062 88.105469 L 202.378906 88.105469 L 62.128906 299.910156 L 99.335938 143.910156 L 28.496094 143.910156 L 80.019531 0.0859375 "
                fillOpacity="1"
                fillRule="nonzero"
              />
            </g>
          </svg>
        </IconButton>
      )}
    </DevtoolsProvider>
  );
};
