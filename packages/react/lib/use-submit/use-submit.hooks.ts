import { useRef, useState } from "react";
import {
  FetchCommandInstance,
  getCommandKey,
  FetchCommand,
  ExtractFetchReturn,
  commandSendRequest,
} from "@better-typed/hyper-fetch";

import { isStaleCacheData } from "utils";
import { useDebounce, useCommand } from "hooks";
import { UseSubmitOptionsType, UseSubmitReturnType, useSubmitDefaultOptions } from "use-submit";

export const useSubmit = <T extends FetchCommandInstance>(
  commandInstance: T,
  {
    disabled = useSubmitDefaultOptions.disabled,
    dependencyTracking = useSubmitDefaultOptions.dependencyTracking,
    initialData = useSubmitDefaultOptions.initialData,
    debounce = useSubmitDefaultOptions.debounce,
    debounceTime = useSubmitDefaultOptions.debounceTime,
    deepCompare = useSubmitDefaultOptions.deepCompare,
  }: UseSubmitOptionsType<T> = useSubmitDefaultOptions,
): UseSubmitReturnType<T> => {
  /**
   * Because of the dynamic cacheKey / queueKey signing within the command we need to store it's latest instance
   * so the events got triggered properly and show the latest result without mixing it up
   */
  const [command, setCommand] = useState(commandInstance);
  const { cacheTime, builder } = command;
  const { cache, submitDispatcher, loggerManager } = builder;

  const logger = useRef(loggerManager.init("useSubmit")).current;
  const requestDebounce = useDebounce(debounceTime);
  const [state, actions, { setRenderKey, addRequestListener }] = useCommand({
    command,
    dispatcher: submitDispatcher,
    dependencyTracking,
    initialData,
    logger,
    deepCompare,
  });

  // ******************
  // Submitting
  // ******************

  const handleSubmit = (...parameters: Parameters<T["send"]>) => {
    const options = parameters[0];
    const commandClone = command.clone(options) as T;

    setCommand(commandClone);
    if (disabled) {
      logger.debug(`Cannot add to submit queue`, { disabled, options });
      return [null, null, 0];
    }

    const trigger = () => commandSendRequest(commandClone, "submit", addRequestListener);

    return new Promise<ExtractFetchReturn<T> | [null, null, null]>((resolve) => {
      const performSubmit = async () => {
        logger.debug(`Adding request to submit queue`, { disabled, options });

        if (debounce) {
          requestDebounce.debounce(async () => {
            const value = await trigger();
            resolve(value);
          });
        } else {
          const value = await trigger();
          resolve(value);
        }
      };

      performSubmit();
    });
  };

  // ******************
  // Revalidation
  // ******************

  const revalidate = (invalidateKey: string | FetchCommandInstance | RegExp) => {
    if (!invalidateKey) return;

    if (invalidateKey && invalidateKey instanceof FetchCommand) {
      cache.events.revalidate(`/${getCommandKey(invalidateKey, true)}/`);
    } else {
      cache.events.revalidate(invalidateKey);
    }
  };

  // ******************
  // Abort
  // ******************

  const abort = () => {
    command.abort();
  };

  // ******************
  // Misc
  // ******************

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
    onSubmitOfflineError: actions.onOfflineError,
    onSubmitAbort: actions.onAbort,
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
    abort,
    ...handlers,
    isDebouncing: false,
    isRefreshed: false,
    revalidate,
  };
};
