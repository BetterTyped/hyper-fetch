import { useDidUpdate, useDidMount, useWillUnmount } from "@better-hooks/lifecycle";
import { useDebounce, useThrottle } from "@better-hooks/performance";
import type {
  ClientInstance,
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
import { useRef } from "react";
import { createTrackedProxy, getBounceData } from "utils";
import { keyReplacer } from "utils/key.utils";
import { isSameScope } from "utils/scope.utils";

type SuspenseEntry = { promise: Promise<void>; resolve: () => void; cleanup: () => void };
type SuspenseResult = { data: any; error: any; status: any; extra: any; success: boolean };
type SuspenseStore = { promises: Map<string, SuspenseEntry>; results: Map<string, SuspenseResult> };

// Kept per client and keyed by the scoped cache key, so clients and scopes sharing a cache key never
// wait on or receive each other's suspense results
const suspenseStores = new WeakMap<ClientInstance, SuspenseStore>();

// Data received this recently is not refetched when a suspended component mounts
const suspenseFreshTime = 1000;

const getSuspenseStore = (client: ClientInstance): SuspenseStore => {
  let store = suspenseStores.get(client);
  if (!store) {
    store = { promises: new Map(), results: new Map() };
    suspenseStores.set(client, store);
  }
  return store;
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
  } = {
    ...useFetchDefaultOptions,
    ...globalConfig.useFetchConfig,
    ...options,
  };

  const updateKey = JSON.stringify(request.toJSON(), keyReplacer);
  const requestDebounce = useDebounce({ delay: bounceTime });
  const requestThrottle = useThrottle({ interval: bounceTime, timeout: bounceTimeout });
  const refreshDebounce = useDebounce({ delay: refreshTime });

  const { cacheKey, queryKey, client } = request;
  const { cache, fetchDispatcher: dispatcher, appManager, loggerManager } = client;

  const ignoreReact18DoubleRender = useRef(true);
  const resolvedBySuspense = useRef(false);
  const logger = useRef(loggerManager.initialize(client, "useFetch")).current;
  const bounceData = bounceType === "throttle" ? requestThrottle : requestDebounce;
  const bounceFunction = bounceType === "throttle" ? requestThrottle.throttle : requestDebounce.debounce;

  /**
   * State handler with optimization for re-rendering, that hooks into the cache state and dispatchers queues
   */
  const [
    state,
    actions,
    { setRenderKey, setCacheData, getStaleStatus, getIsDataProcessing, selectData, getResponseDetails },
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
      const isBlurred = !appManager.isFocused;

      // If window tab is not active should we refresh the cache
      const scopedQueryKey = scopeKey(request.queryKey, request.scope);
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
    });
  }

  const refetch = () => {
    handleFetch({ force: true });
    handleRefresh();
  };

  // ******************
  // Fetching lifecycle
  // ******************

  // This help us to check for currently running requests
  const getIsFetchingIdentity = () => {
    // We need to check if the queryKey have the same cacheKey elements ongoing
    return dispatcher
      .getRunningRequests(scopeKey(queryKey, request.scope))
      .some((running) => running.request.cacheKey === cacheKey);
  };

  /**
   * A suspended component mounts right after its own request resolved - fetching again on mount would
   * duplicate that request. Data received within the last moment counts as fresh, like the minimal stale time
   * applied by other suspense-enabled libraries.
   */
  const getHasJustResolvedSuspense = () => {
    if (!suspense) {
      return false;
    }
    if (resolvedBySuspense.current) {
      return true;
    }
    const cacheData = cache.get(scopeKey(cacheKey, request.scope));
    return !!cacheData && Date.now() - cacheData.responseTimestamp < suspenseFreshTime;
  };

  const initialFetchData = () => {
    if (getHasJustResolvedSuspense()) {
      return;
    }
    const hasStaleData = getStaleStatus();
    const isFetching = getIsFetchingIdentity();
    if ((revalidate || hasStaleData) && !isFetching) {
      handleFetch();
    }
  };

  const updateFetchData = () => {
    const hasStaleData = getStaleStatus();
    const shouldUpdate = !revalidate ? hasStaleData : true;
    /**
     * This is a hack to avoid double rendering in React 18
     * It renders initial mount event and allow us to consume only hook updates
     */
    if (!ignoreReact18DoubleRender.current && shouldUpdate) {
      /**
       * While debouncing we need to make sure that first request is not debounced when the cache is not available
       * This way it will not wait for debouncing but fetch data right away
       */
      if (bounce) {
        logger.debug({ title: `Bounce request with ${bounceType}`, type: "system", extra: { queryKey, request } });
        bounceFunction(() => handleFetch());
      } else {
        handleFetch();
      }
    } else {
      ignoreReact18DoubleRender.current = false;
    }
  };

  // ******************
  // Events
  // ******************

  const handleMountEvents = () => {
    addCacheDataListener(request as unknown as R);
    addLifecycleListeners(request as unknown as R);

    const focusUnmount = appManager.events.onFocus(() => {
      if (refetchOnFocus && !disabled) {
        handleFetch();
        handleRefresh();
      }
    });
    const blurUnmount = appManager.events.onBlur(() => {
      if (refetchOnBlur && !disabled) {
        handleFetch();
        handleRefresh();
      }
    });
    const onlineUnmount = appManager.events.onOnline(() => {
      if (refetchOnReconnect && !disabled) {
        handleFetch();
        handleRefresh();
      }
    });

    const invalidateUnmount = cache.events.onInvalidateByKey(cacheKey, handleFetch);
    const deletionUnmount = cache.events.onDeleteByKey(cacheKey, handleFetch);

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
  useDidUpdate(handleMountEvents, [updateKey, disabled], true);

  /**
   * Initial fetch triggered once data is stale or we use the refetch strategy
   */
  useDidMount(initialFetchData);

  /**
   * Fetching logic for updates handling
   */
  useDidUpdate(updateFetchData, [updateKey, disabled, ...dependencies], true);

  /**
   * Refresh lifecycle handler
   */
  useDidUpdate(handleRefresh, [updateKey, ...dependencies, disabled, refresh, refreshTime], true);

  /**
   * Reset the ignore flag for React 18 strict mode
   */
  useWillUnmount(() => {
    ignoreReact18DoubleRender.current = true;
  });

  // ******************
  // Suspense
  // ******************
  if (suspense && !disabled) {
    const { promises: suspensePromiseMap, results: suspenseResultMap } = getSuspenseStore(client);
    const suspenseKey = scopeKey(cacheKey, request.scope);

    // Apply any cached suspense result (covers error responses that aren't stored in cache)
    const suspenseResult = suspenseResultMap.get(suspenseKey);
    if (suspenseResult) {
      suspenseResultMap.delete(suspenseKey);
      // Error responses are not cached, so the mount logic cannot see they just arrived
      resolvedBySuspense.current = true;
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
      // The response has arrived - nothing is loading unless another request for this key is running
      state.loading = dispatcher.hasRunningRequests(scopeKey(queryKey, request.scope));
    }

    const hasData = state.data !== null || state.error !== null;

    if (!hasData) {
      let entry = suspensePromiseMap.get(suspenseKey);
      if (!entry) {
        let resolvePromise: () => void;
        const promise = new Promise<void>((r) => {
          resolvePromise = r;
        });

        // Cache events are emitted by the logical cacheKey - skip data of other scopes
        const unsubscribe = cache.events.onDataByKey(cacheKey, (cacheData: any) => {
          if (!isSameScope(cacheData.scope, request.scope)) {
            return;
          }
          suspenseResultMap.set(suspenseKey, {
            data: cacheData.data ?? null,
            error: cacheData.error ?? null,
            status: cacheData.status ?? null,
            extra: cacheData.extra ?? null,
            success: cacheData.success ?? false,
          });
          resolvePromise();
          unsubscribe();
          suspensePromiseMap.delete(suspenseKey);
        });

        entry = { promise, resolve: resolvePromise!, cleanup: unsubscribe };
        suspensePromiseMap.set(suspenseKey, entry);
      }

      // Ensure the request is dispatched before suspending —
      // effects never run when a component suspends.
      // React may render a suspended component again before the queued request starts running,
      // so a queued request counts as dispatched too.
      const scopedQueryKey = scopeKey(queryKey, request.scope);
      if (!dispatcher.hasRunningRequests(scopedQueryKey) && !dispatcher.getIsActiveQueue(scopedQueryKey)) {
        dispatcher.add(request as unknown as R);
      }

      throw entry.promise;
    }

    // Data has arrived — clean up any leftover entry
    const entry = suspensePromiseMap.get(suspenseKey);
    if (entry) {
      entry.cleanup();
      suspensePromiseMap.delete(suspenseKey);
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
