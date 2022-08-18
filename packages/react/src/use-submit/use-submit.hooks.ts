import { useRef } from "react";
import {
  Command,
  getCommandKey,
  ExtractClientReturnType,
  commandSendRequest,
  CommandInstance,
  ClientResponseType,
  ExtractResponse,
  ExtractError,
  FetchType,
} from "@better-typed/hyper-fetch";
import { useDidMount } from "@better-typed/react-lifecycle-hooks";

import { useDebounce, useTrackedState, useCommandEvents } from "helpers";
import { UseSubmitOptionsType, useSubmitDefaultOptions, UseSubmitReturnType } from "use-submit";
import { useConfigProvider } from "config-provider";

/**
 * This hooks aims to mutate data on the server.
 * @param command
 * @param options
 * @returns
 */
export const useSubmit = <Command extends CommandInstance>(
  command: Command,
  options: UseSubmitOptionsType<Command> = useSubmitDefaultOptions,
): UseSubmitReturnType<Command> => {
  // Build the configuration options
  const [globalConfig] = useConfigProvider();
  const { disabled, dependencyTracking, initialData, debounce, debounceTime, deepCompare } = {
    ...useSubmitDefaultOptions,
    ...globalConfig.useSubmitConfig,
    ...options,
  };

  /**
   * Because of the dynamic cacheKey / queueKey signing within the command we need to store it's latest instance
   * so the events got triggered properly and show the latest result without mixing it up
   */
  const { builder } = command;
  const { cache, submitDispatcher: dispatcher, loggerManager } = builder;

  const logger = useRef(loggerManager.init("useSubmit")).current;
  const requestDebounce = useDebounce(debounceTime);
  const debounceResolve = useRef<(value: ClientResponseType<ExtractResponse<Command>, ExtractError<Command>>) => void>(
    () => null,
  );

  /**
   * State handler with optimization for rerendering, that hooks into the cache state and dispatchers queues
   */
  const [state, actions, { setRenderKey, setCacheData }] = useTrackedState<Command>({
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

  const handleSubmit = (...parameters: Parameters<Command["send"]>) => {
    const submitOptions = parameters[0] as FetchType<Command> | undefined;
    const commandClone = command.clone(submitOptions as any) as Command;

    if (disabled) {
      logger.warning(`Cannot submit request`, { disabled, submitOptions });
      throw new Error("Cannot submit request. Option 'disabled' is enabled");
    }

    const triggerRequest = () => {
      addDataListener(commandClone);
      return commandSendRequest(commandClone, {
        dispatcherType: "submit",
        ...submitOptions,
        onSettle: (requestId, cmd) => {
          addLifecycleListeners(commandClone, requestId);
          submitOptions?.onSettle?.(requestId, cmd);
        },
      });
    };

    return new Promise<ExtractClientReturnType<Command>>((resolve) => {
      const performSubmit = async () => {
        logger.debug(`Submitting request`, { disabled, submitOptions });
        if (debounce) {
          // We need to keep the resolve of debounced requests to prevent memory leaks
          debounceResolve.current = (value: ClientResponseType<ExtractResponse<Command>, ExtractError<Command>>) => {
            debounceResolve.current(value);
            resolve(value);
          };
          // Start debouncing
          requestDebounce.debounce(async () => {
            // Cleanup debounce resolve
            const callback = debounceResolve.current;
            debounceResolve.current = () => null;

            const value = await triggerRequest();
            callback(value);
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
      cache.revalidate(getCommandKey(invalidateKey));
    } else if (!(invalidateKey instanceof Command)) {
      cache.revalidate(invalidateKey);
    }
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

  // ******************
  // Lifecycle
  // ******************

  useDidMount(() => {
    addDataListener(command);
  });

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
    abort: callbacks.abort,
    ...actions,
    ...handlers,
    isDebouncing: requestDebounce.active,
    revalidate,
  };
};
