import { CacheValueType, NullableType, CommandInstance, ClientResponseType, ExtractResponse, ExtractError, Dispatcher } from "@better-typed/hyper-fetch";
import { UseDependentStateType } from "helpers";
export declare const getDetailsState: (state?: UseDependentStateType<CommandInstance>, details?: CommandResponseDetails) => CommandResponseDetails;
export declare const isStaleCacheData: (cacheTime: NullableType<number>, cacheTimestamp: NullableType<Date | number>) => boolean;
export declare const getValidCacheData: <T extends Command<any, any, any, any, any, any, any, any, any, any, any>>(command: T, initialData: ClientResponseType<ExtractResponse<T_1>, ExtractError<T_1>>, cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => CacheValueType<ExtractResponse<T>, ExtractError<T>>;
export declare const getTimestamp: (timestamp?: NullableType<number | Date>) => Date;
export declare const responseToCacheValue: <T>(response: ClientResponseType<ExtractResponse<T>, ExtractError<T>>) => NullableType<CacheValueType>;
export declare const getInitialState: <T extends Command<any, any, any, any, any, any, any, any, any, any, any>>(initialData: ClientResponseType<ExtractResponse<T>, ExtractError<T>>, dispatcher: Dispatcher, command: T) => UseDependentStateType<T>;
