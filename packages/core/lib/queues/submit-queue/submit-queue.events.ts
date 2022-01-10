import EventEmitter from "events";

import { CacheKeyType } from "cache";
import { SubmitLoadingEventType, SubmitQueueStatusEventType } from "queues";
import { getSubmitDrainedEventKey, getSubmitLoadingEventKey, getSubmitQueueEventKey } from "./submit-queue.utils";

export const getSubmitQueueEvents = (emitter: EventEmitter) => ({
  setLoading: (key: CacheKeyType, values: SubmitLoadingEventType): void => {
    emitter.emit(getSubmitLoadingEventKey(key), values);
  },
  setDrained: (key: CacheKeyType, values: SubmitLoadingEventType): void => {
    emitter.emit(getSubmitDrainedEventKey(key), values);
  },
  setQueueStatus: (key: CacheKeyType, values: SubmitQueueStatusEventType): void => {
    emitter.emit(getSubmitQueueEventKey(key), values);
  },
  getLoading: (key: CacheKeyType, callback: (values: SubmitLoadingEventType) => void): VoidFunction => {
    emitter.on(getSubmitLoadingEventKey(key), callback);
    return () => emitter.removeListener(getSubmitLoadingEventKey(key), callback);
  },
  getDrained: (key: CacheKeyType, callback: () => void): VoidFunction => {
    emitter.on(getSubmitDrainedEventKey(key), callback);
    return () => emitter.removeListener(getSubmitDrainedEventKey(key), callback);
  },
  getQueueStatus: (key: CacheKeyType, callback: (values: SubmitQueueStatusEventType) => void): VoidFunction => {
    emitter.on(getSubmitQueueEventKey(key), callback);
    return () => emitter.removeListener(getSubmitQueueEventKey(key), callback);
  },
  umount: <T extends (...args: any[]) => void>(key: CacheKeyType, callback: T): void => {
    emitter.removeListener(key, callback);
  },
});
