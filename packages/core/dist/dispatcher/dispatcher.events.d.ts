import EventEmitter from "events";
import { DispatcherData, DispatcherLoadingEventType } from "dispatcher";
import { CommandInstance } from "command";
export declare const getDispatcherEvents: (emitter: EventEmitter) => {
    setLoading: (queueKey: string, requestId: string, values: DispatcherLoadingEventType) => void;
    emitRemove: (requestId: string) => void;
    setDrained: <Command extends CommandInstance>(queueKey: string, values: DispatcherData<Command>) => void;
    setQueueStatus: <Command_1 extends CommandInstance>(queueKey: string, values: DispatcherData<Command_1>) => void;
    setQueueChanged: <Command_2 extends CommandInstance>(queueKey: string, values: DispatcherData<Command_2>) => void;
    onLoading: (queueKey: string, callback: (values: DispatcherLoadingEventType) => void) => VoidFunction;
    onLoadingById: (requestId: string, callback: (values: DispatcherLoadingEventType) => void) => VoidFunction;
    onRemove: (requestId: string, callback: () => void) => VoidFunction;
    onDrained: <Command_3 extends CommandInstance>(queueKey: string, callback: (values: DispatcherData<Command_3>) => void) => VoidFunction;
    onQueueStatus: <Command_4 extends CommandInstance>(queueKey: string, callback: (values: DispatcherData<Command_4>) => void) => VoidFunction;
    onQueueChange: <Command_5 extends CommandInstance>(queueKey: string, callback: (values: DispatcherData<Command_5>) => void) => VoidFunction;
};
