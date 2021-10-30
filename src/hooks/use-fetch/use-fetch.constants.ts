import { CacheKeyType } from "cache/cache.types";

/**
 * Keep track of ongoing requests to deduplicate them later in the hook.
 */
export const RequestsMap = new Map<CacheKeyType, Promise<any>>();
