import type { RequestInstance } from "request";
import type { HydrateDataType } from "types";

import type { FetchInfiniteOptions, FetchInfiniteResult, Pagination, PaginationConfig } from "./infinite.types";
import {
  getHasNextPage,
  getInitialPageParam,
  getNextPageParam,
  getPageItems,
  getPageRequest,
  getPageTotal,
} from "./infinite.utils";

/**
 * Fetches the first pages of a list one after another, without touching the cache or the queues.
 * Made for server rendering: pass `dehydrated` to the `Hydrate` component to render them on the client.
 *
 * @example
 * ```ts
 * const { dehydrated } = await fetchInfinite(getFeed, {
 *   pagination: { cursor: "cursor", next: "nextCursor", items: "data" },
 *   pages: 2,
 * });
 * ```
 */
export const fetchInfinite = async <R extends RequestInstance, const P extends Pagination<R>>(
  request: R,
  options: FetchInfiniteOptions<P>,
): Promise<FetchInfiniteResult<R, P>> => {
  const pagination = options.pagination as PaginationConfig;
  const pageCount = Math.max(1, options.pages ?? 1);

  const result: FetchInfiniteResult<any, any> = {
    items: [],
    pages: [],
    pageParams: [],
    total: null,
    hasNextPage: false,
    error: null,
    responses: [],
    dehydrated: [],
  };

  let param = getInitialPageParam(request, pagination);

  for (let index = 0; index < pageCount; index += 1) {
    const pageRequest = getPageRequest(request, pagination, param);
    // Pages depend on each other, so they cannot be requested at the same time
    // eslint-disable-next-line no-await-in-loop
    const response = await (pageRequest as RequestInstance).exec({});

    result.responses.push(response);

    if (!response.success) {
      result.error = response.error;
      break;
    }

    const context = { request, pagination, data: response.data, param, pages: result.pages };

    result.pages.push(response.data);
    result.pageParams.push(param);
    (result.items as unknown[]).push(...getPageItems(context));
    result.total = getPageTotal(context) ?? result.total;
    result.hasNextPage = getHasNextPage(context);
    result.dehydrated.push(pageRequest.dehydrate({ response }) as HydrateDataType);

    if (!result.hasNextPage) {
      break;
    }
    param = getNextPageParam(context);
  }

  return result as FetchInfiniteResult<R, P>;
};
