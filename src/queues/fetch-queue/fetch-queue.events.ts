import EventEmitter from "events";

import { CacheKeyType } from "cache";
import { FetchLoadingEventType } from "queues";
import { getFetchLoadingEventKey } from "./fetch-queue.utils";

export const getFetchQueueEvents = (emitter: EventEmitter) => ({
  setLoading: (key: CacheKeyType, values: FetchLoadingEventType): void => {
    emitter.emit(getFetchLoadingEventKey(key), values);
  },
  getLoading: (key: CacheKeyType, callback: (values: FetchLoadingEventType) => void): VoidFunction => {
    emitter.on(getFetchLoadingEventKey(key), callback);
    return () => emitter.removeListener(getFetchLoadingEventKey(key), callback);
  },
  umount: <T extends (...args: any[]) => void>(key: CacheKeyType, callback: T): void => {
    emitter.removeListener(key, callback);
  },
});
