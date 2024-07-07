import { useState, useRef } from "react";
import { RequestInstance, getRequestDispatcher, QueueElementType, QueueDataType } from "@hyper-fetch/core";
import { useDidMount, useDidUpdate } from "@better-hooks/lifecycle";

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

  const unmountCallbacks = useRef<null | VoidFunction>(null);

  const [stopped, setStopped] = useState(false);
  const [requests, setRequests] = useState<QueueRequest<Request>[]>([]);

  // ******************
  // Mapping
  // ******************

  const createRequestsArray = (queueElements: QueueElementType<Request>[]): QueueRequest<Request>[] => {
    return queueElements.map<QueueRequest<Request>>((req) => ({
      ...req,
      stopRequest: () => dispatcher.stopRequest(queueKey, req.requestId),
      startRequest: () => dispatcher.startRequest(queueKey, req.requestId),
      deleteRequest: () => dispatcher.delete(queueKey, req.requestId, abortKey),
    }));
  };

  const mergePayloadType = (requestId: string, data: Partial<QueueRequest<Request>>) => {
    setRequests((prev) => prev.map((el) => (el.requestId === requestId ? { ...el, ...data } : el)));
  };

  // ******************
  // State
  // ******************

  const getInitialState = () => {
    const requestQueue = dispatcher.getQueue<Request>(queueKey);

    setStopped(requestQueue.stopped);
    setRequests(createRequestsArray(requestQueue.requests));
  };

  const updateQueueState = (values: QueueDataType<Request>) => {
    setStopped(values.stopped);
    setRequests(createRequestsArray(values.requests));
  };

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

    unmountCallbacks.current?.();
    unmountCallbacks.current = unmount;
    return unmount;
  };

  // ******************
  // Lifecycle
  // ******************

  useDidMount(getInitialState);

  useDidUpdate(mountEvents, [stopped, requests, setRequests, setStopped], true);

  return {
    stopped,
    requests,
    stop: () => dispatcher.stop(queueKey),
    pause: () => dispatcher.pause(queueKey),
    start: () => dispatcher.start(queueKey),
  };
};
