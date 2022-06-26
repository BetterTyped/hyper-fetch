import { useRef } from "react";
import { useDidUpdate, useDidMount } from "@better-typed/react-lifecycle-hooks";
import { CommandInstance, Command, getCommandKey } from "@better-typed/hyper-fetch";

import { useDebounce, useCommandEvents, useDependentState } from "helpers";
import { UseFetchOptionsType, useFetchDefaultOptions } from "use-fetch";

/**
 * This hooks aims to retrieve data from server.
 * @param command Command instance
 * @param options Hook options
 * @returns
 */
export const useFetch = <T extends CommandInstance>(
  command: T,
  {
    dependencies = useFetchDefaultOptions.dependencies,
    disabled = useFetchDefaultOptions.disabled,
    dependencyTracking = useFetchDefaultOptions.dependencyTracking,
    revalidateOnMount = useFetchDefaultOptions.revalidateOnMount,
    initialData = useFetchDefaultOptions.initialData,
    refresh = useFetchDefaultOptions.refresh,
    refreshTime = useFetchDefaultOptions.refreshTime,
    refreshBlurred = useFetchDefaultOptions.refreshBlurred,
    refreshOnTabBlur = useFetchDefaultOptions.refreshOnTabBlur,
    refreshOnTabFocus = useFetchDefaultOptions.refreshOnTabFocus,
    refreshOnReconnect = useFetchDefaultOptions.refreshOnReconnect,
    debounce = useFetchDefaultOptions.debounce,
    debounceTime = useFetchDefaultOptions.debounceTime,
    deepCompare = useFetchDefaultOptions.deepCompare,
  }: UseFetchOptionsType<T> = useFetchDefaultOptions,
) => {
  const updateKey = JSON.stringify(command.dump());
  const requestDebounce = useDebounce(debounceTime);
  const refreshDebounce = useDebounce(refreshTime);

  const { cacheKey, queueKey, builder } = command;
  const { cache, fetchDispatcher: dispatcher, appManager, loggerManager } = builder;

  const logger = useRef(loggerManager.init("useFetch")).current;

  /**
   * State handler with optimization for rerendering, that hooks into the cache state and dispatchers queues
   */
  const [state, actions, { setRenderKey, setCacheData, getStaleStatus }] = useDependentState<T>({
    logger,
    command,
    dispatcher,
    initialData,
    deepCompare,
    dependencyTracking,
  });

  /**
   * Handles the data exchange with the core logic - responses, loading, downloading etc
   */
  const [callbacks, listeners] = useCommandEvents({
    state,
    logger,
    actions,
    command,
    dispatcher,
    setCacheData,
  });

  const { addDataListener, addLifecycleListeners, clearDataListener, clearLifecycleListeners } = listeners;

  // ******************
  // Fetching
  // ******************
  const handleFetch = () => {
    if (!disabled) {
      logger.debug(`Adding request to fetch queue`);
      dispatcher.add(command);
    } else {
      logger.debug(`Cannot add to fetch queue`, { disabled });
    }
  };

  // ******************
  // Refreshing
  // ******************

  function handleRefresh() {
    if (!refresh) return;
    logger.debug(`Starting refresh counter, request will be send in ${refreshTime}ms`);

    refreshDebounce.debounce(() => {
      const isBlurred = !appManager.isFocused;

      // If window tab is not active should we refresh the cache
      const isFetching = dispatcher.hasRunningRequests(command.queueKey);
      const isQueued = dispatcher.getIsActiveQueue(command.queueKey);
      const isActive = isFetching || isQueued;
      const canRefreshBlurred = isBlurred && refreshBlurred && !isActive;
      const canRefreshFocused = !isBlurred && !isActive;

      if (canRefreshBlurred || canRefreshFocused) {
        handleFetch();
        logger.debug(`Performing refresh request`);
      }

      // Start new refresh counter
      handleRefresh();
    });
  }

  const revalidate = (invalidateKey?: string | CommandInstance | RegExp) => {
    if (invalidateKey && invalidateKey instanceof Command) {
      cache.events.revalidate(getCommandKey(invalidateKey));
    } else if (invalidateKey) {
      cache.events.revalidate(invalidateKey);
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
    if (revalidateOnMount || hasStaleData) {
      handleFetch();
    }
  };

  const updateFetchData = () => {
    /**
     * While debouncing we need to make sure that first request is not debounced when the cache is not available
     * This way it will not wait for debouncing but fetch data right away
     */
    if (debounce) {
      logger.debug("Debouncing request", { queueKey, command });
      requestDebounce.debounce(() => handleFetch());
    } else {
      handleFetch();
    }
  };

  // ******************
  // Events
  // ******************

  const handleMountEvents = () => {
    addDataListener(command);
    addLifecycleListeners(command);

    const focusUnmount = appManager.events.onFocus(() => {
      if (refreshOnTabFocus) {
        handleFetch();
        handleRefresh();
      }
    });
    const blurUnmount = appManager.events.onBlur(() => {
      if (refreshOnTabBlur) {
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
      clearLifecycleListeners();
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
   * This allow to share the state with other hooks and keep it related
   */
  useDidUpdate(handleMountEvents, [updateKey], true);

  /**
   * Initial fetch triggered once data is stale or we use the revalidate strategy
   */
  useDidMount(initialFetchData);

  /**
   * Fetching logic for updates handling
   */
  useDidUpdate(updateFetchData, [updateKey, ...dependencies]);

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
    get retries() {
      setRenderKey("retries");
      return state.retries;
    },
    get timestamp() {
      setRenderKey("timestamp");
      return state.timestamp;
    },
    ...actions,
    ...callbacks,
    isDebouncing: requestDebounce.active,
    revalidate,
  };
};
