import { useRef } from "react";
import { FetchCommandInstance, FetchCommand, getCommandKey } from "@better-typed/hyper-fetch";

import { useCommand } from "helpers";
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

  const { cache, fetchDispatcher, loggerManager } = builder;
  const logger = useRef(loggerManager.init("useCache")).current;
  const [state, actions, { setRenderKey }] = useCommand({
    command,
    dispatcher: fetchDispatcher,
    dependencyTracking,
    initialData,
    logger,
    deepCompare,
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
    onCacheError: actions.onError,
    onCacheSuccess: actions.onSuccess,
    onCacheChange: actions.onFinished,
    ...actions,
    revalidate,
  };
};
