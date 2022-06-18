import { useRef, useState } from "react";
import {
  Command,
  getCommandKey,
  ExtractFetchReturn,
  commandSendRequest,
  CommandInstance,
} from "@better-typed/hyper-fetch";

import { useDebounce, useDependentState, useCommandEvents } from "helpers";
import { UseSubmitOptionsType, useSubmitDefaultOptions } from "use-submit";

/**
 * This hooks aims to mutate data on the server.
 * @param command
 * @param options
 * @returns
 */
export const useSubmit = <T extends CommandInstance>(
  commandInstance: T,
  {
    disabled = useSubmitDefaultOptions.disabled,
    dependencyTracking = useSubmitDefaultOptions.dependencyTracking,
    initialData = useSubmitDefaultOptions.initialData,
    debounce = useSubmitDefaultOptions.debounce,
    debounceTime = useSubmitDefaultOptions.debounceTime,
    deepCompare = useSubmitDefaultOptions.deepCompare,
  }: UseSubmitOptionsType<T> = useSubmitDefaultOptions,
) => {
  /**
   * Because of the dynamic cacheKey / queueKey signing within the command we need to store it's latest instance
   * so the events got triggered properly and show the latest result without mixing it up
   */
  const [command, setCommand] = useState(commandInstance);
  const { builder } = command;
  const { cache, submitDispatcher: dispatcher, loggerManager } = builder;

  const logger = useRef(loggerManager.init("useSubmit")).current;
  const requestDebounce = useDebounce(debounceTime);

  /**
   * State handler with optimization for rerendering, that hooks into the cache state and dispatchers queues
   */
  const [state, actions, { setRenderKey, setCacheData }] = useDependentState<T>({
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

  const { addDataListener, addLifecycleListeners } = listeners;

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

    const triggerRequest = () =>
      commandSendRequest(commandClone, "submit", (requestId, cmd) => {
        addDataListener(cmd);
        addLifecycleListeners(requestId);
      });

    return new Promise<ExtractFetchReturn<T> | [null, null, null]>((resolve) => {
      const performSubmit = async () => {
        logger.debug(`Adding request to submit queue`, { disabled, options });

        if (debounce) {
          requestDebounce.debounce(async () => {
            const value = await triggerRequest();
            resolve(value);
          });
        } else {
          const value = await triggerRequest();
          resolve(value);
        }
      };

      performSubmit();
    });
  };

  // ******************
  // Revalidation
  // ******************

  const revalidate = (invalidateKey: string | CommandInstance | RegExp) => {
    if (!invalidateKey) return;

    if (invalidateKey && invalidateKey instanceof Command) {
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
    onSubmitSuccess: callbacks.onSuccess,
    onSubmitError: callbacks.onError,
    onSubmitFinished: callbacks.onFinished,
    onSubmitRequestStart: callbacks.onRequestStart,
    onSubmitResponseStart: callbacks.onResponseStart,
    onSubmitDownloadProgress: callbacks.onDownloadProgress,
    onSubmitUploadProgress: callbacks.onUploadProgress,
    onSubmitOfflineError: callbacks.onOfflineError,
    onSubmitAbort: callbacks.onAbort,
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
    abort,
    ...actions,
    ...handlers,
    isDebouncing: false,
    isRefreshed: false,
    revalidate,
  };
};
