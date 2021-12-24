import EventEmitter from "events";

import { CacheKeyType } from "cache";
import { FetchLoadingEventType } from "queues";
import { getFetchLoadingEventKey } from "./fetch-queue.utils";

export const fetchQueueEventEmitter = new EventEmitter();

export const FETCH_QUEUE_EVENTS = {
  setLoading: (key: CacheKeyType, values: FetchLoadingEventType): void => {
    fetchQueueEventEmitter.emit(getFetchLoadingEventKey(key), values);
  },
  getLoading: (key: CacheKeyType, callback: (values: FetchLoadingEventType) => void): void => {
    fetchQueueEventEmitter.on(getFetchLoadingEventKey(key), callback);
  },
  umount: <T extends (...args: any[]) => void>(key: CacheKeyType, callback: T): void => {
    fetchQueueEventEmitter.removeListener(getFetchLoadingEventKey(key), callback);
  },
};
