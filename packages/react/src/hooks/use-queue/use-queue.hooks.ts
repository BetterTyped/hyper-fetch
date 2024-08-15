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

  const { abortKey, queueKey, client } = request;
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
        stopRequest: () => dispatcher.stopRequest(queueKey, req.requestId),
        startRequest: () => dispatcher.startRequest(queueKey, req.requestId),
        deleteRequest: () => dispatcher.delete(queueKey, req.requestId, abortKey),
      }));
    },
    [abortKey, dispatcher, queueKey],
  );

  const mergePayloadType = useCallback((requestId: string, data: Partial<QueueRequest<Request>>) => {
    setRequests((prev) => prev.map((el) => (el.requestId === requestId ? { ...el, ...data } : el)));
  }, []);

  // ******************
  // State
  // ******************

  const getInitialState = () => {
    const requestQueue = dispatcher.getQueue<Request>(queueKey);

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
    const unmountChange = dispatcher.events.onQueueChangeByKey<Request>(queueKey, updateQueueState);
    const unmountStatus = dispatcher.events.onQueueStatusChangeByKey<Request>(queueKey, updateQueueState);

    const unmountDownload = requestManager.events.onDownloadProgressByQueue(
      queueKey,
      ({ progress, timeLeft, sizeLeft, total, loaded, startTimestamp, requestId }) => {
        mergePayloadType(requestId, { downloading: { progress, timeLeft, sizeLeft, total, loaded, startTimestamp } });
      },
    );

    const unmountUpload = requestManager.events.onUploadProgressByQueue(
      queueKey,
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

  useEffect(getInitialState, [createRequestsArray, dispatcher, queueKey]);

  useEffect(mountEvents, [
    stopped,
    requests,
    setRequests,
    setStopped,
    queueKey,
    dispatcher.events,
    requestManager.events,
    updateQueueState,
    mergePayloadType,
  ]);

  return {
    stopped,
    requests,
    dispatcher,
    stop: () => dispatcher.stop(queueKey),
    pause: () => dispatcher.pause(queueKey),
    start: () => dispatcher.start(queueKey),
  };
};
