import { ExtractError } from "types";
import { FetchEffectConfig } from "effect";
import { CommandInstance } from "command";
import { ClientResponseErrorType, ClientResponseType, ClientResponseSuccessType } from "client";
export declare class FetchEffect<T extends CommandInstance> {
    config: FetchEffectConfig<T>;
    constructor(config: FetchEffectConfig<T>);
    getEffectKey: () => string;
    onTrigger: (command: T) => void;
    onStart: (command: T) => void;
    onSuccess: (response: ClientResponseSuccessType<ResponseType>, command: T) => void;
    onError: (response: ClientResponseErrorType<ExtractError<T>>, command: T) => void;
    onFinished: (response: ClientResponseType<ResponseType, ExtractError<T>>, command: T) => void;
}
