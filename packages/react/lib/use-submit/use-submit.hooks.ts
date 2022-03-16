import { useRef, useState } from "react";
import { FetchCommandInstance, getCommandKey, FetchCommand, ExtractFetchReturn } from "@better-typed/hyper-fetch";

import { isStaleCacheData } from "utils";
import { useDebounce } from "utils/use-debounce";
import { UseSubmitOptionsType, UseSubmitReturnType, useSubmitDefaultOptions } from "use-submit";
import { useCommandState } from "utils/use-command-state";

export const useSubmit = <T extends FetchCommandInstance>(
  cmd: T,
  {
    disabled = useSubmitDefaultOptions.disabled,
    dependencyTracking = useSubmitDefaultOptions.dependencyTracking,
    initialData = useSubmitDefaultOptions.initialData,
    debounce = useSubmitDefaultOptions.debounce,
    debounceTime = useSubmitDefaultOptions.debounceTime,
    deepCompare = useSubmitDefaultOptions.deepCompare,
  }: // suspense = useSubmitDefaultOptions.suspense,
  UseSubmitOptionsType<T> = useSubmitDefaultOptions,
): UseSubmitReturnType<T> => {
  /**
   * Because of the dynamic cacheKey / queueKey signing within the command we need to store it's actual value
   * and assign the command to the state once we trigger submit because this is ultimate moment when it's automated value is assigned
   */
  const [command, setCommand] = useState(cmd);

  const { cacheTime, builder } = command;
  const requestDebounce = useDebounce(debounceTime);
  const { cache, submitQueue, loggerManager } = builder;
  const logger = useRef(loggerManager.init("useSubmit")).current;
  const [state, actions, { setRenderKey }] = useCommandState({
    command,
    queue: submitQueue,
    dependencyTracking,
    initialData,
    logger,
    deepCompare,
  });

  const handleSubmit = (...parameters: Parameters<T["send"]>) => {
    const options = parameters[0];

    const commandClone = command.clone(options);

    return new Promise<ExtractFetchReturn<T> | [null, null, null]>((resolve) => {
      setCommand(commandClone as T);

      const performSubmit = async () => {
        if (!disabled) {
          logger.debug(`Adding request to submit queue`, { disabled, options });

          if (debounce) {
            requestDebounce.debounce(async () => {
              const value = await commandClone.send({ ...options, queueType: "submit" });
              resolve(value);
            });
          } else {
            const value = await commandClone.send({ ...options, queueType: "submit" });
            resolve(value);
          }
        } else {
          resolve([null, null, null]);
          logger.debug(`Cannot add to submit queue`, { disabled, options });
        }
      };

      performSubmit();
    });
  };

  const invalidate = (invalidateKey: string | FetchCommandInstance | RegExp) => {
    if (!invalidateKey) return;

    if (invalidateKey && invalidateKey instanceof FetchCommand) {
      cache.events.revalidate(`/${getCommandKey(invalidateKey, true)}/`);
    } else {
      cache.events.revalidate(invalidateKey);
    }
  };

  const handlers = {
    actions: actions.actions,
    onSubmitRequest: actions.onRequest,
    onSubmitSuccess: actions.onSuccess,
    onSubmitError: actions.onError,
    onSubmitFinished: actions.onFinished,
    onSubmitRequestStart: actions.onRequestStart,
    onSubmitResponseStart: actions.onResponseStart,
    onSubmitDownloadProgress: actions.onDownloadProgress,
    onSubmitUploadProgress: actions.onUploadProgress,
  };

  return {
    submit: handleSubmit,
    get data() {
      setRenderKey("data");
      return state.data;
    },
    get error() {
      setRenderKey("error");
      return state.error;
    },
    get submitting() {
      setRenderKey("loading");
      return state.loading;
    },
    get status() {
      setRenderKey("status");
      return state.status;
    },
    get retryError() {
      setRenderKey("retryError");
      return state.retryError;
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
    get isStale() {
      return isStaleCacheData(cacheTime, state.timestamp);
    },
    ...handlers,
    isDebouncing: false,
    isRefreshed: false,
    invalidate,
  };
};
