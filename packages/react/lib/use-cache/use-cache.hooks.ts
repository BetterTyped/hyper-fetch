import { useRef } from "react";
import { getCommandDispatcher, FetchCommandInstance, FetchCommand, getCommandKey } from "@better-typed/hyper-fetch";

import { useCommandEvents, useDependentState } from "helpers";
import { UseCacheOptionsType, useCacheDefaultOptions } from "use-cache";

export const useCache = <T extends FetchCommandInstance>(
  command: T,
  {
    dependencyTracking = useCacheDefaultOptions.dependencyTracking,
    initialData = useCacheDefaultOptions.initialData,
    deepCompare = useCacheDefaultOptions.deepCompare,
  }: UseCacheOptionsType<T> = useCacheDefaultOptions,
) => {
  const { cacheKey, builder } = command;

  const { cache, loggerManager } = builder;
  const logger = useRef(loggerManager.init("useCache")).current;

  const [dispatcher] = getCommandDispatcher(command);

  /**
   * State handler with optimization for rerendering, that hooks into the cache state and dispatchers queues
   */
  const [state, actions, { setRenderKey, setCacheData, isInitialized }] = useDependentState<T>({
    logger,
    command,
    dispatcher,
    initialData,
    dependencyTracking,
  });

  /**
   * Handles the data exchange with the core logic - responses, loading, downloading etc
   */
  const [callbacks] = useCommandEvents({
    state,
    logger,
    actions,
    command,
    dispatcher,
    deepCompare,
    setCacheData,
    cacheInitialized: isInitialized,
  });

  const revalidate = (revalidateKey?: string | FetchCommandInstance | RegExp) => {
    if (revalidateKey && revalidateKey instanceof FetchCommand) {
      cache.events.revalidate(`/${getCommandKey(revalidateKey, true)}/`);
    } else if (revalidateKey) {
      cache.events.revalidate(revalidateKey);
    } else {
      cache.events.revalidate(cacheKey);
    }
  };

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
    onCacheError: callbacks.onError,
    onCacheSuccess: callbacks.onSuccess,
    onCacheChange: callbacks.onFinished,
    ...actions,
    revalidate,
  };
};
