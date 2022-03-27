import { useRef } from "react";

import { FetchCommandInstance, FetchCommand, getCommandKey } from "@better-typed/hyper-fetch";

import { isStaleCacheData } from "utils";
import { UseCacheOptionsType, UseCacheReturnType, useCacheDefaultOptions } from "use-cache";
import { useCommandState } from "utils/use-command-state";

export const useCache = <T extends FetchCommandInstance>(
  command: T,
  {
    dependencyTracking = useCacheDefaultOptions.dependencyTracking,
    initialData = useCacheDefaultOptions.initialData,
    deepCompare = useCacheDefaultOptions.deepCompare,
  }: UseCacheOptionsType<T> = useCacheDefaultOptions,
): UseCacheReturnType<T> => {
  const { cacheTime, cacheKey, builder } = command;

  const { cache, fetchQueue, loggerManager } = builder;
  const logger = useRef(loggerManager.init("useCache")).current;
  const [state, actions, { setRenderKey }] = useCommandState({
    command,
    queue: fetchQueue,
    dependencyTracking,
    initialData,
    logger,
    deepCompare,
    commandListeners: [],
    removeCommandListener: () => undefined,
  });

  const invalidate = (invalidateKey?: string | FetchCommandInstance | RegExp) => {
    if (invalidateKey && invalidateKey instanceof FetchCommand) {
      cache.events.revalidate(`/${getCommandKey(invalidateKey, true)}/`);
    } else if (invalidateKey) {
      cache.events.revalidate(invalidateKey);
    } else {
      cache.events.revalidate(cacheKey);
    }
  };

  const handlers = {
    actions: actions.actions,
    onCacheError: actions.onError,
    onCacheSuccess: actions.onSuccess,
    onCacheChange: actions.onFinished,
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
    get isOnline() {
      setRenderKey("isOnline");
      return state.isOnline;
    },
    get isFocused() {
      setRenderKey("isFocused");
      return state.isFocused;
    },
    get isRefreshingError() {
      setRenderKey("error");
      setRenderKey("isRefreshed");
      return !!state.error && state.isRefreshed;
    },
    get isStale() {
      setRenderKey("timestamp");
      return isStaleCacheData(cacheTime, state.timestamp);
    },
    ...handlers,
    invalidate,
  };
};
