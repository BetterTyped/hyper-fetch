import { RequestInstance, ExtractResponseType, ExtractErrorType, CacheValueType } from "@hyper-fetch/core";

import { isEqual } from "utils";
import { UseTrackedStateActions, UseTrackedStateType } from "helpers";

export type UseCacheOptionsType<T extends RequestInstance> = {
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
};

export type UseCacheReturnType<T extends RequestInstance> = UseTrackedStateType<T> &
  UseTrackedStateActions<T> & {
    /**
     * Invalidate cache for the current request or pass custom key to trigger it by invalidationKey(Regex / cacheKey).
     */
    invalidate: (cacheKeys?: string | RegExp | RequestInstance | Array<string | RegExp | RequestInstance>) => void;
  };
