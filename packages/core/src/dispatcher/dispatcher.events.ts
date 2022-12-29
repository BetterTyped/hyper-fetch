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
  setQueueStatus: <Request extends RequestInstance>(queueKey: string, values: QueueDataType<Request>): void => {
    emitter.emit(getDispatcherStatusEventKey(queueKey), values);
  },
  setQueueChanged: <Request extends RequestInstance>(queueKey: string, values: QueueDataType<Request>): void => {
    emitter.emit(getDispatcherChangeEventKey(queueKey), values);
  },
  onDrained: <Request extends RequestInstance>(
    queueKey: string,
    callback: (values: QueueDataType<Request>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherDrainedEventKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherDrainedEventKey(queueKey), callback);
  },
  onQueueStatus: <Request extends RequestInstance>(
    queueKey: string,
    callback: (values: QueueDataType<Request>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherStatusEventKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherStatusEventKey(queueKey), callback);
  },
  onQueueChange: <Request extends RequestInstance>(
    queueKey: string,
    callback: (values: QueueDataType<Request>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherChangeEventKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherChangeEventKey(queueKey), callback);
  },
});
