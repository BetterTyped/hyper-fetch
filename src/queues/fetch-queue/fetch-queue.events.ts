import EventEmitter from "events";

import { CacheKeyType } from "cache";
import { getLoadingEventKey } from "./fetch-queue.utils";

export const fetchQueueEventEmitter = new EventEmitter();

export const FETCH_QUEUE_EVENTS = {
  setLoading: (key: CacheKeyType, value: boolean): void => {
    fetchQueueEventEmitter.emit(getLoadingEventKey(key), value);
  },
  getLoading: (key: CacheKeyType, callback: (value: boolean) => void): void => {
    fetchQueueEventEmitter.on(getLoadingEventKey(key), callback);
  },
  umountLoading: (key: CacheKeyType, callback: (value: boolean) => void): void => {
    fetchQueueEventEmitter.removeListener(getLoadingEventKey(key), callback);
  },
};
