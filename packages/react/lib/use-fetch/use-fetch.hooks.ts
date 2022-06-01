import { useRef } from "react";
import { useDidUpdate, useDidMount } from "@better-typed/react-lifecycle-hooks";
import { FetchCommandInstance, FetchCommand, getCommandKey } from "@better-typed/hyper-fetch";

import { useDebounce, useCommand } from "hooks";
import { UseFetchOptionsType, useFetchDefaultOptions } from "use-fetch";

/**
 * This hooks aims to retrieve data from server.
 * @param command Command instance
 * @param options Hook options
 * @returns
 */
export const useFetch = <T extends FetchCommandInstance>(
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
  const { cache, fetchDispatcher, appManager, loggerManager } = builder;

  const logger = useRef(loggerManager.init("useFetch")).current;

  const [state, actions, { setRenderKey, getStaleStatus }] = useCommand({
    command,
    dispatcher: fetchDispatcher,
    dependencyTracking,
    initialData,
    logger,
    deepCompare,
  });

  // ******************
  // Fetching
  // ******************

  const handleFetch = () => {
    /**
     * We can fetch when data is not stale or we don't have data at all
     * The exception is made for refreshing which should be triggered no matter if data is fresh or not
     * That's because cache time gives the details if the INITIAL call should be made, refresh works without limits
     */
    if (!disabled) {
      logger.debug(`Adding request to fetch queue`);
      fetchDispatcher.add(command);
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
      const canRefreshBlurred = isBlurred && refreshBlurred;
      const isFetching = !!fetchDispatcher.getRunningRequests(command.queueKey).length;
      const isQueued = !!fetchDispatcher.getQueue(command.queueKey).requests.length;

      if (canRefreshBlurred || !isBlurred || !isFetching || !isQueued) {
        handleFetch();
        logger.debug(`Performing refresh request`);
      }

      // Start new refresh counter
      handleRefresh();
    });
  }

  const revalidate = (invalidateKey?: string | FetchCommandInstance | RegExp) => {
    if (invalidateKey && invalidateKey instanceof FetchCommand) {
      cache.events.revalidate(getCommandKey(invalidateKey, true));
    } else if (invalidateKey) {
      cache.events.revalidate(invalidateKey);
    } else {
      handleFetch();
    }
  };

  // ******************
  // Aborting
  // ******************

  const abort = () => {
    command.abort();
  };

  // ******************
  // Fetching lifecycle
  // ******************

  const initialFetchData = () => {
    const handleInitialFetch = async () => {
      const hasStaleData = await getStaleStatus();
      if (revalidateOnMount || hasStaleData) {
        handleFetch();
      }
    };
    handleInitialFetch();
  };

  const updateFetchData = () => {
    /**
     * While debouncing we need to make sure that first request is not debounced when the cache is not available
     * This way it will not wait for debouncing but fetch data right away
     */
    const isFirstRequest = fetchDispatcher.getQueueRequestCount(queueKey);
    if (!isFirstRequest && debounce) {
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
  useDidUpdate(updateFetchData, [updateKey, ...dependencies, disabled]);

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
    get isRefreshed() {
      setRenderKey("isRefreshed");
      return state.isRefreshed;
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
    isDebouncing: requestDebounce.active,
    revalidate,
    abort,
  };
};
