import EventEmitter from "events";

import {
  QueueDataType,
  getDispatcherChangeEventKey,
  getDispatcherStatusEventKey,
  getDispatcherDrainedEventKey,
} from "dispatcher";
import { RequestInstance } from "request";

export const getDispatcherEvents = (emitter: EventEmitter) => ({
  setDrained: <Request extends RequestInstance>(queueKey: string, values: QueueDataType<Request>): void => {
    emitter.emit(getDispatcherDrainedEventKey(queueKey), values);
  },
  setQueueStatusChanged: <Request extends RequestInstance>(queueKey: string, values: QueueDataType<Request>): void => {
    emitter.emit(getDispatcherStatusEventKey(queueKey), values);
  },
  setQueueChanged: <Request extends RequestInstance>(queueKey: string, values: QueueDataType<Request>): void => {
    emitter.emit(getDispatcherChangeEventKey(queueKey), values);
  },
  /**
   * When queue becomes empty
   * @param queueKey
   * @param callback
   * @returns
   */
  onDrained: <Request extends RequestInstance>(
    queueKey: string,
    callback: (values: QueueDataType<Request>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherDrainedEventKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherDrainedEventKey(queueKey), callback);
  },
  /**
   * When queue status change from enabled to paused or vice versa
   * @param queueKey
   * @param callback
   * @returns
   */
  onQueueStatusChange: <Request extends RequestInstance>(
    queueKey: string,
    callback: (values: QueueDataType<Request>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherStatusEventKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherStatusEventKey(queueKey), callback);
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
    emitter.on(getDispatcherChangeEventKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherChangeEventKey(queueKey), callback);
  },
});
