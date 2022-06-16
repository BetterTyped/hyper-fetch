import { UseQueueOptions, QueueRequest } from "use-queue";
/**
 * This hook allows to control dispatchers request queues
 * @param command
 * @param options
 * @returns
 */
export declare const useQueue: <Command extends Command<any, any, any, any, any, any, any, any, any, any, any>>(command: Command, options?: UseQueueOptions) => {
    stopped: boolean;
    requests: QueueRequest<Command>[];
    stop: () => any;
    pause: () => any;
    start: () => any;
};
