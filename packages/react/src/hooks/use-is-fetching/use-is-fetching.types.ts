import type { RequestInstance } from "@hyper-fetch/core";

export type UseIsFetchingOptionsType = {
  /**
   * Count only the requests with matching queryKey - exact string or RegExp
   */
  queryKey?: string | RegExp;
  /**
   * Count only the requests for which the predicate returns true
   */
  predicate?: (request: RequestInstance) => boolean;
};
