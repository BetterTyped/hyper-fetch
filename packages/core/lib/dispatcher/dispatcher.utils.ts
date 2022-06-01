import { FetchCommandInstance } from "command";
import { ClientResponseType } from "client";
import { DispatcherRequestType, DispatcherDumpValueType } from "dispatcher";

// Events

export const getDispatcherLoadingEventKey = (key: string): string => {
  return `${key}-loading-event`;
};
export const getDispatcherLoadingIdEventKey = (key: string): string => {
  return `${key}-loading-event-by-id`;
};
export const getDispatcherRemoveEventKey = (key: string): string => {
  return `${key}-remove-event`;
};
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

export const canRetryRequest = (retries: number, retry: number | boolean | undefined) => {
  if (retry === true) {
    return true;
  }
  if (retry && retries <= retry - 1) {
    return true;
  }
  return false;
};

export const getRequestType = (command: FetchCommandInstance, latestRequest: DispatcherDumpValueType | undefined) => {
  const { queued, cancelable, deduplicate } = command;
  const canDeduplicate = latestRequest ? +new Date() - latestRequest.timestamp <= command.deduplicateTime : false;

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

export const isFailedRequest = (data: ClientResponseType<unknown, unknown>) => {
  const [, , status] = data;
  if (!status || status >= 400) {
    return true;
  }
  return false;
};
