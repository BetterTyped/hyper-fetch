import { CommandInstance, ExtractResponse, ExtractError, CacheValueType } from "@better-typed/hyper-fetch";

import { isEqual } from "utils";
import {
  OnErrorCallbackType,
  OnFinishedCallbackType,
  OnSuccessCallbackType,
  UseTrackedStateActions,
  UseTrackedStateType,
} from "helpers";

export type UseCacheOptionsType<T extends CommandInstance> = {
  /**
   * If `true` it will rerender only when values used by our component gets changed. Otherwise it will rerender on any change.
   */
  dependencyTracking?: boolean;
  /**
   * If cache is empty we can use placeholder data.
   */
  initialData?: CacheValueType<ExtractResponse<T>, ExtractError<T>>["data"] | null;
  /**
   * Deep comparison function for hook to check for equality in incoming data, to limit rerenders.
   */
  deepCompare?: boolean | typeof isEqual;
};

export type UseCacheReturnType<T extends CommandInstance> = UseTrackedStateType<T> &
  UseTrackedStateActions<T> & {
    /**
     * Helper hook listener for success response
     */
    onCacheSuccess: (callback: OnSuccessCallbackType<T>) => void;
    /**
     * Helper hook listener for error response
     */
    onCacheError: (callback: OnErrorCallbackType<T>) => void;
    /**
     * Helper hook listener for response
     */
    onCacheChange: (callback: OnFinishedCallbackType<T>) => void;
    /**
     * Revalidate current command resource or pass custom key to trigger it by invalidationKey(Regex / cacheKey).
     */
    revalidate: (invalidateKey?: string | CommandInstance) => void;
  };
