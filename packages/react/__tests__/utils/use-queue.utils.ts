import { renderHook } from "@testing-library/react";
import { RequestInstance, getRequestDispatcher, getProgressData } from "@hyper-fetch/core";

import { useQueue, UseQueueOptionsType } from "hooks/use-queue";

export const renderUseQueue = <T extends RequestInstance>(request: T, options?: UseQueueOptionsType) => {
  return renderHook((rerenderOptions: UseQueueOptionsType & { request?: RequestInstance }) => {
    const { request: cmd, ...rest } = rerenderOptions || {};
    return useQueue(cmd || request, { ...options, ...rest });
  });
};

export const addQueueElement = <T extends RequestInstance>(
  request: T,
  options?: {
    stop: boolean;
    queueType?: "fetch" | "submit" | "auto";
  },
) => {
  const { stop = false, queueType = "auto" } = options || {};
  const [dispatcher] = getRequestDispatcher(request, queueType);
  if (stop) dispatcher.stop(request.queueKey);
  return dispatcher.add(request);
};

export const emitDownloadProgress = <T extends RequestInstance>(
  requestId: string,
  request: T,
  options?: {
    total: number;
    loaded: number;
  },
) => {
  const values = options || { total: 50, loaded: 25 };
  const startTimestamp = new Date(+new Date() - 20000);
  const progressTimestamp = new Date();

  const progress = getProgressData(startTimestamp, progressTimestamp, values);
  request.client.requestManager.events.emitDownloadProgress(request.queueKey, requestId, progress, {
    requestId,
    request,
  });

  return [startTimestamp, progressTimestamp];
};

export const emitUploadProgress = <T extends RequestInstance>(
  requestId: string,
  request: T,
  options?: {
    total: number;
    loaded: number;
  },
) => {
  const values = options || { total: 50, loaded: 25 };
  const startTimestamp = new Date(+new Date() - 20000);
  const progressTimestamp = new Date();

  const progress = getProgressData(startTimestamp, progressTimestamp, values);
  request.client.requestManager.events.emitUploadProgress(request.queueKey, requestId, progress, {
    requestId,
    request,
  });

  return [startTimestamp, progressTimestamp];
};
