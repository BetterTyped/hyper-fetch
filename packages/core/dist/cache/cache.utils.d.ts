import { CommandInstance } from "command";
import { ExtractFetchReturn } from "types";
export declare const getCacheData: <T extends CommandInstance>(previousResponse: ExtractFetchReturn<T>, response: ExtractFetchReturn<T>) => ExtractFetchReturn<T>;
export declare const getRevalidateEventKey: (key: string) => string;
export declare const getCacheKey: (key: string) => string;
export declare const getCacheIdKey: (key: string) => string;
