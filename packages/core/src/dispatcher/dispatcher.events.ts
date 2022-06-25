import EventEmitter from "events";

import {
  DispatcherData,
  getDispatcherChangeEventKey,
  getDispatcherStatusEventKey,
  getDispatcherDrainedEventKey,
} from "dispatcher";
import { CommandInstance } from "command";

export const getDispatcherEvents = (emitter: EventEmitter) => ({
  setDrained: <Command extends CommandInstance>(queueKey: string, values: DispatcherData<Command>): void => {
    emitter.emit(getDispatcherDrainedEventKey(queueKey), values);
  },
  setQueueStatus: <Command extends CommandInstance>(queueKey: string, values: DispatcherData<Command>): void => {
    emitter.emit(getDispatcherStatusEventKey(queueKey), values);
  },
  setQueueChanged: <Command extends CommandInstance>(queueKey: string, values: DispatcherData<Command>): void => {
    emitter.emit(getDispatcherChangeEventKey(queueKey), values);
  },
  onDrained: <Command extends CommandInstance>(
    queueKey: string,
    callback: (values: DispatcherData<Command>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherDrainedEventKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherDrainedEventKey(queueKey), callback);
  },
  onQueueStatus: <Command extends CommandInstance>(
    queueKey: string,
    callback: (values: DispatcherData<Command>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherStatusEventKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherStatusEventKey(queueKey), callback);
  },
  onQueueChange: <Command extends CommandInstance>(
    queueKey: string,
    callback: (values: DispatcherData<Command>) => void,
  ): VoidFunction => {
    emitter.on(getDispatcherChangeEventKey(queueKey), callback);
    return () => emitter.removeListener(getDispatcherChangeEventKey(queueKey), callback);
  },
});
