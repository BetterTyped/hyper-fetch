import { FetchProgressType, CommandInstance, DispatcherDumpValueType } from "@better-typed/hyper-fetch";
export declare type UseQueueOptions = {
    queueType?: "auto" | "fetch" | "submit";
};
export declare type QueueRequest<Command extends CommandInstance> = DispatcherDumpValueType<Command> & {
    uploading?: FetchProgressType;
    downloading?: FetchProgressType;
    startRequest: () => void;
    stopRequest: () => void;
    deleteRequest: () => void;
};
export declare type UseQueueReturnType<T extends CommandInstance> = {
    stopped: boolean;
    requests: QueueRequest<T>[];
    stop: () => void;
    pause: () => void;
    start: () => void;
};
