import type { ResolvedQueueItemType } from "dispatcher";
import { DispatcherMode } from "dispatcher";
import type { RequestInstance } from "request";

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

const isInDeduplicateRange = (request: RequestInstance, latestRequest: ResolvedQueueItemType) => {
  if (request.deduplicateTime) {
    return Date.now() - latestRequest.timestamp <= request.deduplicateTime;
  }
  return true;
};

export const getRequestType = (request: RequestInstance, latestRequest: ResolvedQueueItemType | undefined) => {
  const { queued, cancelable, deduplicate, used } = request;
  const canDeduplicate = latestRequest ? isInDeduplicateRange(request, latestRequest) : false;
  // Only join requests that are genuinely still ongoing. A resolved item already emitted its
  // response (a late joiner would wait forever), and a stopped item may never fire at all.
  const isOngoing = latestRequest ? !latestRequest.resolved && !latestRequest.stopped : false;

  if (queued) {
    return DispatcherMode.ONE_BY_ONE;
  }
  if (cancelable) {
    return DispatcherMode.PREVIOUS_CANCELED;
  }
  // A request marked with setUsed(true) is an intentional resend, like the auth interceptor
  // retrying after a token refresh. Deduplicating it against the original in-flight request
  // would deadlock: the retry would wait for a response that is blocked on the interceptor.
  if (canDeduplicate && isOngoing && deduplicate && !used) {
    return DispatcherMode.DEDUPLICATED;
  }
  return DispatcherMode.ALL_AT_ONCE;
};
