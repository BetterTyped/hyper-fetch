import { useState, useEffect, useCallback } from "react";
import { RequestInstance, getRequestDispatcher, QueueElementType, QueueDataType } from "@hyper-fetch/core";

import { UseQueueOptionsType, useQueueDefaultOptions, QueueRequest, UseQueueReturnType } from "hooks/use-queue";
import { useProvider } from "provider";

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
  const { queueType = "auto" } = {
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
    (queueElements: QueueElementType<Request>[]): QueueRequest<Request>[] => {
      return queueElements.map<QueueRequest<Request>>((req) => ({
        ...req,
        stopRequest: () => dispatcher.stopRequest(queryKey, req.requestId),
        startRequest: () => dispatcher.startRequest(queryKey, req.requestId),
        deleteRequest: () => dispatcher.delete(queryKey, req.requestId, abortKey),
      }));
    },
    [abortKey, dispatcher, queryKey],
  );

  const mergePayloadType = useCallback((requestId: string, data: Partial<QueueRequest<Request>>) => {
    setRequests((prev) => prev.map((el) => (el.requestId === requestId ? { ...el, ...data } : el)));
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
      setRequests(createRequestsArray(values.requests));
    },
    [createRequestsArray],
  );

  // ******************
  // Events
  // ******************

  const mountEvents = () => {
    const unmountChange = dispatcher.events.onQueueChangeByKey<Request>(queryKey, updateQueueState);
    const unmountStatus = dispatcher.events.onQueueStatusChangeByKey<Request>(queryKey, updateQueueState);

    const unmountDownload = requestManager.events.onDownloadProgressByQueue(
      queryKey,
      ({ progress, timeLeft, sizeLeft, total, loaded, startTimestamp, requestId }) => {
        mergePayloadType(requestId, { downloading: { progress, timeLeft, sizeLeft, total, loaded, startTimestamp } });
      },
    );

    const unmountUpload = requestManager.events.onUploadProgressByQueue(
      queryKey,
      ({ progress, timeLeft, sizeLeft, total, loaded, startTimestamp, requestId }) => {
        mergePayloadType(requestId, { uploading: { progress, timeLeft, sizeLeft, total, loaded, startTimestamp } });
      },
    );

    const unmount = () => {
      unmountStatus();
      unmountChange();
      unmountDownload();
      unmountUpload();
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
