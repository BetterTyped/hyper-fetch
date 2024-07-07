import { RequestInstance } from "@hyper-fetch/core";

/**
 * Invalidation key type
 * @values string | RequestInstance | RegExp
 */
export type InvalidationKeyType = string | RequestInstance | RegExp;
