import EventEmitter from "events";

import { CacheKeyType } from "cache";
import { FetchLoadingEventType } from "queues";
import { getLoadingEventKey } from "./fetch-queue.utils";

export const fetchQueueEventEmitter = new EventEmitter();

export const FETCH_QUEUE_EVENTS = {
  setLoading: (key: CacheKeyType, values: FetchLoadingEventType): void => {
    fetchQueueEventEmitter.emit(getLoadingEventKey(key), values);
  },
  getLoading: (key: CacheKeyType, callback: (values: FetchLoadingEventType) => void): void => {
    fetchQueueEventEmitter.on(getLoadingEventKey(key), callback);
  },
  umount: <T extends (...args: any[]) => void>(key: CacheKeyType, callback: T): void => {
    fetchQueueEventEmitter.removeListener(getLoadingEventKey(key), callback);
  },
};
