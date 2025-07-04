import { RequestInstance } from "request";
import { DispatcherMode, QueueItemType } from "dispatcher";

// Events

export const getDispatcherDrainedKey = (): string => {
  return `drained-event`;
};
export const getDispatcherDrainedByKey = (key: string): string => {
  return `${key}-drained-event`;
};
export const getDispatcherStatusKey = (): string => {
  return `status-event`;
};
export const getDispatcherStatusByKey = (key: string): string => {
  return `${key}-status-event`;
};
export const getDispatcherChangeKey = (): string => {
  return `change-event`;
};
export const getDispatcherChangeByKey = (key: string): string => {
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

const isInDeduplicateRange = (request: RequestInstance, latestRequest: QueueItemType) => {
  if (request.deduplicateTime) {
    return +new Date() - latestRequest.timestamp <= request.deduplicateTime;
  }
  return true;
};

export const getRequestType = (request: RequestInstance, latestRequest: QueueItemType | undefined) => {
  const { queued, cancelable, deduplicate } = request;
  const canDeduplicate = latestRequest ? isInDeduplicateRange(request, latestRequest) : false;

  if (queued) {
    return DispatcherMode.ONE_BY_ONE;
  }
  if (cancelable) {
    return DispatcherMode.PREVIOUS_CANCELED;
  }
  if (canDeduplicate && deduplicate) {
    return DispatcherMode.DEDUPLICATED;
  }
  return DispatcherMode.ALL_AT_ONCE;
};
