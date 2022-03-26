import EventEmitter from "events";

import { QueueLoadingEventType, QueueData } from "queue";
import {
  getQueueLoadingEventKey,
  getQueueDrainedEventKey,
  getQueueStatusEventKey,
  getQueueChangeEventKey,
} from "./queue.utils";

export const getQueueEvents = <HttpOptions>(emitter: EventEmitter) => ({
  setLoading: (queueKey: string, values: QueueLoadingEventType): void => {
    emitter.emit(getQueueLoadingEventKey(queueKey), values);
  },
  setDrained: <Command>(queueKey: string, values: QueueData<HttpOptions, Command>): void => {
    emitter.emit(getQueueDrainedEventKey(queueKey), values);
  },
  setQueueStatus: <Command>(queueKey: string, values: QueueData<HttpOptions, Command>): void => {
    emitter.emit(getQueueStatusEventKey(queueKey), values);
  },
  setQueueChanged: <Command>(queueKey: string, values: QueueData<HttpOptions, Command>): void => {
    emitter.emit(getQueueChangeEventKey(queueKey), values);
  },
  onLoading: (queueKey: string, callback: (values: QueueLoadingEventType) => void): VoidFunction => {
    emitter.on(getQueueLoadingEventKey(queueKey), callback);
    return () => emitter.removeListener(getQueueLoadingEventKey(queueKey), callback);
  },
  onDrained: <Command>(queueKey: string, callback: (values: QueueData<HttpOptions, Command>) => void): VoidFunction => {
    emitter.on(getQueueDrainedEventKey(queueKey), callback);
    return () => emitter.removeListener(getQueueDrainedEventKey(queueKey), callback);
  },
  onQueueStatus: <Command>(
    queueKey: string,
    callback: (values: QueueData<HttpOptions, Command>) => void,
  ): VoidFunction => {
    emitter.on(getQueueStatusEventKey(queueKey), callback);
    return () => emitter.removeListener(getQueueStatusEventKey(queueKey), callback);
  },
  onQueueChange: <Command>(
    queueKey: string,
    callback: (values: QueueData<HttpOptions, Command>) => void,
  ): VoidFunction => {
    emitter.on(getQueueChangeEventKey(queueKey), callback);
    return () => emitter.removeListener(getQueueChangeEventKey(queueKey), callback);
  },
  umount: <T extends (...args: any[]) => void>(queueKey: string, callback: T): void => {
    emitter.removeListener(queueKey, callback);
  },
});
