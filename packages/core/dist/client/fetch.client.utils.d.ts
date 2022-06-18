import { CommandInstance } from "command";
import { ExtractError } from "types";
export declare const getRequestConfig: <T extends Record<string, unknown> = Record<string, unknown>>(command: CommandInstance) => T;
export declare const getErrorMessage: (errorCase?: "timeout" | "abort" | "deleted") => Error;
export declare const parseResponse: (response: string | unknown) => any;
export declare const parseErrorResponse: <T extends CommandInstance>(response: unknown) => ExtractError<T>;
