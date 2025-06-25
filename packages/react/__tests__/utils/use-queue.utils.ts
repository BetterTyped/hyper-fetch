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
    dispatcherType?: "fetch" | "submit" | "auto";
  },
) => {
  const { stop = false, dispatcherType = "auto" } = options || {};
  const [dispatcher] = getRequestDispatcher(request, dispatcherType);
  if (stop) dispatcher.stop(request.queryKey);
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
  request.client.requestManager.events.emitDownloadProgress({
    ...progress,
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
  request.client.requestManager.events.emitUploadProgress({
    ...progress,
    requestId,
    request,
  });

  return [startTimestamp, progressTimestamp];
};
