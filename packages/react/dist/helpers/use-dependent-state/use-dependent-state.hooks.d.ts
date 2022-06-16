import { UseDependentStateProps, UseDependentStateReturn } from "./use-dependent-state.types";
/**
 *
 * @param command
 * @param initialData
 * @param dispatcher
 * @param dependencies
 * @internal
 */
export declare const useDependentState: <T extends Command<any, any, any, any, any, any, any, any, any, any, any>>({ command, dispatcher, initialData, deepCompare, dependencyTracking, defaultCacheEmitting, }: UseDependentStateProps<T>) => UseDependentStateReturn<T>;
