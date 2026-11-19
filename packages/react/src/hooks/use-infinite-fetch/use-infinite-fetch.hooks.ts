import { useDebounce, useThrottle } from "@better-hooks/performance";
import type {
  ExtractErrorType,
  Pagination,
  PaginationConfig,
  PaginationItem,
  RequestInstance,
} from "@hyper-fetch/core";
import { replaceEqualDeep } from "@hyper-fetch/core";
import { useHydration } from "hydrate/hydrate";
import { useProvider } from "provider";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { createTrackedProxy, getBounceData } from "utils";

import { useInfiniteFetchDefaultOptions } from "./use-infinite-fetch.constants";
import type { InfiniteStore } from "./use-infinite-fetch.store";
import { getInfiniteStore } from "./use-infinite-fetch.store";
import type { InfiniteSnapshot } from "./use-infinite-fetch.store.types";
import type { UseInfiniteFetchOptionsType, UseInfiniteFetchReturnType } from "./use-infinite-fetch.types";
import { getInfiniteKey, getShouldKeepPreviousList, getUniqueItems } from "./use-infinite-fetch.utils";

// What decides about a returned value - the list on screen also depends on the new list still loading
const trackedSources: Record<string, (keyof InfiniteSnapshot)[]> = {
  items: ["items", "loading"],
  pages: ["data", "loading"],
  pageParams: ["pageParams", "loading"],
  total: ["total", "loading"],
  isPreviousData: ["data", "loading"],
  loading: ["data", "loading"],
};

const trackedKeys = [
  "items",
  "pages",
  "pageParams",
  "total",
  "hasNextPage",
  "hasPreviousPage",
  "loading",
  "isFetching",
  "isRefetching",
  "isFetchingNextPage",
  "isFetchingPreviousPage",
  "isFetchNextPageError",
  "isFetchPreviousPageError",
  "isPreviousData",
  "error",
  "status",
  "extra",
  "success",
] as const;

/**
 * Loads a list page by page. Say which fields page through the request, and the hook takes care of the rest:
 * every page is a normal request under its own cache key, and the hook glues them together.
 *
 * A changed filter, sort or URL param starts a new list on its own. When to load more is up to you - call
 * `fetchNextPage` from a button, an intersection observer, `onEndReached` or a virtualizer.
 *
 * @param request Request instance
 * @param options Hook options, `pagination` is required
 * @returns
 * @example
 * ```tsx
 * const { items, hasNextPage, fetchNextPage } = useInfiniteFetch(getFeed.setQueryParams({ topic }), {
 *   pagination: { cursor: "cursor", next: "nextCursor", items: "data" },
 * });
 * ```
 */
export const useInfiniteFetch = <
  R extends RequestInstance,
  const P extends Pagination<R>,
  TSelected = PaginationItem<R, P>[],
>(
  request: R,
  options: UseInfiniteFetchOptionsType<R, P, TSelected>,
): UseInfiniteFetchReturnType<R, P, TSelected> => {
  const { config: globalConfig } = useProvider();
  const {
    pagination,
    uniqueBy,
    maxPages,
    select,
    suspense,
    throwOnError,
    dependencies,
    disabled,
    dependencyTracking,
    revalidate,
    keepPreviousData,
    refresh,
    refreshTime,
    refetchBlurred,
    refetchOnBlur,
    refetchOnFocus,
    refetchOnReconnect,
    structuralSharing,
    bounce,
    bounceType,
    bounceTime,
    bounceTimeout,
  } = {
    ...useInfiniteFetchDefaultOptions,
    ...globalConfig.useInfiniteFetchConfig,
    ...options,
  };

  const { client } = request;
  const hydration = useHydration();

  const requestDebounce = useDebounce({ delay: bounceTime });
  const requestThrottle = useThrottle({ interval: bounceTime, timeout: bounceTimeout });
  const bounceData = bounceType === "throttle" ? requestThrottle : requestDebounce;
  const bounceFunction = bounceType === "throttle" ? requestThrottle.throttle : requestDebounce.debounce;

  // ******************
  // Store
  // ******************

  const key = getInfiniteKey(request, pagination, maxPages);
  const storeRef = useRef<InfiniteStore | null>(null);
  const storeClientRef = useRef(client);

  if (!storeRef.current || storeRef.current.key !== key || storeClientRef.current !== client) {
    storeClientRef.current = client;
    storeRef.current = getInfiniteStore(key, {
      request,
      pagination: pagination as PaginationConfig,
      maxPages,
      structuralSharing,
      hydration,
    });
  }
  const store = storeRef.current;

  // Rerenders only when something the component reads has changed
  const usedKeys = useRef(new Set<string>()).current;
  const renderedRef = useRef<{ store: InfiniteStore; snapshot: InfiniteSnapshot } | null>(null);

  const getSnapshot = () => {
    const next = store.getSnapshot();
    const rendered = renderedRef.current;

    if (dependencyTracking && rendered?.store === store) {
      const hasChanged = [...usedKeys].some((usedKey) => {
        const sources = trackedSources[usedKey] ?? [usedKey as keyof InfiniteSnapshot];
        return sources.some((source) => rendered.snapshot[source] !== next[source]);
      });
      if (!hasChanged) {
        return rendered.snapshot;
      }
    }

    renderedRef.current = { store, snapshot: next };
    return next;
  };

  const snapshot = useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);

  // ******************
  // Latest values
  // ******************

  const callbacks = useRef<{
    onSuccess?: (event: any) => void;
    onError?: (event: any) => void;
    onFinished?: (event: any) => void;
    onReset?: VoidFunction;
  }>({});

  const latest = useRef({ disabled, revalidate, refetchOnBlur, refetchOnFocus, refetchOnReconnect });
  latest.current = { disabled, revalidate, refetchOnBlur, refetchOnFocus, refetchOnReconnect };

  // ******************
  // Lifecycle
  // ******************

  useEffect(() => {
    store.setPagination(pagination as PaginationConfig);
  });

  useEffect(() => {
    return store.onPage((event) => {
      if (event.response.success) {
        callbacks.current.onSuccess?.(event);
      } else {
        callbacks.current.onError?.(event);
      }
      callbacks.current.onFinished?.(event);
    });
  }, [store]);

  /**
   * A new list stops the pages of the previous one, so a late response never gets in the way
   */
  const mountedStore = useRef<InfiniteStore | null>(null);

  useEffect(() => {
    const previous = mountedStore.current;
    mountedStore.current = store;

    if (previous && previous !== store) {
      previous.cancelIfUnused();
      callbacks.current.onReset?.();
    }
    if (disabled) {
      return;
    }

    if (bounce && previous && previous !== store && !store.hasPages()) {
      bounceFunction(() => {
        // The list could have been left for another one, or disabled, before the bounce settled
        if (mountedStore.current === store && !latest.current.disabled) {
          store.start({ revalidate: latest.current.revalidate });
        }
      });
    } else {
      store.start({ revalidate });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, disabled]);

  useEffect(() => {
    if (disabled) {
      return;
    }
    return store.enable();
  }, [store, disabled]);

  // Effects run again in StrictMode and when a hidden list is shown - only changed values are a reason to refetch
  const usedDependencies = useRef(dependencies);

  useEffect(() => {
    const previous = usedDependencies.current;
    usedDependencies.current = dependencies;

    const hasChanged =
      previous.length !== dependencies.length ||
      previous.some((value, index) => !Object.is(value, dependencies[index]));
    if (hasChanged && !disabled) {
      store.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  useEffect(() => {
    const { appManager } = client;
    const handle = (option: "refetchOnBlur" | "refetchOnFocus" | "refetchOnReconnect") => () => {
      if (latest.current[option] && !latest.current.disabled) {
        store.revalidate();
      }
    };

    const unmountFocus = appManager.events.onFocus(handle("refetchOnFocus"));
    const unmountBlur = appManager.events.onBlur(handle("refetchOnBlur"));
    const unmountOnline = appManager.events.onOnline(handle("refetchOnReconnect"));

    return () => {
      unmountFocus();
      unmountBlur();
      unmountOnline();
    };
  }, [client, store]);

  useEffect(() => {
    if (!refresh || disabled) {
      return;
    }

    const timer = setInterval(() => {
      if (client.appManager.isFocused || refetchBlurred) {
        store.revalidate();
      }
    }, refreshTime);

    return () => clearInterval(timer);
  }, [client, store, refresh, refreshTime, refetchBlurred, disabled]);

  // ******************
  // Previous list
  // ******************

  const previousList = useRef<{ store: InfiniteStore; request: RequestInstance; snapshot: InfiniteSnapshot } | null>(
    null,
  );

  useEffect(() => {
    if (snapshot.data.length > 0) {
      previousList.current = { store, request, snapshot };
    }
  });

  const previous = previousList.current;
  const isPreviousData =
    !disabled &&
    snapshot.loading &&
    snapshot.data.length === 0 &&
    !!previous &&
    previous.store !== store &&
    getShouldKeepPreviousList(keepPreviousData, previous.request, request);

  const list = isPreviousData ? previous.snapshot : snapshot;

  // ******************
  // Suspense
  // ******************

  const isServer = client.mode === "server" || typeof window === "undefined";

  if (suspense && !disabled && !isServer && snapshot.loading && !isPreviousData) {
    throw store.start({ revalidate });
  }

  // ******************
  // Error boundary
  // ******************

  if (throwOnError) {
    usedKeys.add("error");
    usedKeys.add("isFetching");

    const error = snapshot.error as ExtractErrorType<R> | null;
    const shouldThrow = typeof throwOnError === "function" ? !!error && throwOnError(error) : !!error;

    if (shouldThrow && !snapshot.isFetching) {
      store.evictSoon();
      throw error;
    }
  }

  // ******************
  // Items
  // ******************

  const uniqueByRef = useRef(uniqueBy);
  uniqueByRef.current = uniqueBy;
  const uniqueByKey = typeof uniqueBy === "function" ? uniqueBy.toString() : uniqueBy;

  const uniqueItems = useMemo(() => {
    return getUniqueItems(list.items, uniqueByRef.current);
    // Inline functions change on every render, the key changes only with their code
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.items, uniqueByKey]);

  const selectedRef = useRef<unknown>(null);
  let items: unknown = uniqueItems;

  if (select) {
    const selected = select({ items: uniqueItems as PaginationItem<R, P>[], pages: list.data as any[] });
    items = structuralSharing ? replaceEqualDeep(selectedRef.current, selected) : selected;
    selectedRef.current = items;
  }

  // ******************
  // Actions
  // ******************

  const actions = useMemo(
    () => ({
      fetchNextPage: () => store.fetchNextPage(),
      fetchPreviousPage: () => store.fetchPreviousPage(),
      refetch: () => store.refetch(),
      reset: () => {
        callbacks.current.onReset?.();
        return store.reset();
      },
      abort: () => store.abort(),
      onSuccess: (callback: (event: any) => void) => {
        callbacks.current.onSuccess = callback;
      },
      onError: (callback: (event: any) => void) => {
        callbacks.current.onError = callback;
      },
      onFinished: (callback: (event: any) => void) => {
        callbacks.current.onFinished = callback;
      },
      onReset: (callback: VoidFunction) => {
        callbacks.current.onReset = callback;
      },
    }),
    [store],
  );

  return createTrackedProxy(
    {
      items,
      pages: list.data,
      pageParams: list.pageParams,
      total: list.total,
      hasNextPage: snapshot.hasNextPage,
      hasPreviousPage: snapshot.hasPreviousPage,
      loading: !disabled && snapshot.loading && !isPreviousData,
      isFetching: snapshot.isFetching,
      isRefetching: snapshot.isRefetching,
      isFetchingNextPage: snapshot.isFetchingNextPage,
      isFetchingPreviousPage: snapshot.isFetchingPreviousPage,
      isFetchNextPageError: snapshot.isFetchNextPageError,
      isFetchPreviousPageError: snapshot.isFetchPreviousPageError,
      isPreviousData,
      error: snapshot.error,
      status: snapshot.status,
      extra: snapshot.extra,
      success: snapshot.success,
      bounce: getBounceData(bounceData),
      ...actions,
    },
    trackedKeys,
    (usedKey) => usedKeys.add(usedKey),
  ) as unknown as UseInfiniteFetchReturnType<R, P, TSelected>;
};
