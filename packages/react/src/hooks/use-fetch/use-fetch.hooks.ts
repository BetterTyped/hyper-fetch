import { useDidUpdate } from "@better-hooks/lifecycle";
import { useDebounce, useThrottle } from "@better-hooks/performance";
import type {
  CacheValueType,
  RequestInstance,
  ExtractAdapterStatusType,
  ExtractAdapterType,
  ExtractAdapterExtraType,
  ExtractErrorType,
  ExtractResponseType,
} from "@hyper-fetch/core";
import { scopeKey } from "@hyper-fetch/core";
import { useRequestEvents, useTrackedState } from "helpers";
import type { UseFetchOptionsType, UseFetchReturnType } from "hooks/use-fetch";
import { useFetchDefaultOptions } from "hooks/use-fetch";
import { useProvider } from "provider";
import { useCallback, useEffect, useRef } from "react";
import { createTrackedProxy, getBounceData } from "utils";
import { keyReplacer } from "utils/key.utils";
import { isSameScope } from "utils/scope.utils";

type SuspenseEntry = { promise: Promise<void>; resolve: () => void; cleanup: () => void };
type SuspenseResult = Pick<
  CacheValueType<any, any>,
  "data" | "error" | "status" | "extra" | "success" | "retries" | "responseTimestamp" | "requestTimestamp"
> & { receivedTimestamp: number };
type SuspenseStore = { promises: Map<string, SuspenseEntry>; results: Map<string, SuspenseResult> };

/**
 * Suspended components lose their state, so the pending promises and the responses that are not stored in the cache
 * have to live outside of them. They are kept per cache instance - every client (and every cleared client)
 * has its own store, so responses never leak between the clients.
 */
const suspenseStores = new WeakMap<object, SuspenseStore>();
const getSuspenseStore = (cache: object): SuspenseStore => {
  let store = suspenseStores.get(cache);
  if (!store) {
    store = { promises: new Map(), results: new Map() };
    suspenseStores.set(cache, store);
  }
  return store;
};

/**
 * Data received by the suspended component is not fetched again when it mounts right after.
 * Responses waiting for the suspended component are dropped after this time - the component is gone.
 */
const suspenseFreshTime = 1000;

/**
 * Options passed as `undefined` (e.g. forwarded optional props) fall back to the defaults instead of overriding them
 */
const mergeOptions = <T extends object>(...sources: (object | undefined)[]): T => {
  const merged: Record<string, unknown> = {};
  sources.forEach((source) => {
    Object.entries(source || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        merged[key] = value;
      }
    });
  });
  return merged as T;
};

/**
 * This hook aims to retrieve data from the server. It automatically fetches on mount and
 * refetches based on dependencies, with support for caching, polling, and suspense.
 * @param request Request instance
 * @param options Hook options
 * @returns
 */
export const useFetch = <R extends RequestInstance, TSelected = ExtractResponseType<R>>(
  request: R,
  options?: UseFetchOptionsType<R, TSelected>,
): UseFetchReturnType<R, TSelected> => {
  // Build the configuration options
  const { config: globalConfig } = useProvider();
  const {
    suspense,
    dependencies,
    disabled,
    dependencyTracking,
    revalidate,
    initialResponse,
    keepPreviousData,
    refresh,
    refreshTime,
    refetchBlurred,
    refetchOnBlur,
    refetchOnFocus,
    refetchOnReconnect,
    bounce,
    bounceType,
    bounceTime,
    bounceTimeout,
    deepCompare,
    structuralSharing,
    throwOnError,
  } = mergeOptions<typeof useFetchDefaultOptions & UseFetchOptionsType<R, TSelected>>(
    useFetchDefaultOptions,
    globalConfig.useFetchConfig,
    options,
  );

  const updateKey = JSON.stringify(request.toJSON(), keyReplacer);
  const requestDebounce = useDebounce({ delay: bounceTime });
  const requestThrottle = useThrottle({ interval: bounceTime, timeout: bounceTimeout });
  const refreshDebounce = useDebounce({ delay: refreshTime });

  const { cacheKey, queryKey, client } = request;
  const { cache, fetchDispatcher: dispatcher, appManager, loggerManager } = client;
  // Cache storage and dispatcher queues are keyed with the scope of the request
  const scopedCacheKey = scopeKey(cacheKey, request.scope);
  const scopedQueryKey = scopeKey(queryKey, request.scope);

  const fetchDependencies = useRef<unknown[] | null>(null);
  // Async work started by a render checks it before it acts - StrictMode unmounts and mounts again, so it is set back
  const isMounted = useRef(false);
  const isSuspenseResolved = useRef(false);
  const logger = useRef(loggerManager.initialize(client, "useFetch")).current;
  const bounceData = bounceType === "throttle" ? requestThrottle : requestDebounce;
  const bounceFunction = bounceType === "throttle" ? requestThrottle.throttle : requestDebounce.debounce;

  /**
   * State handler with optimization for re-rendering, that hooks into the cache state and dispatchers queues
   */
  const [
    state,
    actions,
    {
      setRenderKey,
      setCacheData,
      getStaleStatus,
      getIsDataProcessing,
      getIsWaitingForRetry,
      selectData,
      getResponseDetails,
    },
  ] = useTrackedState<R, TSelected>({
    logger,
    request: request as unknown as R,
    dispatcher,
    initialResponse,
    deepCompare,
    dependencyTracking,
    keepPreviousData,
    disabled,
    revalidate,
    select: options?.select,
    structuralSharing,
  });

  /**
   * Handles the data exchange with the core logic - responses, loading, downloading etc
   */
  const [callbacks, listeners] = useRequestEvents<R>({
    logger,
    actions,
    request: request as unknown as R,
    dispatcher,
    setCacheData,
    getIsDataProcessing,
    getIsWaitingForRetry,
  });

  const { addCacheDataListener, addLifecycleListeners, clearCacheDataListener } = listeners;

  // ******************
  // Fetching
  // ******************
  const handleFetch = (options?: { force?: boolean }) => {
    if (!disabled) {
      logger.debug({ title: `Fetching data`, type: "system", extra: { request } });
      // A forced fetch must not be deduplicated into an already running request: that request
      // started earlier, so its response can be older than the state that prompted the call.
      // Manual refetch() promises data at least as fresh as the moment it was called.
      const requestToAdd = options?.force ? request.setDeduplicate(false) : request;
      dispatcher.add(requestToAdd as unknown as R);
    } else {
      logger.debug({ title: `Cannot add to fetch queue`, type: "system", extra: { disabled } });
    }
  };

  // ******************
  // Refreshing
  // ******************

  function handleRefresh() {
    if (!refresh || disabled) {
      refreshDebounce.reset();
      return;
    }

    refreshDebounce.debounce(() => {
      // Timer outlives the render which started it - always use the latest options and request
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      latest.current.refresh();
    });
  }

  const performRefresh = () => {
    const isBlurred = !appManager.isFocused;

    // If window tab is not active should we refresh the cache
    const isFetching = dispatcher.hasRunningRequests(scopedQueryKey);
    const isQueued = dispatcher.getIsActiveQueue(scopedQueryKey);
    const isActive = isFetching || isQueued;
    const canRefreshBlurred = isBlurred && refetchBlurred && !isActive;
    const canRefreshFocused = !isBlurred && !isActive;

    if (canRefreshBlurred || canRefreshFocused) {
      handleFetch();
      logger.debug({ title: `Performing refresh request`, type: "system", extra: { request } });
    }

    // Start new refresh counter
    handleRefresh();
  };

  const handleRefetch = () => {
    handleFetch({ force: true });
    handleRefresh();
  };

  /**
   * Events and timers are registered once and live longer than a single render.
   * This ref gives them the handlers and options from the latest render.
   */
  const latest = useRef({
    disabled,
    refetchOnFocus,
    refetchOnBlur,
    refetchOnReconnect,
    fetch: handleFetch,
    refresh: performRefresh,
    restartRefresh: handleRefresh,
    refetch: handleRefetch,
  });
  latest.current = {
    disabled,
    refetchOnFocus,
    refetchOnBlur,
    refetchOnReconnect,
    fetch: handleFetch,
    refresh: performRefresh,
    restartRefresh: handleRefresh,
    refetch: handleRefetch,
  };

  // Stable identity - safe to use in the dependency arrays
  const refetch = useCallback(() => {
    latest.current.refetch();
  }, []);

  // ******************
  // Fetching lifecycle
  // ******************

  // This help us to check for currently running requests
  const getIsFetchingIdentity = () => {
    // We need to check if the queryKey have the same cacheKey elements ongoing
    return dispatcher.getRunningRequests(scopedQueryKey).some((running) => running.request.cacheKey === cacheKey);
  };

  const haveDependenciesChanged = (previous: unknown[] | null, current: unknown[] | null) =>
    !previous ||
    !current ||
    previous.length !== current.length ||
    current.some((dependency, index) => !Object.is(dependency, previous[index]));

  const initialFetchData = () => {
    const hasStaleData = getStaleStatus();
    const isFetching = getIsFetchingIdentity();
    // Suspended component already waited for this response - do not ask for it again right after mounting
    const cacheTimestamp = cache.get(scopedCacheKey)?.responseTimestamp;
    const isFreshSuspenseData =
      suspense &&
      (isSuspenseResolved.current ||
        (typeof cacheTimestamp === "number" && Date.now() - cacheTimestamp < suspenseFreshTime));
    isSuspenseResolved.current = false;

    if (!(revalidate || hasStaleData) || isFetching || isFreshSuspenseData) {
      return;
    }

    // Without revalidation only stale data is fetched. Data kept only in the lazy storage (IndexedDB, AsyncStorage)
    // is read asynchronously, so it is awaited first - fresh persisted data needs no request.
    const isLazyDataPending = !revalidate && !suspense && !!cache.lazyStorage && !cache.storage.get(scopedCacheKey);
    if (!isLazyDataPending) {
      handleFetch();
      return;
    }

    const handledDependencies = fetchDependencies.current;
    const fetchWhenStale = () => {
      // The request or the options changed meanwhile - their own lifecycle takes over
      if (!isMounted.current || haveDependenciesChanged(handledDependencies, fetchDependencies.current)) {
        return;
      }
      if (getStaleStatus() && !getIsFetchingIdentity()) {
        latest.current.fetch();
      }
    };
    cache.getLazyResource(scopedCacheKey).then(fetchWhenStale, fetchWhenStale);
  };

  const updateFetchData = () => {
    const hasStaleData = getStaleStatus();
    const shouldUpdate = !revalidate ? hasStaleData : true;

    if (shouldUpdate) {
      /**
       * Only the updates are bounced - the initial request is sent right away
       */
      if (bounce) {
        logger.debug({ title: `Bounce request with ${bounceType}`, type: "system", extra: { queryKey, request } });
        // Bounced callback can run after the next renders - it has to use the latest request and options
        bounceFunction(() => latest.current.fetch());
      } else {
        handleFetch();
      }
    }
  };

  /**
   * Effects can run again without any change - on StrictMode remount or when the hidden <Activity> is revealed.
   * We compare the dependencies with the ones already handled, to fetch once on mount and once per change.
   */
  const handleFetchLifecycle = () => {
    const currentDependencies = [updateKey, disabled, ...dependencies];
    const previousDependencies = fetchDependencies.current;
    fetchDependencies.current = currentDependencies;

    if (!previousDependencies) {
      initialFetchData();
      return;
    }

    if (haveDependenciesChanged(previousDependencies, currentDependencies)) {
      updateFetchData();
    }
  };

  // ******************
  // Events
  // ******************

  const handleMountEvents = () => {
    addCacheDataListener(request as unknown as R);
    addLifecycleListeners(request as unknown as R);

    // Options can change without re-registering the listeners - they are read when the event happens
    const focusUnmount = appManager.events.onFocus(() => {
      if (latest.current.refetchOnFocus && !latest.current.disabled) {
        latest.current.fetch();
        latest.current.restartRefresh();
      }
    });
    const blurUnmount = appManager.events.onBlur(() => {
      if (latest.current.refetchOnBlur && !latest.current.disabled) {
        latest.current.fetch();
        latest.current.restartRefresh();
      }
    });
    const onlineUnmount = appManager.events.onOnline(() => {
      if (latest.current.refetchOnReconnect && !latest.current.disabled) {
        latest.current.fetch();
        latest.current.restartRefresh();
      }
    });

    // Invalidation and deletion are emitted by the request cache key, which is shared between the scopes.
    // The event carries the key of the changed element - only our own one has to be fetched again.
    const handleCacheChange = (changedKey: string) => {
      if (changedKey === scopedCacheKey) {
        latest.current.fetch();
      }
    };
    const invalidateUnmount = cache.events.onInvalidateByKey(cacheKey, handleCacheChange);
    const deletionUnmount = cache.events.onDeleteByKey(cacheKey, handleCacheChange);

    const unmount = () => {
      clearCacheDataListener();
      focusUnmount();
      blurUnmount();
      onlineUnmount();
      invalidateUnmount();
      deletionUnmount();
    };

    return unmount;
  };

  // ******************
  // Lifecycle
  // ******************

  /**
   * Initialization of the events related to data exchange with cache and queue
   * This allows to share the state with other hooks and keep it related
   */
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useDidUpdate(handleMountEvents, [updateKey, disabled], true);

  /**
   * Initial fetch triggered once data is stale or we use the refetch strategy
   * and the fetching logic for updates handling
   */
  useDidUpdate(handleFetchLifecycle, [updateKey, disabled, ...dependencies], true);

  /**
   * Refresh lifecycle handler
   */
  useDidUpdate(handleRefresh, [updateKey, ...dependencies, disabled, refresh, refreshTime], true);

  // ******************
  // Suspense
  // ******************
  if (suspense && !disabled) {
    const store = getSuspenseStore(cache);

    // Apply any cached suspense result (covers error responses that aren't stored in cache)
    const storedResult = store.results.get(scopedCacheKey);
    // Nobody picked the response up in time (suspended component got unmounted) - it is outdated now
    const suspenseResult =
      storedResult && Date.now() - storedResult.receivedTimestamp <= suspenseFreshTime ? storedResult : null;
    if (storedResult && !suspenseResult) {
      store.results.delete(scopedCacheKey);
    }
    if (suspenseResult) {
      // Result stays available until the end of the current render pass. React can render the component more than
      // once before it mounts (StrictMode, retry after a thrown error) and other components can wait for the same response.
      queueMicrotask(() => {
        if (store.results.get(scopedCacheKey) === suspenseResult) {
          store.results.delete(scopedCacheKey);
        }
      });
      isSuspenseResolved.current = true;
      if (suspenseResult.data !== null) {
        state.data = selectData(suspenseResult.data);
      }
      if (suspenseResult.error !== null) {
        state.error = suspenseResult.error;
      }
      if (suspenseResult.status !== null) {
        state.status = suspenseResult.status;
      }
      if (suspenseResult.extra !== null) {
        state.extra = suspenseResult.extra;
      }
      state.success = suspenseResult.success;
      state.loading = dispatcher.hasRunningRequests(scopedQueryKey);
      state.retries = suspenseResult.retries ?? state.retries;
      // Timestamps tell that the response was received - also when it came without any data
      state.responseTimestamp = new Date(suspenseResult.responseTimestamp);
      state.requestTimestamp = new Date(suspenseResult.requestTimestamp);
    }

    // Response without data (like 204 No Content) is still a response - suspending on it would never end
    const hasData = state.data !== null || state.error !== null || state.responseTimestamp !== null;

    if (!hasData) {
      let entry = store.promises.get(scopedCacheKey);
      if (!entry) {
        let resolvePromise: () => void;
        const promise = new Promise<void>((r) => {
          resolvePromise = r;
        });

        const unsubscribe = cache.events.onDataByKey(cacheKey, (cacheData: CacheValueType<any, any>) => {
          // Events of the same cache key are shared between the scopes
          if (!isSameScope(cacheData.scope, request.scope)) {
            return;
          }

          store.results.set(scopedCacheKey, {
            data: cacheData.data ?? null,
            error: cacheData.error ?? null,
            status: cacheData.status ?? null,
            extra: cacheData.extra ?? null,
            success: cacheData.success ?? false,
            retries: cacheData.retries ?? 0,
            responseTimestamp: cacheData.responseTimestamp ?? Date.now(),
            requestTimestamp: cacheData.requestTimestamp ?? Date.now(),
            receivedTimestamp: Date.now(),
          });
          resolvePromise();
          unsubscribe();
          store.promises.delete(scopedCacheKey);
        });

        entry = { promise, resolve: resolvePromise!, cleanup: unsubscribe };
        store.promises.set(scopedCacheKey, entry);
      }

      // Ensure the request is dispatched before suspending —
      // effects never run when a component suspends.
      // React may render a suspended component again before the queued request starts running,
      // so a queued request counts as dispatched too.
      if (!dispatcher.hasRunningRequests(scopedQueryKey) && !dispatcher.getIsActiveQueue(scopedQueryKey)) {
        dispatcher.add(request as unknown as R);
      }

      throw entry.promise;
    }

    // Data has arrived — clean up any leftover entry
    const entry = store.promises.get(scopedCacheKey);
    if (entry) {
      entry.cleanup();
      store.promises.delete(scopedCacheKey);
    }
  }

  // ******************
  // Error boundary
  // ******************
  if (throwOnError) {
    // The error has to be observed to rerender (and throw) even if the component does not read it
    setRenderKey("error");
    setRenderKey("loading");
    setRenderKey("success");

    const details = getResponseDetails();
    // Errors of retried, canceled or offline (re-queued) requests are not final
    const isSettled = !state.loading && !details?.willRetry && !details?.isCanceled && !details?.isOffline;
    const hasError = !state.success && state.error !== null && state.error !== undefined;

    if (isSettled && hasError) {
      const error = state.error as ExtractErrorType<R>;
      if (typeof throwOnError === "function" ? throwOnError(error) : throwOnError) {
        throw error;
      }
    }
  }

  const trackedKeys = [
    "data",
    "error",
    "loading",
    "status",
    "success",
    "extra",
    "retries",
    "responseTimestamp",
    "requestTimestamp",
  ] as const;

  return createTrackedProxy(
    {
      data: state.data,
      error: state.error,
      loading: state.loading,
      status: state.status as ExtractAdapterStatusType<ExtractAdapterType<R>>,
      success: state.success,
      extra: state.extra as ExtractAdapterExtraType<ExtractAdapterType<R>>,
      retries: state.retries,
      responseTimestamp: state.responseTimestamp,
      requestTimestamp: state.requestTimestamp,
      bounce: getBounceData(bounceData),
      ...actions,
      ...(callbacks as any),
      refetch,
    },
    trackedKeys,
    setRenderKey,
  ) as UseFetchReturnType<R, TSelected>;
};
