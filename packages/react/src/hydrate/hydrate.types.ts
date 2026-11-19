import type { CacheValueType, ClientInstance, EmptyTypes, HydrateDataType, HydrationOptions } from "@hyper-fetch/core";
import type React from "react";

/**
 * Options applied to every hydrated item - the same shape as the second argument of `client.hydrate()`
 */
export type HydrateOptionsType = Partial<HydrationOptions> | ((item: HydrateDataType) => Partial<HydrationOptions>);

export type HydrateProps = {
  /**
   * Client which cache receives the hydrated data
   */
  client: ClientInstance;
  /**
   * Dehydrated items, usually created on the server with `request.dehydrate()`.
   * Empty values are ignored, so the list can be built conditionally.
   */
  data?: (HydrateDataType | EmptyTypes)[] | EmptyTypes;
  /**
   * Options applied to every item, as an object or a function of the item
   */
  options?: HydrateOptionsType;
  /**
   * Children to render
   */
  children?: React.ReactNode;
};

/**
 * Single hydrated item resolved to the value it will have in the cache
 * @internal
 */
export type HydratedEntry = {
  /** Original item - identity is used to track which items were already written to the cache */
  item: HydrateDataType;
  /** Cache storage key - cacheKey prefixed with the scope */
  storageKey: string;
  /** Value the cache will hold once the item is written */
  value: CacheValueType;
  /** When false, existing cache data is never replaced */
  override: boolean;
  /** Response timestamp used to decide which of the cached and hydrated data is newer */
  timestamp: number;
};

/**
 * @internal
 */
export type HydrationContextType = {
  /**
   * Returns the hydrated entry for the client and storage key,
   * as long as it was not written to the cache yet
   */
  get: (client: ClientInstance, storageKey: string) => HydratedEntry | undefined;
};
