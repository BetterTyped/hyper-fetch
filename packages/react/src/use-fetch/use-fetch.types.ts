import { CommandInstance, ExtractResponse, ExtractError, CacheValueType } from "@better-typed/hyper-fetch";

import { UseCommandEventsActionsType, UseTrackedStateActions, UseTrackedStateType } from "helpers";
import { isEqual } from "utils";

export type UseFetchOptionsType<T extends CommandInstance> = {
  /**
   * Refetch dependencies
   */
  dependencies?: any[];
  /**
   * Disable fetching
   */
  disabled?: boolean;
  /**
   * If `true` it will rerender only when values used by our component gets changed. Otherwise it will rerender on any change.
   */
  dependencyTracking?: boolean;
  /**
   * If `true` it will refetch data in background no matter if we have it from cache.
   */
  revalidateOnMount?: boolean;
  /**
   * If cache is empty we can use placeholder data.
   */
  initialData?: CacheValueType<ExtractResponse<T>, ExtractError<T>>["data"] | null;
  /**
   * Enable/disable refresh data
   */
  refresh?: boolean;
  /**
   * Refresh data interval time
   */
  refreshTime?: number;
  /**
   * Enable/disable data refresh if our tab is not focused(used by user at given time).
   */
  refreshBlurred?: boolean;
  /**
   * Enable/disable data refresh if user leaves current tab.
   */
  refreshOnBlur?: boolean;
  /**
   * Enable/disable data refresh if user enters current tab.
   */
  refreshOnFocus?: boolean;
  /**
   * Enable/disable data refresh if network is restored.
   */
  refreshOnReconnect?: boolean;
  /**
   * Enable/disable debouncing for often changing keys or refreshing, to limit requests to server.
   */
  debounce?: boolean;
  /**
   * How long it should debounce requests.
   */
  debounceTime?: number;
  /**
   * Deep comparison function for hook to check for equality in incoming data, to limit rerenders.
   */
  deepCompare?: boolean | typeof isEqual;
};

export type UseFetchReturnType<T extends CommandInstance> = UseTrackedStateType<T> &
  UseTrackedStateActions<T> &
  UseCommandEventsActionsType<T> & {
    /**
     * Is debounce active at given moment
     */
    isDebouncing: boolean;
    /**
     * Revalidate current command resource or pass custom key to trigger it by invalidationKey(Regex / cacheKey).
     */
    revalidate: (invalidateKey?: string | RegExp | CommandInstance) => void;
  };
