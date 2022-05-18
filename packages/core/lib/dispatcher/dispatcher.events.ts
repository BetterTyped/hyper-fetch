import EventEmitter from "events";

import { DispatcherLoadingEventType, DispatcherData } from "dispatcher";
import {
  getDispatcherLoadingEventKey,
  getDispatcherDrainedEventKey,
  getDispatcherStatusEventKey,
  getDispatcherChangeEventKey,
} from "./dispatcher.utils";

export const getDispatcherEvents = <HttpOptions>(emitter: EventEmitter) => ({
  setLoading: (queueKey: string, values: DispatcherLoadingEventType): void => {
    emitter.emit(getDispatcherLoadingEventKey(queueKey), values);
  },
  setDrained: <Command>(queueKey: string, values: DispatcherData<HttpOptions, Command>): void => {
    emitter.emit(getDispatcherDrainedEventKey(queueKey), values);
  },
  setQueueStatus: <Command>(queueKey: string, values: DispatcherData<HttpOptions, Command>): void => {
    emitter.emit(getDispatcherStatusEventKey(queueKey), values);
  },
  setQueueChanged: <Command>(queueKey: string, values: DispatcherData<HttpOptions, Command>): void => {
    emitter.emit(getDispatcherChangeEventKey(queueKey), values);
  },
  onLoading: (queueKey: string, callback: (values: DispatcherLoadingEventType) => void): VoidFunction => {
    emitter.on(getDispatcherLoadingEventKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherLoadingEventKey(queueKey), callback);
  },
  onDrained: <Command>(
    queueKey: string,
    callback: (values: DispatcherData<HttpOptions, Command>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherDrainedEventKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherDrainedEventKey(queueKey), callback);
  },
  onQueueStatus: <Command>(
    queueKey: string,
    callback: (values: DispatcherData<HttpOptions, Command>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherStatusEventKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherStatusEventKey(queueKey), callback);
  },
  onQueueChange: <Command>(
    queueKey: string,
    callback: (values: DispatcherData<HttpOptions, Command>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherChangeEventKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherChangeEventKey(queueKey), callback);
  },
});
