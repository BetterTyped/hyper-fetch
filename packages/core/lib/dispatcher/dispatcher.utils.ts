import { FetchCommandInstance } from "command";
import { DispatcherRequestType } from "dispatcher";
import { ClientResponseType } from "client";

// Events

export const getDispatcherLoadingEventKey = (key: string): string => {
  return `${key}-loading-event`;
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

export const getRequestType = (command: FetchCommandInstance, hasRequests: boolean) => {
  const { concurrent, cancelable, deduplicate } = command;

  if (!concurrent) {
    return DispatcherRequestType.oneByOne;
  }
  if (cancelable) {
    return DispatcherRequestType.previousCanceled;
  }
  if (hasRequests && deduplicate) {
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
