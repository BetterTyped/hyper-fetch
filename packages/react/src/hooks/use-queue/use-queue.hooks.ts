import type {
  ProgressType,
  RequestInstance,
  ResolvedQueueItemType,
  QueueDataType,
  QueueItemType,
} from "@hyper-fetch/core";
import { Request, getRequestDispatcher, scopeKey } from "@hyper-fetch/core";
import type { UseQueueOptionsType, QueueRequest, UseQueueReturnType } from "hooks/use-queue";
import { useQueueDefaultOptions } from "hooks/use-queue";
import { useProvider } from "provider";
import { useState, useEffect, useCallback } from "react";

const canUpdate = (
  item: Pick<QueueRequest<RequestInstance>, "success" | "failed" | "canceled" | "removed" | "resolved">,
) => {
  if (item.success || item.failed) {
    return false;
  }
  return true;
};

const getInitialProgress = (): ProgressType => ({
  progress: 0,
  timeLeft: 0,
  sizeLeft: 0,
  total: 0,
  loaded: 0,
  startTimestamp: 0,
});

/**
 * This hook allows you to monitor and control dispatcher request queues for a given request,
 * including starting, stopping, pausing, and inspecting pending/in-flight items.
 * @param request
 * @param options
 * @returns
 */
export const useQueue = <Request extends RequestInstance>(
  request: Request,
  options?: UseQueueOptionsType,
): UseQueueReturnType<Request> => {
  // Build the configuration options
  const { config: globalConfig } = useProvider();
  const { dispatcherType, keepFinishedRequests } = {
    ...useQueueDefaultOptions,
    ...globalConfig.useQueueConfig,
    ...options,
  };

  const { abortKey: rawAbortKey, queryKey: rawQueryKey, scope, client } = request;
  const abortKey = scopeKey(rawAbortKey, scope);
  const queryKey = scopeKey(rawQueryKey, scope);
  const { requestManager } = client;

  const [dispatcher] = getRequestDispatcher(request, dispatcherType);

  // ******************
  // Mapping
  // ******************

  const createRequestsArray = useCallback(
    (
      queueElements: ResolvedQueueItemType<Request>[],
      prevRequests: QueueRequest<Request>[] = [],
    ): QueueRequest<Request>[] => {
      const previous = new Map(prevRequests.map((el) => [el.requestId, el]));

      // The list mirrors the dispatcher queue - requests we already track keep their local state
      // (progress and result flags) and get the latest queue values (stopped, retries, resolved)
      const current = new Map(
        queueElements.map((req) => {
          const tracked = previous.get(req.requestId);
          const item: QueueRequest<Request> = tracked
            ? { ...tracked, ...req }
            : {
                failed: false,
                canceled: false,
                removed: false,
                success: false,
                ...req,
                downloading: getInitialProgress(),
                uploading: getInitialProgress(),
                stopRequest: () => dispatcher.stopRequest(queryKey, req.requestId),
                startRequest: () => dispatcher.startRequest(queryKey, req.requestId),
                deleteRequest: () => dispatcher.delete(queryKey, req.requestId, abortKey),
              };
          return [req.requestId, item];
        }),
      );

      if (!keepFinishedRequests) {
        return [...current.values()];
      }

      // Requests that left the queue keep their place, new ones are added at the end
      const kept = prevRequests.map((el) => current.get(el.requestId) || el);
      const added = [...current.values()].filter((el) => !previous.has(el.requestId));

      return [...kept, ...added];
    },
    [abortKey, dispatcher, queryKey, keepFinishedRequests],
  );

  // ******************
  // State
  // ******************

  // Read the queue right away, so the first render already shows its real state
  const [stopped, setStopped] = useState(() => dispatcher.getQueue<Request>(queryKey).stopped);
  const [requests, setRequests] = useState<QueueRequest<Request>[]>(() =>
    createRequestsArray(dispatcher.getQueue<Request>(queryKey).requests),
  );

  const mergePayloadType = useCallback((requestId: string, data: Partial<QueueRequest<Request>>) => {
    setRequests((prev) =>
      prev.map((el) => {
        if (el.requestId === requestId && canUpdate(el)) {
          return { ...el, ...data };
        }
        return el;
      }),
    );
  }, []);

  const getInitialState = () => {
    const requestQueue = dispatcher.getQueue<Request>(queryKey);

    setStopped(requestQueue.stopped);
    setRequests(createRequestsArray(requestQueue.requests));
  };

  const resolveQueueItems = useCallback(
    (items: QueueItemType<Request>[]): ResolvedQueueItemType<Request>[] => {
      return items.map((item) => {
        if (item.request instanceof Request) {
          return item as ResolvedQueueItemType<Request>;
        }
        return { ...item, request: client.fromJSON(item.request) as Request };
      });
    },
    [client],
  );

  const updateQueueState = useCallback(
    (values: QueueDataType<Request>) => {
      setStopped(values.stopped);
      setRequests((prev) => createRequestsArray(resolveQueueItems(values.requests), prev));
    },
    [createRequestsArray, resolveQueueItems],
  );

  // ******************
  // Events
  // ******************

  const mountEvents = () => {
    const unmountChange = dispatcher.events.onQueueChangeByKey<Request>(queryKey, updateQueueState);
    const unmountStatus = dispatcher.events.onQueueStatusChangeByKey<Request>(queryKey, updateQueueState);

    const unmountResponse = requestManager.events.onResponse(({ requestId, response, details }) => {
      setRequests((prev) =>
        prev.map((el) => {
          if (el.requestId !== requestId) {
            return el;
          }
          if (response.success) {
            return { ...el, success: true };
          }
          // The request is not done yet when it will be sent again - after the retry time,
          // once the queue gets started again or when the network connection is back
          const isRepeated =
            !!details?.willRetry || !!details?.isCanceled || (!!details?.isOffline && !!el.request.offline);
          return isRepeated ? el : { ...el, failed: true };
        }),
      );
    });
    const unmountCanceled = requestManager.events.onAbort(({ requestId }) => {
      setRequests((prev) => prev.map((el) => (el.requestId === requestId ? { ...el, canceled: true } : el)));
    });
    // Canceled request can be sent again - for example after starting the stopped queue
    const unmountStarted = requestManager.events.onRequestStart(({ requestId }) => {
      setRequests((prev) =>
        prev.map((el) => (el.requestId === requestId && el.canceled ? { ...el, canceled: false } : el)),
      );
    });

    const unmountRemoved = requestManager.events.onRemove(({ requestId }) => {
      setRequests((prev) =>
        prev.map((el) => (el.requestId === requestId && canUpdate(el) ? { ...el, removed: true } : el)),
      );
    });

    const unmountDownload = requestManager.events.onDownloadProgress(
      ({ progress, timeLeft, sizeLeft, total, loaded, startTimestamp, requestId }) => {
        mergePayloadType(requestId, { downloading: { progress, timeLeft, sizeLeft, total, loaded, startTimestamp } });
      },
    );

    const unmountUpload = requestManager.events.onUploadProgress(
      ({ progress, timeLeft, sizeLeft, total, loaded, startTimestamp, requestId }) => {
        mergePayloadType(requestId, { uploading: { progress, timeLeft, sizeLeft, total, loaded, startTimestamp } });
      },
    );

    const unmount = () => {
      unmountStatus();
      unmountChange();
      unmountDownload();
      unmountUpload();
      unmountResponse();
      unmountCanceled();
      unmountStarted();
      unmountRemoved();
    };

    return unmount;
  };

  // ******************
  // Lifecycle
  // ******************

  useEffect(getInitialState, [createRequestsArray, dispatcher, queryKey]);

  // The handlers only use state updaters, so there is no need to subscribe again when the state changes
  useEffect(mountEvents, [queryKey, dispatcher.events, requestManager.events, updateQueueState, mergePayloadType]);

  return {
    stopped,
    requests,
    dispatcher,
    stop: () => dispatcher.stop(queryKey),
    pause: () => dispatcher.pause(queryKey),
    start: () => dispatcher.start(queryKey),
  };
};
