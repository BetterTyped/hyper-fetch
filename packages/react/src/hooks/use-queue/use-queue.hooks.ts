import { RequestInstance, getRequestDispatcher, QueueItemType, QueueDataType } from "@hyper-fetch/core";
import { useState, useEffect, useCallback } from "react";

import { UseQueueOptionsType, useQueueDefaultOptions, QueueRequest, UseQueueReturnType } from "hooks/use-queue";
import { useProvider } from "provider";

const canUpdate = (
  item: Pick<QueueRequest<RequestInstance>, "success" | "failed" | "canceled" | "removed" | "resolved">,
) => {
  if (item.success || item.failed) {
    return false;
  }
  return true;
};

/**
 * This hook allows to control dispatchers request queues
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
  const { queueType, keepFinishedRequests } = {
    ...useQueueDefaultOptions,
    ...globalConfig.useQueueConfig,
    ...options,
  };

  const { abortKey, queryKey, client } = request;
  const { requestManager } = client;

  const [dispatcher] = getRequestDispatcher(request, queueType);

  const [stopped, setStopped] = useState(false);
  const [requests, setRequests] = useState<QueueRequest<Request>[]>([]);

  // ******************
  // Mapping
  // ******************

  const createRequestsArray = useCallback(
    (queueElements: QueueItemType<Request>[], prevRequests?: QueueRequest<Request>[]): QueueRequest<Request>[] => {
      const newRequests = queueElements
        // Keep only unique requests
        .filter((el) => !prevRequests?.some((prevEl) => prevEl.requestId === el.requestId))
        .map<QueueRequest<Request>>((req) => ({
          failed: false,
          canceled: false,
          removed: false,
          success: false,
          ...req,
          downloading: {
            progress: 0,
            timeLeft: 0,
            sizeLeft: 0,
            total: 0,
            loaded: 0,
            startTimestamp: 0,
          },
          uploading: {
            progress: 0,
            timeLeft: 0,
            sizeLeft: 0,
            total: 0,
            loaded: 0,
            startTimestamp: 0,
          },
          stopRequest: () => dispatcher.stopRequest(queryKey, req.requestId),
          startRequest: () => dispatcher.startRequest(queryKey, req.requestId),
          deleteRequest: () => dispatcher.delete(queryKey, req.requestId, abortKey),
        }));

      if (keepFinishedRequests && prevRequests) {
        console.log(prevRequests.map((el) => [el.requestId, el.uploading?.progress]));
        console.log(newRequests.map((el) => [el.requestId, el.uploading?.progress]));
        return [...prevRequests, ...newRequests];
      }

      return newRequests;
    },
    [abortKey, dispatcher, queryKey, keepFinishedRequests],
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

  // ******************
  // State
  // ******************

  const getInitialState = () => {
    const requestQueue = dispatcher.getQueue<Request>(queryKey);

    setStopped(requestQueue.stopped);
    setRequests(createRequestsArray(requestQueue.requests));
  };

  const updateQueueState = useCallback(
    (values: QueueDataType<Request>) => {
      setStopped(values.stopped);
      setRequests((prev) => createRequestsArray(values.requests, prev));
    },
    [createRequestsArray],
  );

  // ******************
  // Events
  // ******************

  const mountEvents = () => {
    const unmountChange = dispatcher.events.onQueueChangeByKey<Request>(queryKey, updateQueueState);
    const unmountStatus = dispatcher.events.onQueueStatusChangeByKey<Request>(queryKey, updateQueueState);

    const unmountFailed = requestManager.events.onResponse(({ requestId, response }) => {
      if (!response.success) {
        setRequests((prev) => prev.map((el) => (el.requestId === requestId ? { ...el, failed: true } : el)));
      } else {
        setRequests((prev) => prev.map((el) => (el.requestId === requestId ? { ...el, success: true } : el)));
      }
    });
    const unmountCanceled = requestManager.events.onAbort(({ requestId }) => {
      setRequests((prev) => prev.map((el) => (el.requestId === requestId ? { ...el, canceled: true } : el)));
    });

    const unmountRemoved = requestManager.events.onRemove(({ requestId }) => {
      setRequests((prev) =>
        prev.map((el) => (el.requestId === requestId && canUpdate(el) ? { ...el, removed: true } : el)),
      );
    });

    const unmountDownload = requestManager.events.onDownloadProgress(
      ({ progress, timeLeft, sizeLeft, total, loaded, startTimestamp, requestId }) => {
        console.log("download", requestId, progress);
        mergePayloadType(requestId, { downloading: { progress, timeLeft, sizeLeft, total, loaded, startTimestamp } });
      },
    );

    const unmountUpload = requestManager.events.onUploadProgress(
      ({ progress, timeLeft, sizeLeft, total, loaded, startTimestamp, requestId }) => {
        console.log("upload", requestId, progress);
        mergePayloadType(requestId, { uploading: { progress, timeLeft, sizeLeft, total, loaded, startTimestamp } });
      },
    );

    const unmount = () => {
      unmountStatus();
      unmountChange();
      unmountDownload();
      unmountUpload();
      unmountFailed();
      unmountCanceled();
      unmountRemoved();
    };

    return unmount;
  };

  // ******************
  // Lifecycle
  // ******************

  useEffect(getInitialState, [createRequestsArray, dispatcher, queryKey]);

  useEffect(mountEvents, [
    stopped,
    requests,
    setRequests,
    setStopped,
    queryKey,
    dispatcher.events,
    requestManager.events,
    updateQueueState,
    mergePayloadType,
  ]);

  return {
    stopped,
    requests,
    dispatcher,
    stop: () => dispatcher.stop(queryKey),
    pause: () => dispatcher.pause(queryKey),
    start: () => dispatcher.start(queryKey),
  };
};
