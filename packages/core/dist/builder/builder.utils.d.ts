import { ClientQueryParamsType, QueryStringifyOptions } from "client";
import { CommandInstance } from "command";
import { NegativeTypes } from "types";
export declare const stringifyValue: (response: string | unknown) => string;
export declare const getClientHeaders: (command: CommandInstance) => HeadersInit;
export declare const getClientPayload: (data: unknown) => string | FormData;
export declare const stringifyQueryParams: (queryParams: ClientQueryParamsType | string | NegativeTypes, options?: QueryStringifyOptions) => string;
