import EventEmitter from "events";

import { CacheKeyType } from "cache";
import { SubmitLoadingEventType } from "queues";
import { getSubmitLoadingEventKey } from "./submit-queue.utils";

export const submitQueueEventEmitter = new EventEmitter();

export const SUBMIT_QUEUE_EVENTS = {
  setLoading: (key: CacheKeyType, values: SubmitLoadingEventType): void => {
    submitQueueEventEmitter.emit(getSubmitLoadingEventKey(key), values);
  },
  getLoading: (key: CacheKeyType, callback: (values: SubmitLoadingEventType) => void): void => {
    submitQueueEventEmitter.on(getSubmitLoadingEventKey(key), callback);
  },
  umount: <T extends (...args: any[]) => void>(key: CacheKeyType, callback: T): void => {
    submitQueueEventEmitter.removeListener(getSubmitLoadingEventKey(key), callback);
  },
};
