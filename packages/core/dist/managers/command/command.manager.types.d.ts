import { CommandInstance } from "command";
export declare type CommandEventDetails<T extends CommandInstance> = {
    requestId: string;
    command: T;
};
export declare type CommandResponseDetails = {
    retries: number;
    timestamp: Date;
    isFailed: boolean;
    isCanceled: boolean;
    isOffline: boolean;
};
