import type { RequestInstance, NullableType, ExtractAdapterResolvedType } from "@hyper-fetch/core";

import type { UseRequestEventsActionsType, UseTrackedStateActions, UseTrackedStateType } from "helpers";
import type { isEqual } from "utils";

// export type UseFetchCastRequest<R extends RequestInstance> = ExtendRequest<
//   R,
//   {
//     hasData: ExtractPayloadType<R> extends EmptyTypes ? boolean : true;
//     hasParams: ExtractParamsType<R> extends EmptyTypes ? boolean : true;
//     hasQuery: ExtractQueryParamsType<R> extends EmptyTypes ? boolean : true;
//   }
// >;

// export type UseFetchRequest<R extends RequestInstance> = R extends UseFetchCastRequest<R> ? R : UseFetchCastRequest<R>;

export type UseFetchOptionsType<R extends RequestInstance> = {
  /**
   * Enable React Suspense mode. When true, the hook throws a Promise while loading,
   * which is caught by the nearest Suspense boundary. The component re-renders
   * with data available once the request resolves.
   */
  suspense?: boolean;
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
  revalidate?: boolean;
  /**
   * If cache is empty we can use placeholder data.
   */
  initialResponse?: NullableType<Partial<ExtractAdapterResolvedType<R>>>;
  /**
   * Controls what happens to the current state when the cache key changes (e.g. params or query params change).
   *
   * - "auto" (default) — Smart mode: clears state when URL params change (different resource),
   *   preserves state when only query params change (pagination/filtering).
   * - "preserve" — Always keeps previous data visible until new data arrives.
   * - "clean" — Always resets state to initial values when cache key changes.
   */
  keepPreviousData?: "auto" | "preserve" | "clean";
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
  refetchBlurred?: boolean;
  /**
   * Enable/disable data refresh if user leaves current tab.
   */
  refetchOnBlur?: boolean;
  /**
   * Enable/disable data refresh if user enters current tab.
   */
  refetchOnFocus?: boolean;
  /**
   * Enable/disable data refresh if network is restored.
   */
  refetchOnReconnect?: boolean;
  /**
   * Enable/disable debouncing for often changing keys or refreshing, to limit requests to server.
   */
  bounce?: boolean;
  /**
   * Deep comparison function for hook to check for equality in incoming data, to limit rerenders.
   */
  deepCompare?: boolean | typeof isEqual;
} & (
  | {
      /**
       * Possibility to choose between debounce and throttle approaches
       */
      bounceType?: "debounce";
      /**
       * How long it should bounce requests.
       */
      bounceTime?: number;
      /**
       * Not applicable for debounce mode
       */
      bounceTimeout?: void;
    }
  | {
      /**
       * Possibility to choose between debounce and throttle approaches
       */
      bounceType: "throttle";
      /**
       * How long it should bounce requests.
       */
      bounceTime?: number;
      /**
       * ONLY in throttle mode - options for handling last bounce event
       */
      bounceTimeout?: number;
    }
);

export type UseFetchReturnType<R extends RequestInstance> = UseTrackedStateType<R> &
  UseTrackedStateActions<R> &
  UseRequestEventsActionsType<R> & {
    /**
     * Data related to current state of the bounce usage
     */
    bounce: {
      /**
       * Active state of the bounce method
       */
      active: boolean;
      /**
       * Method to stop the active bounce method execution
       */
      reset: () => void;
    };
    /**
     * Refetch current request
     */
    refetch: () => void;
  };
