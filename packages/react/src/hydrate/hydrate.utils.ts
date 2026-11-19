import type {
  CacheValueType,
  ClientInstance,
  EmptyTypes,
  HydrateDataType,
  HydrationOptions,
  NullableType,
} from "@hyper-fetch/core";
import { parseResponse, scopeKey } from "@hyper-fetch/core";

import type { HydratedEntry, HydrateOptionsType } from "./hydrate.types";

/**
 * Items already written to the cache (or skipped because the cache held newer data), per client.
 * Once an item is consumed the cache is the source of truth, so a hook mounted after `client.clear()`
 * does not get the old server snapshot back.
 */
const consumedItems = new WeakMap<ClientInstance, WeakSet<HydrateDataType>>();

const getConsumed = (client: ClientInstance) => {
  let consumed = consumedItems.get(client);
  if (!consumed) {
    consumed = new WeakSet();
    consumedItems.set(client, consumed);
  }
  return consumed;
};

export const isConsumed = (client: ClientInstance, item: HydrateDataType) => {
  return getConsumed(client).has(item);
};

export const markConsumed = (client: ClientInstance, item: HydrateDataType) => {
  getConsumed(client).add(item);
};

/**
 * Resolves the config of a single item exactly like `client.hydrate()` does
 */
const resolveConfig = (item: HydrateDataType, options?: HydrateOptionsType) => {
  const { cacheKey, scope, response: _response, ...fallbackOptions } = item;
  const defaults = { cache: true, override: true } satisfies Partial<HydrationOptions>;
  const config =
    typeof options === "function"
      ? { ...defaults, ...fallbackOptions, ...options(item) }
      : { ...defaults, ...fallbackOptions, ...options };

  return { ...config, cacheKey, scope };
};

const getResponseTimestamp = (value: NullableType<{ responseTimestamp?: number | null }>, fallback = 0) => {
  const timestamp = Number(value?.responseTimestamp);
  return Number.isFinite(timestamp) ? timestamp : fallback;
};

/**
 * Turns dehydrated items into the values they will have in the cache, keyed by storage key.
 * The last item wins when the same key is passed twice.
 */
export const getHydratedEntries = (
  client: ClientInstance,
  data: NullableType<(HydrateDataType | EmptyTypes)[]>,
  options?: HydrateOptionsType,
): Map<string, HydratedEntry> => {
  const entries = new Map<string, HydratedEntry>();

  data?.forEach((item) => {
    if (!item) {
      return;
    }

    const config = resolveConfig(item, options);
    const response = parseResponse(item.response);
    const storageKey = scopeKey(config.cacheKey, config.scope ?? null);

    // Mirrors the value created by `cache.set()`, so the first render matches the state after the write
    const value = {
      ...response,
      cacheKey: config.cacheKey,
      scope: config.scope ?? null,
      staleTime: config.staleTime,
      cacheTime: config.cacheTime,
      version: client.cache.version,
      cached: !!config.cache,
    } as CacheValueType;

    entries.set(storageKey, {
      item,
      storageKey,
      value,
      override: config.override !== false,
      timestamp: getResponseTimestamp(response, item.timestamp ?? 0),
    });
  });

  return entries;
};

/**
 * Decides whether the hydrated value should be used instead of the cached one.
 * Newer data always wins; with `override: false` existing cache data is kept.
 */
export const shouldUseHydratedValue = (cacheData: NullableType<CacheValueType>, entry: HydratedEntry): boolean => {
  if (!cacheData) {
    return true;
  }
  if (!entry.override) {
    return false;
  }
  return entry.timestamp > getResponseTimestamp(cacheData);
};

/**
 * Picks the data a hook should start with: cached data, unless the hydrated data is newer
 */
export const pickInitialCacheData = <T extends CacheValueType>(
  cacheData: NullableType<T>,
  entry: NullableType<HydratedEntry>,
): NullableType<T> => {
  if (!entry || !shouldUseHydratedValue(cacheData, entry)) {
    return cacheData;
  }
  return entry.value as T;
};
