import type { RequestInstance, ExtractResponseType, ExtractErrorType, CacheValueType } from "@hyper-fetch/core";
import type { UseTrackedStateActions, UseTrackedStateSelect, UseTrackedStateType } from "helpers";
import type { isEqual } from "utils";

export type UseCacheOptionsType<T extends RequestInstance, TSelected = ExtractResponseType<T>> = {
  /**
   * If `true` it will rerender only when values used by our component gets changed. Otherwise it will rerender on any change.
   */
  dependencyTracking?: boolean;
  /**
   * If cache is empty we can use placeholder data.
   */
  initialResponse?: CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>>["data"] | null;
  /**
   * Deep comparison function for hook to check for equality in incoming data, to limit rerenders.
   */
  deepCompare?: boolean | typeof isEqual;
  /**
   * Pick or transform the part of the cached data used by the component.
   * The hook rerenders only when the selected value changes, while the cache stays shared with other hooks.
   */
  select?: UseTrackedStateSelect<T, TSelected>;
  /**
   * Keep references of the unchanged parts of the selected data between updates (default true).
   */
  structuralSharing?: boolean;
};

export type UseCacheReturnType<T extends RequestInstance, TSelected = ExtractResponseType<T>> = UseTrackedStateType<
  T,
  TSelected
> &
  UseTrackedStateActions<T, TSelected> & {
    /**
     * Invalidate cache for the current request or pass custom key to trigger it by invalidationKey(Regex / cacheKey).
     */
    invalidate: (cacheKeys?: string | RegExp | RequestInstance | (string | RegExp | RequestInstance)[]) => void;
  };
