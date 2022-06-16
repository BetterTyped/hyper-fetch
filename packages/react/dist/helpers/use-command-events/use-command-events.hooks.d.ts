import { UseCommandEventsReturnType, UseCommandEventsOptionsType } from "helpers";
/**
 * This is helper hook that handles main Hyper-Fetch event/data flow
 * @internal
 * @param options
 * @returns
 */
export declare const useCommandEvents: <T extends Command<any, any, any, any, any, any, any, any, any, any, any>>({ command, dispatcher, logger, state, actions, setCacheData, initializeCallbacks, }: UseCommandEventsOptionsType<T>) => UseCommandEventsReturnType<T>;
