declare type DebounceFunction = (callback: () => void | Promise<void>) => void;
declare type UseDebounceReturnType = {
    debounce: DebounceFunction;
    resetDebounce: VoidFunction;
    active: boolean;
};
/**
 * @param delay
 * @internal
 * @returns
 */
export declare const useDebounce: (delay?: number) => UseDebounceReturnType;
export {};
