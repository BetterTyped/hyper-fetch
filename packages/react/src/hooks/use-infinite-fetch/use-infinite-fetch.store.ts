import type {
  CacheValueType,
  ClientInstance,
  PaginationConfig,
  PaginationPageContext,
  RequestInstance,
} from "@hyper-fetch/core";
import {
  getCachedPages,
  getHasNextPage,
  getHasPreviousPage,
  getInitialPageParam,
  getNextPageParam,
  getPageItems,
  getPageRequest,
  getPageTotal,
  getPaginationMode,
  getPreviousPageParam,
  replaceEqualDeep,
  scopeKey,
  stringifyKey,
} from "@hyper-fetch/core";
import { isStaleCacheData } from "helpers/use-tracked-state/use-tracked-state.utils";
import { pickInitialCacheData } from "hydrate/hydrate.utils";

import { isCancelledResponse, loadPage } from "./use-infinite-fetch.requests";
import type {
  FetchedPage,
  InfinitePage,
  InfiniteSnapshot,
  InfiniteStoreOptions,
  Operation,
  OperationKind,
} from "./use-infinite-fetch.store.types";
import type { InfinitePageEvent } from "./use-infinite-fetch.types";

// Render and commit are separate steps, a store waits this long for the component that created it
const unusedStoreTime = 1000;

const stores = new WeakMap<ClientInstance, Map<string, InfiniteStore>>();

const getStores = (client: ClientInstance) => {
  let clientStores = stores.get(client);
  if (!clientStores) {
    clientStores = new Map();
    stores.set(client, clientStores);
  }
  return clientStores;
};

const isSameSnapshot = (a: InfiniteSnapshot, b: InfiniteSnapshot) => {
  return (Object.keys(a) as (keyof InfiniteSnapshot)[]).every((key) => a[key] === b[key]);
};

/**
 * State of a single list. Hooks showing the same list share one store, so they stay in sync and never request
 * the same page twice. Pages are ordinary requests under their own cache keys - nothing extra is stored.
 *
 * Fetches run one at a time: every page depends on the list as it was when its value was computed.
 */
export class InfiniteStore {
  private listeners = new Set<VoidFunction>();
  private pageListeners = new Set<(event: InfinitePageEvent<any>) => void>();
  private pages: InfinitePage[] = [];
  // Values of pages dropped by `maxPages`, a cursor list may have no other way of going back to them
  private droppedParams: unknown[] = [];
  private queue: Operation[] = [];
  private running: Operation | null = null;
  private cancellers = new Set<VoidFunction>();
  // Pages being refetched - their cache events wait for the whole list to be swapped at once
  private refetchedKeys = new Set<string>();
  private unmountCacheListeners: VoidFunction | null = null;
  private unusedTimer: ReturnType<typeof setTimeout> | null = null;
  private started = false;
  private settled = false;
  private firstFetch: Promise<any> = Promise.resolve(null);
  private nextPageError = false;
  private previousPageError = false;
  private result: { error: any; status: any; extra: any; success: boolean } = {
    error: null,
    status: null,
    extra: null,
    success: false,
  };
  private snapshot: InfiniteSnapshot;

  constructor(
    readonly key: string,
    private options: InfiniteStoreOptions,
  ) {
    getPaginationMode(options.pagination);
    this.restorePages();
    this.snapshot = this.createSnapshot();
  }

  // ******************
  // State
  // ******************

  getSnapshot = () => this.snapshot;

  subscribe = (listener: VoidFunction) => {
    this.listeners.add(listener);
    if (this.listeners.size === 1) {
      this.attach();
    }

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.detach();
      }
    };
  };

  onPage = (listener: (event: InfinitePageEvent<any>) => void) => {
    this.pageListeners.add(listener);
    return () => {
      this.pageListeners.delete(listener);
    };
  };

  /** Callbacks can capture values of the latest render */
  setPagination = (pagination: PaginationConfig) => {
    this.options.pagination = pagination;
  };

  hasPages = () => this.pages.length > 0;

  // ******************
  // Actions
  // ******************

  /**
   * Loads the list when it is first needed. Safe to call many times.
   */
  start = ({ revalidate }: { revalidate?: boolean } = {}) => {
    if (this.started) {
      return this.firstFetch;
    }
    this.started = true;

    if (this.pages.length === 0) {
      this.firstFetch = this.schedule("initial");
    } else if (revalidate || this.getHasStalePages()) {
      this.revalidate();
    } else {
      this.settled = true;
    }
    this.publish();
    return this.firstFetch;
  };

  fetchNextPage = () => this.fetchDirection("next");

  fetchPreviousPage = () => this.fetchDirection("previous");

  /**
   * Refetch asked for by the user: anything already refetching is older than this call and gets replaced.
   */
  refetch = () => {
    if (this.pages.length === 0) {
      return this.revalidate();
    }
    this.getOperations("refetch").forEach(this.cancelOperation);
    return this.schedule("refetch");
  };

  /**
   * Automatic refetch: joins the one in progress
   */
  revalidate = () => {
    const kind = this.pages.length > 0 ? "refetch" : "initial";
    return this.getOperations(kind)[0]?.promise ?? this.schedule(kind);
  };

  reset = () => {
    this.cancelOperations();
    const startParam = stringifyKey(getInitialPageParam(this.options.request, this.options.pagination));

    this.pages = this.pages.filter((page) => stringifyKey(page.param) === startParam);
    this.droppedParams = [];
    this.nextPageError = false;
    this.previousPageError = false;
    this.settled = false;
    this.started = true;

    return this.schedule(this.pages.length > 0 ? "refetch" : "initial");
  };

  abort = () => {
    this.cancelOperations();
    this.settled = true;
    this.publish();
  };

  /** The list is no longer on screen - stop fetching its pages */
  cancelIfUnused = () => {
    if (this.listeners.size === 0) {
      this.cancelOperations();
    }
  };

  /** A store that threw its error starts over when the Error Boundary renders the component again */
  evictSoon = () => {
    setTimeout(this.evict, 0);
  };

  /** Stores created while rendering are removed when the component never mounts */
  scheduleUnusedCheck = () => {
    this.unusedTimer = setTimeout(() => {
      this.unusedTimer = null;
      if (this.running || this.queue.length > 0) {
        this.scheduleUnusedCheck();
      } else {
        this.evict();
      }
    }, unusedStoreTime);
  };

  // ******************
  // Operations
  // ******************

  private fetchDirection = (kind: "next" | "previous") => {
    if (this.pages.length === 0) {
      return this.getOperations("initial")[0]?.promise ?? Promise.resolve(null);
    }
    const scheduled = this.getOperations(kind)[0];
    if (scheduled) {
      return scheduled.promise;
    }
    if (kind === "next" ? this.getNextParam() === undefined : !this.getPreviousTarget()) {
      return Promise.resolve(null);
    }
    if (kind === "next") {
      this.nextPageError = false;
    } else {
      this.previousPageError = false;
    }
    return this.schedule(kind);
  };

  private getOperations = (kind: OperationKind) => {
    const operations = this.running ? [this.running, ...this.queue] : this.queue;
    return operations.filter((operation) => operation.kind === kind && !operation.cancelled);
  };

  private schedule = (kind: OperationKind) => {
    const operation = { kind, cancelled: false } as Operation;
    operation.promise = new Promise<any>((resolve) => {
      operation.resolve = resolve;
    });

    if (kind === "initial") {
      this.settled = false;
    }
    this.queue.push(operation);
    this.pump();
    this.publish();
    return operation.promise;
  };

  private pump = async () => {
    if (this.running) {
      return;
    }
    const operation = this.queue.shift();
    if (!operation) {
      return;
    }

    this.running = operation;
    const previousPages = this.pages;
    let response = null;
    try {
      response = await this.perform(operation);
    } catch (error) {
      this.setFailure(error);
    }
    this.keepValidPages(previousPages);
    this.running = null;
    this.refetchedKeys.clear();

    if ((operation.kind === "initial" || operation.kind === "refetch") && !operation.cancelled) {
      this.settled = true;
    }

    operation.resolve(operation.cancelled ? null : response);
    this.pump();
    this.publish();
  };

  private cancelOperation = (operation: Operation) => {
    operation.cancelled = true;
    if (operation === this.running) {
      this.cancellers.forEach((cancel) => cancel());
      this.cancellers.clear();
      this.refetchedKeys.clear();
    } else {
      this.queue = this.queue.filter((item) => item !== operation);
      operation.resolve(null);
    }
  };

  private cancelOperations = () => {
    [...this.queue, ...(this.running ? [this.running] : [])].forEach(this.cancelOperation);
  };

  private perform = (operation: Operation) => {
    switch (operation.kind) {
      case "next": {
        return this.performNext(operation);
      }
      case "previous": {
        return this.performPrevious(operation);
      }
      case "refetch": {
        return this.performRefetch(operation);
      }
      default: {
        return this.performInitial(operation);
      }
    }
  };

  private performInitial = async (operation: Operation) => {
    const { request, pagination } = this.options;
    const fetched = await this.fetchPage(operation, getInitialPageParam(request, pagination));
    if (!fetched) {
      return null;
    }

    this.setResult(fetched.response);
    if (fetched.response.success) {
      this.pages = [this.createPage(fetched)];
    }
    return fetched.response;
  };

  private performNext = async (operation: Operation) => {
    const param = this.getNextParam();
    if (param === undefined) {
      return null;
    }

    const fetched = await this.fetchPage(operation, param);
    if (!fetched) {
      return null;
    }

    this.setResult(fetched.response);
    this.nextPageError = !fetched.response.success;
    if (fetched.response.success) {
      this.pages = [...this.pages, this.createPage(fetched)];
      this.trimPages("start");
    }
    return fetched.response;
  };

  private performPrevious = async (operation: Operation) => {
    const target = this.getPreviousTarget();
    if (!target) {
      return null;
    }

    const { param } = target;
    const fetched = await this.fetchPage(operation, param);
    if (!fetched) {
      return null;
    }

    this.setResult(fetched.response);
    this.previousPageError = !fetched.response.success;
    if (fetched.response.success) {
      if (target.isDropped) {
        this.droppedParams = this.droppedParams.slice(0, -1);
      }
      this.pages = [this.createPage(fetched), ...this.pages];
      this.trimPages("end");
    }
    return fetched.response;
  };

  private performRefetch = async (operation: Operation) => {
    const current = this.pages;
    current.forEach((page) => this.refetchedKeys.add(page.storageKey));

    return getPaginationMode(this.options.pagination) === "cursor"
      ? this.refetchInOrder(operation, current)
      : this.refetchAtOnce(operation, current);
  };

  /**
   * Page and offset values do not depend on other pages, so they can be requested together
   */
  private refetchAtOnce = async (operation: Operation, current: InfinitePage[]) => {
    const results = await Promise.all(current.map((page) => this.fetchPage(operation, page.param, true)));
    if (operation.cancelled) {
      return null;
    }

    const failed = results.find((fetched) => fetched && !fetched.response.success);
    const last = failed ?? results.findLast(Boolean);

    this.pages = current.map((page, index) => {
      const fetched = results[index];
      return fetched?.response.success ? this.createPage(fetched) : page;
    });
    if (last) {
      this.setResult(last.response);
    }
    return last?.response ?? null;
  };

  /**
   * Every cursor comes from the page before it, and the fresh data can hold different cursors than before.
   * The list is replaced only when the whole chain arrived, a failure leaves it as it was.
   */
  private refetchInOrder = async (operation: Operation, current: InfinitePage[]) => {
    const fresh: InfinitePage[] = [];
    let param = current[0].param;
    let response = null;

    while (fresh.length < current.length) {
      // Each request needs the response of the previous one
      // eslint-disable-next-line no-await-in-loop
      const fetched = await this.fetchPage(operation, param, true);
      if (!fetched) {
        return null;
      }

      response = fetched.response;
      this.setResult(response);
      if (!response.success) {
        return response;
      }

      const page = this.createPage(fetched);
      fresh.push(page);

      const context = this.getContext(page, fresh);
      if (!getHasNextPage(context)) {
        break;
      }
      param = getNextPageParam(context);
    }

    this.pages = fresh;
    return response;
  };

  private trimPages = (side: "start" | "end") => {
    const { maxPages } = this.options;
    if (!maxPages || this.pages.length <= maxPages) {
      return;
    }

    const overflow = this.pages.length - maxPages;
    if (side === "start") {
      this.droppedParams = [...this.droppedParams, ...this.pages.slice(0, overflow).map((page) => page.param)];
      this.pages = this.pages.slice(overflow);
    } else {
      this.pages = this.pages.slice(0, maxPages);
    }
  };

  // ******************
  // Requests
  // ******************

  private fetchPage = async (operation: Operation, param: unknown, force = false): Promise<FetchedPage | null> => {
    const request = getPageRequest(this.options.request, this.options.pagination, param);
    const response = await loadPage({
      request,
      force,
      cancellers: this.cancellers,
      isCancelled: () => operation.cancelled,
    });

    if (operation.cancelled || !response || isCancelledResponse(response)) {
      return null;
    }

    this.pageListeners.forEach((listener) => listener({ response, request, param }));
    return { param, request, response };
  };

  // ******************
  // Pages
  // ******************

  private getContext = (page: InfinitePage, pages: InfinitePage[] = this.pages): PaginationPageContext => ({
    request: this.options.request,
    pagination: this.options.pagination,
    data: page.data,
    param: page.param,
    pages: pages.map((item) => item.data),
  });

  private getNextParam = () => {
    const last = this.pages.at(-1);
    if (!last || !getHasNextPage(this.getContext(last))) {
      return;
    }
    return getNextPageParam(this.getContext(last));
  };

  // The first page of a cursor list has no cursor, so "no value" cannot mean "no page"
  private getPreviousTarget = (): { param: unknown; isDropped: boolean } | null => {
    const first = this.pages[0];
    if (!first) {
      return null;
    }
    if (this.droppedParams.length > 0) {
      return { param: this.droppedParams.at(-1), isDropped: true };
    }
    if (getHasPreviousPage(this.getContext(first))) {
      return { param: getPreviousPageParam(this.getContext(first)), isDropped: false };
    }
    return null;
  };

  private getHasStalePages = () => {
    return this.pages.some((page) => {
      const value = this.readValue(page.request);
      return !value || isStaleCacheData(value.staleTime, value.responseTimestamp);
    });
  };

  private readValue = (request: RequestInstance) => {
    const { client } = request;
    const storageKey = scopeKey(request.cacheKey, request.scope);
    return pickInitialCacheData<CacheValueType>(
      client.cache.get(storageKey),
      this.options.hydration?.get(client, storageKey),
    );
  };

  /** Responses go through the response mapper of the request, an asynchronous one cannot be read synchronously */
  private mapValue = (request: RequestInstance, value: CacheValueType) => {
    const mapped: any = request.unstable_responseMapper ? request.unstable_responseMapper(value as any) : value;
    return mapped instanceof Promise ? undefined : mapped;
  };

  private createPage = ({ param, request, response }: FetchedPage): InfinitePage => {
    // Reading the cache keeps changes made after the response arrived, like optimistic updates
    const value = this.readValue(request);
    const cached =
      value && value.responseTimestamp >= response.responseTimestamp ? this.mapValue(request, value) : null;

    return {
      param,
      request,
      storageKey: scopeKey(request.cacheKey, request.scope),
      data: cached?.success ? cached.data : response.data,
      responseTimestamp: response.responseTimestamp,
    };
  };

  private restorePages = () => {
    const { request, pagination, maxPages } = this.options;

    this.pages = getCachedPages({
      request,
      pagination,
      maxPages,
      read: (pageRequest) => {
        const value = this.readValue(pageRequest);
        const mapped = value ? this.mapValue(pageRequest, value) : null;
        return mapped?.success ? { ...value, data: mapped.data } : null;
      },
    }).map(({ param, request: pageRequest, value }) => ({
      param,
      request: pageRequest,
      storageKey: scopeKey(pageRequest.cacheKey, pageRequest.scope),
      data: value.data,
      responseTimestamp: Number(value.responseTimestamp),
    }));
  };

  /** Picks up everything that happened between rendering and mounting */
  private syncPages = () => {
    if (this.running || this.queue.length > 0) {
      return;
    }
    if (this.pages.length === 0) {
      this.restorePages();
      return;
    }

    this.pages = this.pages.map((page) => {
      const value = this.readValue(page.request);
      const mapped = value ? this.mapValue(page.request, value) : null;
      return mapped?.success
        ? { ...page, data: mapped.data, responseTimestamp: Number(value?.responseTimestamp) }
        : page;
    });
  };

  private setFailure = (error: unknown) => {
    this.result = { error, status: null, extra: null, success: false };
  };

  /**
   * Pagination callbacks read the data of every page. When one of them throws, the page that caused it is not
   * used and the error is reported instead of breaking the list.
   */
  private keepValidPages = (previousPages: InfinitePage[]) => {
    try {
      this.createSnapshot();
    } catch (error) {
      this.pages = previousPages;
      this.setFailure(error);
    }
  };

  private setResult = (response: any) => {
    this.result = {
      error: response.success ? null : response.error,
      status: response.status,
      extra: response.extra,
      success: response.success,
    };
  };

  // ******************
  // Cache
  // ******************

  private attach = () => {
    if (this.unusedTimer) {
      clearTimeout(this.unusedTimer);
      this.unusedTimer = null;
    }

    const { client } = this.options.request;
    const clientStores = getStores(client);
    if (!clientStores.has(this.key) && client.mode !== "server") {
      clientStores.set(this.key, this);
    }

    const { cache } = client;
    const unmountData = cache.events.onData(this.handleCacheData);
    const unmountInvalidate = cache.events.onInvalidate(this.handleCacheChange);
    const unmountDelete = cache.events.onDelete(this.handleCacheChange);

    this.unmountCacheListeners = () => {
      unmountData();
      unmountInvalidate();
      unmountDelete();
    };

    this.syncPages();
    this.publish();
  };

  private detach = () => {
    this.unmountCacheListeners?.();
    this.unmountCacheListeners = null;
    this.evict();
  };

  private evict = () => {
    if (this.listeners.size > 0) {
      return;
    }
    const clientStores = getStores(this.options.request.client);
    if (clientStores.get(this.key) === this) {
      clientStores.delete(this.key);
    }
  };

  private handleCacheData = (value: CacheValueType) => {
    const storageKey = scopeKey(value.cacheKey, value.scope ?? null);
    if (!value.success || this.refetchedKeys.has(storageKey)) {
      return;
    }

    const index = this.pages.findIndex((page) => page.storageKey === storageKey);
    const page = this.pages[index];
    const mapped = page ? this.mapValue(page.request, value) : null;
    if (!page || !mapped?.success) {
      return;
    }

    const previousPages = this.pages;
    this.pages = this.pages.map((item, itemIndex) => {
      return itemIndex === index
        ? { ...item, data: mapped.data, responseTimestamp: Number(value.responseTimestamp) }
        : item;
    });
    this.keepValidPages(previousPages);
    this.publish();
  };

  private hasInvalidation = false;

  /**
   * Invalidated data may have changed after a running refetch started, so that refetch is replaced.
   * Invalidating by a pattern reports every key on its own, all of them are handled by one refetch.
   */
  private handleCacheChange = (key: string) => {
    const isLoaded = this.pages.some((page) => page.storageKey === key || page.request.cacheKey === key);
    if (!isLoaded || this.hasInvalidation) {
      return;
    }

    this.hasInvalidation = true;
    queueMicrotask(() => {
      this.hasInvalidation = false;
      if (this.listeners.size > 0) {
        this.refetch();
      }
    });
  };

  // ******************
  // Snapshot
  // ******************

  private createSnapshot = (): InfiniteSnapshot => {
    const { structuralSharing = true } = this.options;
    const previous = this.snapshot as InfiniteSnapshot | undefined;
    const share = <T>(prev: T | undefined, next: T) =>
      structuralSharing && prev ? replaceEqualDeep(prev, next) : next;

    const contexts = this.pages.map((page) => this.getContext(page));
    const last = contexts.at(-1);
    const totals = contexts.map(getPageTotal).filter((total) => total !== null);
    const operations = [...this.queue, ...(this.running ? [this.running] : [])].filter((item) => !item.cancelled);
    const isRunning = (kind: OperationKind) => operations.some((item) => item.kind === kind);

    return {
      items: share(previous?.items, contexts.flatMap((context) => getPageItems(context))),
      data: share(previous?.data, this.pages.map((page) => page.data)),
      pageParams: share(previous?.pageParams, this.pages.map((page) => page.param)),
      total: totals.length > 0 ? (totals.at(-1) as number) : null,
      hasNextPage: !!last && this.getNextParam() !== undefined,
      hasPreviousPage: !!this.getPreviousTarget(),
      loading: this.pages.length === 0 && !this.settled,
      isFetching: operations.length > 0,
      isRefetching: isRunning("refetch"),
      isFetchingNextPage: isRunning("next"),
      isFetchingPreviousPage: isRunning("previous"),
      isFetchNextPageError: this.nextPageError,
      isFetchPreviousPageError: this.previousPageError,
      ...this.result,
    };
  };

  private publish = () => {
    const snapshot = this.createSnapshot();
    if (isSameSnapshot(this.snapshot, snapshot)) {
      return;
    }
    this.snapshot = snapshot;
    this.listeners.forEach((listener) => listener());
  };
}

/**
 * Returns the store of the list, shared between all the mounted hooks showing it.
 * Server renders never share one: a client can serve many users at the same time.
 */
export const getInfiniteStore = (key: string, options: InfiniteStoreOptions) => {
  const { client } = options.request;
  if (client.mode === "server" || typeof window === "undefined") {
    return new InfiniteStore(key, options);
  }

  const clientStores = getStores(client);
  let store = clientStores.get(key);
  if (!store) {
    store = new InfiniteStore(key, options);
    clientStores.set(key, store);
    store.scheduleUnusedCheck();
  }
  return store;
};
