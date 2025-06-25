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
  emitDrained: <Request extends RequestInstance>(
    values: QueueDataType<Request>,
    isTriggeredExternally?: boolean,
  ): void => {
    emitter.emit(getDispatcherDrainedKey(), values, isTriggeredExternally);
    emitter.emit(getDispatcherDrainedByKey(values.queryKey), values, isTriggeredExternally);
  },
  emitQueueStatusChanged: <Request extends RequestInstance>(
    values: QueueDataType<Request>,
    isTriggeredExternally?: boolean,
  ): void => {
    emitter.emit(getDispatcherStatusKey(), values, isTriggeredExternally);
    emitter.emit(getDispatcherStatusByKey(values.queryKey), values, isTriggeredExternally);
  },
  emitQueueChanged: <Request extends RequestInstance>(
    values: QueueDataType<Request>,
    isTriggeredExternally?: boolean,
  ): void => {
    emitter.emit(getDispatcherChangeKey(), values, isTriggeredExternally);
    emitter.emit(getDispatcherChangeByKey(values.queryKey), values, isTriggeredExternally);
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
   * @param queryKey
   * @param callback
   * @returns
   */
  onDrainedByKey: <Request extends RequestInstance>(
    queryKey: string,
    callback: (values: QueueDataType<Request>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherDrainedByKey(queryKey), callback);
    return () => emitter.removeListener(getDispatcherDrainedByKey(queryKey), callback);
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
   * @param queryKey
   * @param callback
   * @returns
   */
  onQueueStatusChangeByKey: <Request extends RequestInstance>(
    queryKey: string,
    callback: (values: QueueDataType<Request>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherStatusByKey(queryKey), callback);
    return () => emitter.removeListener(getDispatcherStatusByKey(queryKey), callback);
  },
  /**
   * When new elements are added or removed from the queue
   * @param queryKey
   * @param callback
   * @returns
   */
  onQueueChange: <Request extends RequestInstance>(
    callback: (values: QueueDataType<Request>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherChangeKey(), callback);
    return () => emitter.removeListener(getDispatcherChangeKey(), callback);
  },
  /**
   * When new elements are added or removed from the queue
   * @param queryKey
   * @param callback
   * @returns
   */
  onQueueChangeByKey: <Request extends RequestInstance>(
    queryKey: string,
    callback: (values: QueueDataType<Request>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherChangeByKey(queryKey), callback);
    return () => emitter.removeListener(getDispatcherChangeByKey(queryKey), callback);
  },
});
