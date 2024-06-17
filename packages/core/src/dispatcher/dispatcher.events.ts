import EventEmitter from "events";

import {
  QueueDataType,
  getDispatcherChangeKey,
  getDispatcherChangeByKey,
  getDispatcherStatusKey,
  getDispatcherStatusByKey,
  getDispatcherDrainedKey,
  getDispatcherDrainedByKey,
} from "dispatcher";
import { RequestInstance } from "request";

export const getDispatcherEvents = (emitter: EventEmitter) => ({
  setDrained: <Request extends RequestInstance>(queueKey: string, values: QueueDataType<Request>): void => {
    emitter.emit(getDispatcherDrainedKey(), values);
    emitter.emit(getDispatcherDrainedByKey(queueKey), values);
  },
  setQueueStatusChanged: <Request extends RequestInstance>(queueKey: string, values: QueueDataType<Request>): void => {
    emitter.emit(getDispatcherStatusKey(), values);
    emitter.emit(getDispatcherStatusByKey(queueKey), values);
  },
  setQueueChanged: <Request extends RequestInstance>(queueKey: string, values: QueueDataType<Request>): void => {
    emitter.emit(getDispatcherChangeKey(), values);
    emitter.emit(getDispatcherChangeByKey(queueKey), values);
  },
  /**
   * When queue becomes empty
   * @param callback
   * @returns
   */
  onDrained: <Request extends RequestInstance>(callback: (values: QueueDataType<Request>) => void): VoidFunction => {
    emitter.on(getDispatcherDrainedKey(), callback);
    return () => emitter.removeListener(getDispatcherDrainedKey(), callback);
  },
  /**
   * When queue becomes empty
   * @param queueKey
   * @param callback
   * @returns
   */
  onDrainedByKey: <Request extends RequestInstance>(
    queueKey: string,
    callback: (values: QueueDataType<Request>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherDrainedByKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherDrainedByKey(queueKey), callback);
  },
  /**
   * When queue status change from enabled to paused or vice versa
   * @param callback
   * @returns
   */
  onQueueStatusChange: <Request extends RequestInstance>(
    callback: (values: QueueDataType<Request>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherStatusKey(), callback);
    return () => emitter.removeListener(getDispatcherStatusKey(), callback);
  },
  /**
   * When queue status change from enabled to paused or vice versa
   * @param queueKey
   * @param callback
   * @returns
   */
  onQueueStatusChangeByKey: <Request extends RequestInstance>(
    queueKey: string,
    callback: (values: QueueDataType<Request>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherStatusByKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherStatusByKey(queueKey), callback);
  },
  /**
   * When new elements are added or removed from the queue
   * @param queueKey
   * @param callback
   * @returns
   */
  onQueueChange: <Request extends RequestInstance>(
    queueKey: string,
    callback: (values: QueueDataType<Request>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherChangeKey(), callback);
    return () => emitter.removeListener(getDispatcherChangeKey(), callback);
  },
  /**
   * When new elements are added or removed from the queue
   * @param queueKey
   * @param callback
   * @returns
   */
  onQueueChangeByKey: <Request extends RequestInstance>(
    queueKey: string,
    callback: (values: QueueDataType<Request>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherChangeByKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherChangeByKey(queueKey), callback);
  },
});
