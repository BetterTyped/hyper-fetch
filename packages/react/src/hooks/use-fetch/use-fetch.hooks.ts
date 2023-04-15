import { useRef } from "react";
import { useDidUpdate, useDidMount } from "@better-hooks/lifecycle";
import { useDebounce, useThrottle } from "@better-hooks/performance";
import { RequestInstance, Request, getRequestKey } from "@hyper-fetch/core";

import { useRequestEvents, useTrackedState } from "helpers";
import { UseFetchOptionsType, useFetchDefaultOptions, UseFetchReturnType, getRefreshTime } from "hooks/use-fetch";
import { useConfigProvider } from "config-provider";
import { getBounceData } from "utils";
import { InvalidationKeyType } from "types";

/**
 * This hooks aims to retrieve data from server.
 * @param request Request instance
 * @param options Hook options
 * @returns
 */
export const useFetch = <RequestType extends RequestInstance>(
  request: RequestType,
  options: UseFetchOptionsType<RequestType> = useFetchDefaultOptions,
): UseFetchReturnType<RequestType> => {
  // Build the configuration options
  const [globalConfig] = useConfigProvider();
  const {
    dependencies = useFetchDefaultOptions.dependencies,
    disabled = useFetchDefaultOptions.disabled,
    dependencyTracking = useFetchDefaultOptions.dependencyTracking,
    revalidateOnMount = useFetchDefaultOptions.revalidateOnMount,
    initialData = useFetchDefaultOptions.initialData,
    refresh = useFetchDefaultOptions.refresh,
    refreshTime = useFetchDefaultOptions.refreshTime,
    refreshBlurred = useFetchDefaultOptions.refreshBlurred,
    refreshOnBlur = useFetchDefaultOptions.refreshOnBlur,
    refreshOnFocus = useFetchDefaultOptions.refreshOnFocus,
    refreshOnReconnect = useFetchDefaultOptions.refreshOnReconnect,
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
    if (!refresh) return;
    const time = getRefreshTime(refreshTime, state.timestamp);

    logger.debug(`Starting refresh counter, request will be send in ${time}ms`);

    refreshDebounce.debounce(() => {
      const isBlurred = !appManager.isFocused;

      // If window tab is not active should we refresh the cache
      const isFetching = dispatcher.hasRunningRequests(request.queueKey);
      const isQueued = dispatcher.getIsActiveQueue(request.queueKey);
      const isActive = isFetching || isQueued;
      const canRefreshBlurred = isBlurred && refreshBlurred && !isActive;
      const canRefreshFocused = !isBlurred && !isActive;

      if (canRefreshBlurred || canRefreshFocused) {
        handleFetch();
        logger.debug(`Performing refresh request`);
      }

      // Start new refresh counter
      handleRefresh();
    }, time);
  }

  const handleRevalidation = (invalidateKey: InvalidationKeyType) => {
    if (invalidateKey && invalidateKey instanceof Request) {
      cache.revalidate(getRequestKey(invalidateKey));
    } else if (invalidateKey && !(invalidateKey instanceof Request)) {
      cache.revalidate(invalidateKey);
    }
  };

  const revalidate = (invalidateKey?: InvalidationKeyType | InvalidationKeyType[]) => {
    if (invalidateKey && Array.isArray(invalidateKey)) {
      invalidateKey.forEach(handleRevalidation);
    } else if (invalidateKey && !Array.isArray(invalidateKey)) {
      handleRevalidation(invalidateKey);
    } else {
      handleFetch();
      handleRefresh();
    }
  };

  // ******************
  // Fetching lifecycle
  // ******************

  const initialFetchData = () => {
    const hasStaleData = getStaleStatus();
    const isFetching = dispatcher.getIsActiveQueue(queueKey);
    if (revalidateOnMount || (hasStaleData && !isFetching)) {
      handleFetch();
    }
  };

  const updateFetchData = () => {
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
  };

  // ******************
  // Events
  // ******************

  const handleMountEvents = () => {
    addDataListener(request);
    addLifecycleListeners(request);

    const focusUnmount = appManager.events.onFocus(() => {
      if (refreshOnFocus) {
        handleFetch();
        handleRefresh();
      }
    });
    const blurUnmount = appManager.events.onBlur(() => {
      if (refreshOnBlur) {
        handleFetch();
        handleRefresh();
      }
    });
    const onlineUnmount = appManager.events.onOnline(() => {
      if (refreshOnReconnect) {
        handleFetch();
        handleRefresh();
      }
    });

    const revalidateUnmount = cache.events.onRevalidate(cacheKey, handleFetch);

    const unmount = () => {
      clearDataListener();
      focusUnmount();
      blurUnmount();
      onlineUnmount();
      revalidateUnmount();
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
   * Initial fetch triggered once data is stale or we use the revalidate strategy
   */
  useDidMount(initialFetchData);

  /**
   * Fetching logic for updates handling
   */
  useDidUpdate(updateFetchData, [updateKey, disabled, ...dependencies]);

  /**
   * Refresh lifecycle handler
   */
  useDidUpdate(handleRefresh, [updateKey, ...dependencies, disabled, refresh, refreshTime], true);

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
    get isSuccess() {
      setRenderKey("isSuccess");
      return state.isSuccess;
    },
    get additionalData() {
      setRenderKey("additionalData");
      return state.additionalData;
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
    revalidate,
  };
};
