/// <reference types="node" />
import EventEmitter from "events";
import { DispatcherData, DispatcherOptionsType, DispatcherStorageType, DispatcherDumpValueType, RunningRequestValueType } from "dispatcher";
import { BuilderInstance } from "builder";
import { CommandInstance } from "command";
/**
 * Dispatcher class was made to store controlled request Fetches, and firing them all-at-once or one-by-one in command queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.
 */
export declare class Dispatcher {
    private builder;
    options?: DispatcherOptionsType;
    emitter: EventEmitter;
    events: {
        setLoading: (queueKey: string, requestId: string, values: import("dispatcher").DispatcherLoadingEventType) => void;
        emitRemove: (requestId: string) => void;
        setDrained: <Command_1 extends CommandInstance>(queueKey: string, values: DispatcherData<Command_1>) => void;
        setQueueStatus: <Command_2 extends CommandInstance>(queueKey: string, values: DispatcherData<Command_2>) => void;
        setQueueChanged: <Command_3 extends CommandInstance>(queueKey: string, values: DispatcherData<Command_3>) => void;
        onLoading: (queueKey: string, callback: (values: import("dispatcher").DispatcherLoadingEventType) => void) => VoidFunction;
        onLoadingById: (requestId: string, callback: (values: import("dispatcher").DispatcherLoadingEventType) => void) => VoidFunction;
        onRemove: (requestId: string, callback: () => void) => VoidFunction;
        onDrained: <Command_4 extends CommandInstance>(queueKey: string, callback: (values: DispatcherData<Command_4>) => void) => VoidFunction;
        onQueueStatus: <Command_5 extends CommandInstance>(queueKey: string, callback: (values: DispatcherData<Command_5>) => void) => VoidFunction;
        onQueueChange: <Command_6 extends CommandInstance>(queueKey: string, callback: (values: DispatcherData<Command_6>) => void) => VoidFunction;
    };
    storage: DispatcherStorageType;
    private requestCount;
    private runningRequests;
    constructor(builder: BuilderInstance, options?: DispatcherOptionsType);
    /**
     * Start request handling by queueKey
     */
    start: (queueKey: string) => void;
    /**
     * Pause request queue, but not cancel already started requests
     */
    pause: (queueKey: string) => void;
    /**
     * Stop request queue and cancel all started requests - those will be treated like not started
     */
    stop: (queueKey: string) => void;
    /**
     * Return all
     */
    getQueuesKeys: () => string[];
    /**
     * Return queue state object
     */
    getQueue: <Command_1 extends CommandInstance = CommandInstance>(queueKey: string) => {
        requests: any[];
        stopped: boolean;
    };
    /**
     * Get value of the active queue status based on the stopped status
     */
    getIsActiveQueue: (queueKey: string) => boolean;
    /**
     * Add new element to storage
     */
    addQueueElement: <Command_1 extends CommandInstance = CommandInstance>(queueKey: string, dispatcherDump: DispatcherDumpValueType<Command_1>) => void;
    /**
     * Set new queue storage value
     */
    setQueue: <Command_1 extends CommandInstance = CommandInstance>(queueKey: string, queue: DispatcherData<Command_1>) => DispatcherData<Command_1>;
    /**
     * Clear requests from queue cache
     */
    clearQueue: (queueKey: string) => {
        requests: any[];
        stopped: boolean;
    };
    /**
     * Method used to flush the queue requests
     */
    flushQueue: (queueKey: string) => Promise<void>;
    /**
     * Flush all available requests from all queues
     */
    flush: () => Promise<void>;
    /**
     * Clear all running requests and storage
     */
    clear: () => void;
    /**
     * Start particular request
     */
    startRequest: (queueKey: string, requestId: string) => void;
    /**
     * Stop particular request
     */
    stopRequest: (queueKey: string, requestId: string) => void;
    /**
     * Get currently running requests from all queueKeys
     */
    getAllRunningRequest: () => RunningRequestValueType[];
    /**
     * Get currently running requests
     */
    getRunningRequests: (queueKey: string) => RunningRequestValueType[];
    /**
     * Get running request by id
     */
    getRunningRequest: (queueKey: string, requestId: string) => RunningRequestValueType;
    /**
     * Add request to the running requests list
     */
    addRunningRequest: (queueKey: string, requestId: string, command: CommandInstance) => void;
    /**
     * Get the value based on the currently running requests
     */
    hasRunningRequests: (queueKey: string) => boolean;
    /**
     * Check if request is currently processing
     */
    hasRunningRequest: (queueKey: string, requestId: string) => boolean;
    /**
     * Cancel all started requests, but do NOT remove it from main storage
     */
    cancelRunningRequests: (queueKey: string) => void;
    /**
     * Cancel started request, but do NOT remove it from main storage
     */
    cancelRunningRequest: (queueKey: string, requestId: string) => void;
    /**
     * Delete all started requests, but do NOT clear it from queue and do NOT cancel them
     */
    deleteRunningRequests: (queueKey: string) => void;
    /**
     * Delete request by id, but do NOT clear it from queue and do NOT cancel them
     */
    deleteRunningRequest: (queueKey: string, requestId: string) => void;
    /**
     * Get count of requests from the same queueKey
     */
    getQueueRequestCount: (queueKey: string) => number;
    /**
     * Add request count to the queueKey
     */
    incrementQueueRequestCount: (queueKey: string) => void;
    /**
     * Create storage element from command
     */
    createStorageElement: <Command_1 extends CommandInstance>(command: Command_1) => DispatcherDumpValueType<Command_1>;
    /**
     * Add command to the dispatcher handler
     */
    add: (command: CommandInstance) => any;
    /**
     * Delete and cancel request from the storage
     */
    delete: (queueKey: string, requestId: string, abortKey: string) => {
        requests: any[];
        stopped: boolean;
    };
    /**
     * Request can run for some time, once it's done, we have to check if it's successful or if it was aborted
     * It can be different once the previous call was set as cancelled and removed from queue before this request got resolved
     */
    performRequest: (storageElement: DispatcherDumpValueType) => Promise<void>;
}
