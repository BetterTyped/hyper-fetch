import { FetchProgressType, ClientResponseType } from "client";
import { ClientProgressEvent, CommandInstance, CommandDump } from "command";
import { Dispatcher } from "dispatcher";
import { ExtractError, ExtractResponse } from "types";
export declare const stringifyKey: (value: unknown) => string;
export declare const getProgressValue: ({ loaded, total }: ClientProgressEvent) => number;
export declare const getRequestEta: (startDate: Date, progressDate: Date, { total, loaded }: ClientProgressEvent) => {
    sizeLeft: number;
    timeLeft: number | null;
};
export declare const getProgressData: (requestStartTime: Date, progressDate: Date, progressEvent: ClientProgressEvent) => FetchProgressType;
export declare const getSimpleKey: (command: CommandInstance | CommandDump<CommandInstance>) => string;
/**
 * Cache instance for individual command that collects individual requests responses from
 * the same endpoint (they may differ base on the custom key, endpoint params etc)
 * @param command
 * @returns
 */
export declare const getCommandKey: (command: CommandInstance | CommandDump<CommandInstance>, useInitialValues?: boolean) => string;
export declare const getCommandDispatcher: <Command extends CommandInstance>(command: Command, dispatcherType?: "auto" | "fetch" | "submit") => [Dispatcher, boolean];
export declare const commandSendRequest: <T extends CommandInstance>(command: T, dispatcherType?: "auto" | "fetch" | "submit", requestCallback?: (requestId: string, command: T) => void) => Promise<ClientResponseType<ExtractResponse<T>, ExtractError<T>>>;
