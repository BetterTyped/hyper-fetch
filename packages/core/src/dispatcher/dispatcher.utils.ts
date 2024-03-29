import { RequestInstance } from "request";
import { DispatcherRequestType, QueueElementType } from "dispatcher";

// Events

export const getDispatcherDrainedEventKey = (key: string): string => {
  return `${key}-drained-event`;
};
export const getDispatcherStatusEventKey = (key: string): string => {
  return `${key}-status-event`;
};
export const getDispatcherChangeEventKey = (key: string): string => {
  return `${key}-change-event`;
};

// Requesting

export const getIsEqualTimestamp = (currentTimestamp: number, threshold: number, queueTimestamp?: number): boolean => {
  if (!queueTimestamp) {
    return false;
  }
  return queueTimestamp - currentTimestamp <= threshold;
};

export const canRetryRequest = (currentRetries: number, retry: number | undefined) => {
  if (retry && currentRetries < retry) {
    return true;
  }
  return false;
};

export const getRequestType = (request: RequestInstance, latestRequest: QueueElementType | undefined) => {
  const { queued, cancelable, deduplicate } = request;
  const canDeduplicate = latestRequest ? +new Date() - latestRequest.timestamp <= request.deduplicateTime : false;

  if (queued) {
    return DispatcherRequestType.oneByOne;
  }
  if (cancelable) {
    return DispatcherRequestType.previousCanceled;
  }
  if (canDeduplicate && deduplicate) {
    return DispatcherRequestType.deduplicated;
  }
  return DispatcherRequestType.allAtOnce;
};
