import { CommandInstance } from "command";
import { ClientResponseErrorType, ClientResponseType, ClientResponseSuccessType } from "client";
import { FetchEffect } from "effect";
import { ExtractError } from "types";
export declare type FetchEffectLifecycle = "trigger" | "start" | "success" | "error" | "finished";
export declare type FetchEffectInstance = FetchEffect<CommandInstance>;
export declare type FetchEffectConfig<T extends CommandInstance> = {
    effectKey: string;
    onTrigger?: (command: CommandInstance) => void;
    onStart?: (command: CommandInstance) => void;
    onSuccess?: (response: ClientResponseSuccessType<ResponseType>, command: CommandInstance) => void;
    onError?: (response: ClientResponseErrorType<ExtractError<T>>, command: CommandInstance) => void;
    onFinished?: (response: ClientResponseType<ResponseType, ExtractError<T>>, command: CommandInstance) => void;
};
