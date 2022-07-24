import { useRef } from "react";
import { getCommandDispatcher, CommandInstance, Command, getCommandKey } from "@better-typed/hyper-fetch";

import { useCommandEvents, useTrackedState } from "helpers";
import { UseCacheOptionsType, useCacheDefaultOptions, UseCacheReturnType } from "use-cache";
import { useConfigProvider } from "config-provider";

export const useCache = <T extends CommandInstance>(
  command: T,
  options: UseCacheOptionsType<T> = useCacheDefaultOptions,
): UseCacheReturnType<T> => {
  const { cacheKey, builder } = command;

  const { cache, loggerManager } = builder;
  const logger = useRef(loggerManager.init("useCache")).current;
  const [dispatcher] = getCommandDispatcher(command);

  // Build the configuration options
  const [globalConfig] = useConfigProvider();
  const { dependencyTracking, initialData, deepCompare } = {
    ...useCacheDefaultOptions,
    ...globalConfig.useCacheConfig,
    ...options,
  };

  /**
   * State handler with optimization for rerendering, that hooks into the cache state and dispatchers queues
   */
  const [state, actions, { setRenderKey, setCacheData }] = useTrackedState<T>({
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
  const [callbacks] = useCommandEvents({
    logger,
    actions,
    command,
    dispatcher,
    setCacheData,
  });

  const revalidate = (invalidateKey?: string | CommandInstance | RegExp) => {
    if (invalidateKey instanceof Command) {
      cache.revalidate(getCommandKey(invalidateKey, true));
    } else if (invalidateKey) {
      cache.revalidate(invalidateKey);
    } else {
      cache.revalidate(cacheKey);
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
