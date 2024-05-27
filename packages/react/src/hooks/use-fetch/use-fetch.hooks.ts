import { useRef } from "react";
import { useDidUpdate, useDidMount, useWillUnmount } from "@better-hooks/lifecycle";
import { useDebounce, useThrottle } from "@better-hooks/performance";
import { RequestInstance, Request, getRequestKey } from "@hyper-fetch/core";

import { useRequestEvents, useTrackedState } from "helpers";
import { UseFetchOptionsType, useFetchDefaultOptions, UseFetchReturnType, UseFetchRequest } from "hooks/use-fetch";
import { useConfigProvider } from "config-provider";
import { getBounceData } from "utils";
import { InvalidationKeyType } from "types";

/**
 * This hooks aims to retrieve data from server.
 * @param request Request instance
 * @param options Hook options
 * @returns
 */
export const useFetch = <R extends RequestInstance>(
  request: UseFetchRequest<R>,
  options: UseFetchOptionsType<UseFetchRequest<R>> = useFetchDefaultOptions,
): UseFetchReturnType<UseFetchRequest<R>> => {
  type RequestType = UseFetchRequest<R>;

  // Build the configuration options
  const { config: globalConfig } = useConfigProvider();
  const {
    dependencies = useFetchDefaultOptions.dependencies,
    disabled = useFetchDefaultOptions.disabled,
    dependencyTracking = useFetchDefaultOptions.dependencyTracking,
    revalidate = useFetchDefaultOptions.revalidate,
    initialData = useFetchDefaultOptions.initialData,
    refresh = useFetchDefaultOptions.refresh,
    refreshTime = useFetchDefaultOptions.refreshTime,
    refetchBlurred = useFetchDefaultOptions.refetchBlurred,
    refetchOnBlur = useFetchDefaultOptions.refetchOnBlur,
    refetchOnFocus = useFetchDefaultOptions.refetchOnFocus,
    refetchOnReconnect = useFetchDefaultOptions.refetchOnReconnect,
    bounce = useFetchDefaultOptions.bounce,
    bounceType = useFetchDefaultOptions.bounceType,
    bounceTime = useFetchDefaultOptions.bounceTime,
    bounceTimeout = useFetchDefaultOptions.bounceTime,
    deepCompare = useFetchDefaultOptions.deepCompare,
  } = {
    ...useFetchDefaultOptions,
    ...globalConfig.useFetchConfig,
    ...options,
  };

  const updateKey = JSON.stringify(request.toJSON());
  const requestDebounce = useDebounce({ delay: bounceTime });
  const requestThrottle = useThrottle({ interval: bounceTime, timeout: bounceTimeout });
  const refreshDebounce = useDebounce({ delay: refreshTime });

  const { cacheKey, queueKey, client } = request;
  const { cache, fetchDispatcher: dispatcher, appManager, loggerManager } = client;

  const ignoreReact18DoubleRender = useRef(true);
  const logger = useRef(loggerManager.init("useFetch")).current;
  const bounceData = bounceType === "throttle" ? requestThrottle : requestDebounce;
  const bounceFunction = bounceType === "throttle" ? requestThrottle.throttle : requestDebounce.debounce;

  /**
   * State handler with optimization for re-rendering, that hooks into the cache state and dispatchers queues
   */
  const [state, actions, { setRenderKey, setCacheData, getStaleStatus }] = useTrackedState<RequestType>({
    logger,
    request,
    dispatcher,
    initialData,
    deepCompare,
    dependencyTracking,
  });

  /**
   * Handles the data exchange with the core logic - responses, loading, downloading etc
   */
  const [callbacks, listeners] = useRequestEvents({
    logger,
    actions,
    request,
    dispatcher,
    setCacheData,
  });

  const { addDataListener, addLifecycleListeners, clearDataListener } = listeners;

  // ******************
  // Fetching
  // ******************
  const handleFetch = () => {
    if (!disabled) {
      logger.debug(`Fetching data`);
      dispatcher.add(request);
    } else {
      logger.debug(`Cannot add to fetch queue`, { disabled });
    }
  };

  // ******************
  // Refreshing
  // ******************

  function handleRefresh() {
    if (!refresh) {
      refreshDebounce.reset();
      return;
    }

    refreshDebounce.debounce(() => {
      const isBlurred = !appManager.isFocused;

      // If window tab is not active should we refresh the cache
      const isFetching = dispatcher.hasRunningRequests(request.queueKey);
      const isQueued = dispatcher.getIsActiveQueue(request.queueKey);
      const isActive = isFetching || isQueued;
      const canRefreshBlurred = isBlurred && refetchBlurred && !isActive;
      const canRefreshFocused = !isBlurred && !isActive;

      if (canRefreshBlurred || canRefreshFocused) {
        handleFetch();
        logger.debug(`Performing refresh request`);
      }

      // Start new refresh counter
      handleRefresh();
    });
  }

  const handleInvalidation = (invalidateKey: InvalidationKeyType) => {
    if (invalidateKey && invalidateKey instanceof Request) {
      cache.invalidate(getRequestKey(invalidateKey));
    } else if (invalidateKey && !(invalidateKey instanceof Request)) {
      cache.invalidate(invalidateKey);
    }
  };

  const refetch = (invalidateKey?: InvalidationKeyType | InvalidationKeyType[]) => {
    if (invalidateKey && Array.isArray(invalidateKey)) {
      invalidateKey.forEach(handleInvalidation);
    } else if (invalidateKey && !Array.isArray(invalidateKey)) {
      handleInvalidation(invalidateKey);
    } else {
      handleFetch();
      handleRefresh();
    }
  };

  // ******************
  // Fetching lifecycle
  // ******************

  // This help us to check for currently running requests
  const getIsFetchingIdentity = () => {
    // We need to check if the queueKey have the same cacheKey elements ongoing
    return dispatcher.getRunningRequests(queueKey).some((running) => running.request.cacheKey === cacheKey);
  };

  const initialFetchData = () => {
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
        logger.debug(`Bounce request with ${bounceType}`, { queueKey, request });
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
    addDataListener(request);
    addLifecycleListeners(request);

    const focusUnmount = appManager.events.onFocus(() => {
      if (refetchOnFocus) {
        handleFetch();
        handleRefresh();
      }
    });
    const blurUnmount = appManager.events.onBlur(() => {
      if (refetchOnBlur) {
        handleFetch();
        handleRefresh();
      }
    });
    const onlineUnmount = appManager.events.onOnline(() => {
      if (refetchOnReconnect) {
        handleFetch();
        handleRefresh();
      }
    });

    const invalidateUnmount = cache.events.onInvalidate(cacheKey, handleFetch);

    const unmount = () => {
      clearDataListener();
      focusUnmount();
      blurUnmount();
      onlineUnmount();
      invalidateUnmount();
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
  useDidUpdate(handleMountEvents, [updateKey], true);

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

  return {
    get data() {
      setRenderKey("data");
      return state.data;
    },
    get error() {
      setRenderKey("error");
      return state.error;
    },
    get loading() {
      setRenderKey("loading");
      return state.loading;
    },
    get status() {
      setRenderKey("status");
      return state.status;
    },
    get success() {
      setRenderKey("success");
      return state.success;
    },
    get extra() {
      setRenderKey("extra");
      return state.extra;
    },
    get retries() {
      setRenderKey("retries");
      return state.retries;
    },
    get timestamp() {
      setRenderKey("timestamp");
      return state.timestamp;
    },
    bounce: getBounceData(bounceData),
    ...actions,
    ...callbacks,
    refetch,
  };
};
