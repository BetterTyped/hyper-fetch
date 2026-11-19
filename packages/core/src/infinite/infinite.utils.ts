import type { RequestInstance } from "request";
import { stringifyKey } from "request/request.utils";

import type { CachedInfinitePage, PaginationConfig, PaginationMode, PaginationPageContext } from "./infinite.types";

const isEmptyCursor = (value: unknown) => value === null || value === undefined || value === "";

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

/**
 * Tells how the list is paged. Throws for a missing or incomplete pagination, because a list without it
 * would silently fetch the same page forever.
 */
export const getPaginationMode = (pagination: PaginationConfig): PaginationMode => {
  if (pagination?.cursor) {
    if (!pagination.next) {
      throw new Error('Cursor pagination requires the "next" option');
    }
    return "cursor";
  }
  if (pagination?.offset) {
    return "offset";
  }
  if (pagination?.page) {
    return "page";
  }
  throw new Error('Infinite requests require the "pagination" option with a "page", "offset" or "cursor" field');
};

const getPagingField = (pagination: PaginationConfig) => {
  return (pagination.cursor ?? pagination.offset ?? pagination.page) as string;
};

const getSourceValues = (request: RequestInstance, pagination: PaginationConfig): Record<string, unknown> => {
  const values = request[pagination.in ?? "queryParams"];
  return values && typeof values === "object" ? (values as Record<string, unknown>) : {};
};

const getPageLimit = (request: RequestInstance, pagination: PaginationConfig) => {
  if (!pagination.limit) {
    return;
  }
  const limit = toNumber(getSourceValues(request, pagination)[pagination.limit]);
  return limit && limit > 0 ? limit : undefined;
};

/**
 * The value the list starts from: what the request already holds, otherwise the first page.
 */
export const getInitialPageParam = (request: RequestInstance, pagination: PaginationConfig): unknown => {
  const mode = getPaginationMode(pagination);
  const value = getSourceValues(request, pagination)[getPagingField(pagination)];

  if (mode === "cursor") {
    return isEmptyCursor(value) ? undefined : value;
  }
  return toNumber(value) ?? (mode === "page" ? 1 : 0);
};

// Lists numbered from zero say so by starting at zero, any other start means numbering from one
const getFirstPageNumber = (request: RequestInstance, pagination: PaginationConfig) => {
  return getInitialPageParam(request, pagination) === 0 ? 0 : 1;
};

const setPagingValue = (request: RequestInstance, pagination: PaginationConfig, value: unknown): RequestInstance => {
  const values = { ...getSourceValues(request, pagination), [getPagingField(pagination)]: value };

  switch (pagination.in) {
    case "params": {
      return request.setParams(values as any) as RequestInstance;
    }
    case "payload": {
      return request.setPayload(values as any) as RequestInstance;
    }
    default: {
      return request.setQueryParams(values as any) as RequestInstance;
    }
  }
};

const keyDependencies = new WeakMap<RequestInstance, { cacheKey: boolean; queryKey: boolean }>();

/**
 * Generated keys contain the query params, so usually every page has its own. A custom key, or paging inside
 * the payload, gives all the pages the same key - they would overwrite each other in one cache slot.
 */
const getKeyDependencies = (request: RequestInstance, pagination: PaginationConfig) => {
  let dependencies = keyDependencies.get(request);
  if (!dependencies) {
    const first = setPagingValue(request, pagination, "__hyper_fetch_page_a__");
    const second = setPagingValue(request, pagination, "__hyper_fetch_page_b__");
    dependencies = {
      cacheKey: first.cacheKey !== second.cacheKey,
      queryKey: first.queryKey !== second.queryKey,
    };
    keyDependencies.set(request, dependencies);
  }
  return dependencies;
};

/**
 * Creates the request of a single page. Generated keys are left untouched, so a page shares its cache
 * with any other request for the same data.
 */
export const getPageRequest = <R extends RequestInstance>(
  request: R,
  pagination: PaginationConfig,
  param: unknown,
): R => {
  if (param === undefined) {
    return request;
  }

  const dependencies = getKeyDependencies(request, pagination);
  let page = setPagingValue(request, pagination, param);

  if (!dependencies.cacheKey) {
    page = page.setCacheKey(`${page.cacheKey}_${stringifyKey(param)}`) as RequestInstance;
  }
  if (!dependencies.queryKey) {
    page = page.setQueryKey(`${page.queryKey}_${stringifyKey(param)}`) as RequestInstance;
  }
  return page as R;
};

const getCallbackContext = ({ data, param, pages }: PaginationPageContext) => ({ data, param, pages });

const readOption = (option: unknown, context: PaginationPageContext): unknown => {
  if (typeof option === "function") {
    return option(getCallbackContext(context));
  }
  return typeof option === "string" ? context.data?.[option] : undefined;
};

/**
 * Items of a single page
 */
export const getPageItems = (context: PaginationPageContext): unknown[] => {
  const { pagination, data } = context;
  const items = pagination.items === undefined ? data : readOption(pagination.items, context);
  return Array.isArray(items) ? items : [];
};

/**
 * Size of the whole list, when the pagination declares it
 */
export const getPageTotal = (context: PaginationPageContext): number | null => {
  return toNumber(readOption(context.pagination.total, context)) ?? null;
};

/**
 * Paging value of the page after the given one
 */
export const getNextPageParam = (context: PaginationPageContext): unknown => {
  const { request, pagination, param } = context;
  const mode = getPaginationMode(pagination);

  if (mode === "cursor") {
    const cursor = readOption(pagination.next, context);
    return isEmptyCursor(cursor) ? undefined : cursor;
  }
  if (mode === "page") {
    return Number(param) + 1;
  }
  return Number(param) + (getPageLimit(request, pagination) ?? getPageItems(context).length);
};

/**
 * Paging value of the page before the given one
 */
export const getPreviousPageParam = (context: PaginationPageContext): unknown => {
  const { request, pagination, param } = context;
  const mode = getPaginationMode(pagination);

  if (mode === "cursor") {
    const cursor = readOption(pagination.previous, context);
    return isEmptyCursor(cursor) ? undefined : cursor;
  }
  if (mode === "page") {
    const previous = Number(param) - 1;
    return previous >= getFirstPageNumber(request, pagination) ? previous : undefined;
  }
  if (Number(param) <= 0) {
    return undefined;
  }
  const size = getPageLimit(request, pagination) ?? getPageItems(context).length;
  return Math.max(0, Number(param) - size);
};

/**
 * Tells whether the list continues after the given page
 */
export const getHasNextPage = (context: PaginationPageContext): boolean => {
  const { request, pagination, param } = context;
  const mode = getPaginationMode(pagination);

  if (getNextPageParam(context) === undefined) {
    return false;
  }
  if (pagination.hasNext) {
    return !!pagination.hasNext(getCallbackContext(context));
  }
  if (mode === "cursor") {
    return true;
  }

  const items = getPageItems(context);
  if (items.length === 0) {
    return false;
  }

  const limit = getPageLimit(request, pagination);
  const total = getPageTotal(context);
  if (total !== null) {
    if (mode === "offset") {
      return Number(param) + items.length < total;
    }
    const pageIndex = Number(param) - getFirstPageNumber(request, pagination);
    return (pageIndex + 1) * (limit ?? items.length) < total;
  }

  return limit === undefined || items.length >= limit;
};

/**
 * Tells whether the list continues before the given page
 */
export const getHasPreviousPage = (context: PaginationPageContext): boolean => {
  if (getPreviousPageParam(context) === undefined) {
    return false;
  }
  return context.pagination.hasPrevious ? !!context.pagination.hasPrevious(getCallbackContext(context)) : true;
};

/**
 * Rebuilds a list from already stored pages: from the starting page forwards, then backwards, until a page
 * is missing. Nothing has to remember which pages were loaded.
 */
export const getCachedPages = <T extends { data: unknown }>({
  request,
  pagination,
  read,
  maxPages = Infinity,
}: {
  request: RequestInstance;
  pagination: PaginationConfig;
  read: (pageRequest: RequestInstance) => T | null | undefined;
  maxPages?: number;
}): CachedInfinitePage<T>[] => {
  const pages: CachedInfinitePage<T>[] = [];
  // Cursors returned by the server could point back at an earlier page
  const visited = new Set<string>();

  const readPage = (param: unknown) => {
    const key = stringifyKey(param);
    if (visited.has(key) || pages.length >= maxPages) {
      return null;
    }
    visited.add(key);

    const pageRequest = getPageRequest(request, pagination, param);
    const value = read(pageRequest);
    return value ? { param, request: pageRequest, value } : null;
  };

  const getContext = (page: CachedInfinitePage<T>): PaginationPageContext => ({
    request,
    pagination,
    data: page.value.data,
    param: page.param,
    pages: pages.map((item) => item.value.data),
  });

  const first = readPage(getInitialPageParam(request, pagination));
  if (!first) {
    return pages;
  }
  pages.push(first);

  while (true) {
    const last = pages.at(-1) as CachedInfinitePage<T>;
    const param = getHasNextPage(getContext(last)) ? getNextPageParam(getContext(last)) : undefined;
    const page = param === undefined ? null : readPage(param);
    if (!page) {
      break;
    }
    pages.push(page);
  }

  while (true) {
    const param = getHasPreviousPage(getContext(pages[0])) ? getPreviousPageParam(getContext(pages[0])) : undefined;
    const page = param === undefined ? null : readPage(param);
    if (!page) {
      break;
    }
    pages.unshift(page);
  }

  return pages;
};
