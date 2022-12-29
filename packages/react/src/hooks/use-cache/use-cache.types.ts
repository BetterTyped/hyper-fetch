import { RequestInstance, ExtractResponseType, ExtractErrorType, CacheValueType } from "@hyper-fetch/core";

import { isEqual } from "utils";
import {
  OnErrorCallbackType,
  OnFinishedCallbackType,
  OnSuccessCallbackType,
  UseTrackedStateActions,
  UseTrackedStateType,
} from "helpers";

export type UseCacheOptionsType<T extends RequestInstance> = {
  /**
   * If `true` it will rerender only when values used by our component gets changed. Otherwise it will rerender on any change.
   */
  dependencyTracking?: boolean;
  /**
   * If cache is empty we can use placeholder data.
   */
  initialData?: CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>>["data"] | null;
  /**
   * Deep comparison function for hook to check for equality in incoming data, to limit rerenders.
   */
  deepCompare?: boolean | typeof isEqual;
};

export type UseCacheReturnType<T extends RequestInstance> = UseTrackedStateType<T> &
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
     * Revalidate current request resource or pass custom key to trigger it by invalidationKey(Regex / cacheKey).
     */
    revalidate: (invalidateKey?: string | RegExp | RequestInstance) => void;
  };
