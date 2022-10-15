import { useMemo, useRef } from "react";
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
} from "@hyper-fetch/core";
import { useDidMount } from "@better-typed/react-lifecycle-hooks";
import { useDebounce, useThrottle } from "@better-typed/react-performance-hooks";

import { UseSubmitOptionsType, useSubmitDefaultOptions, UseSubmitReturnType } from "hooks/use-submit";
import { useTrackedState, useCommandEvents } from "helpers";
import { useConfigProvider } from "config-provider";
import { getBounceData } from "utils";
import { InvalidationKeyType } from "types";

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
  const val = useMemo(
    () => ({
      ...useSubmitDefaultOptions,
      ...globalConfig.useSubmitConfig,
      ...options,
    }),
    [JSON.stringify(globalConfig.useSubmitConfig), JSON.stringify(options)],
  );
  const { disabled, dependencyTracking, initialData, bounce, bounceType, bounceTime, deepCompare } = val;

  /**
   * Because of the dynamic cacheKey / queueKey signing within the command we need to store it's latest instance
   * so the events got triggered properly and show the latest result without mixing it up
   */
  const { builder } = command;
  const { cache, submitDispatcher: dispatcher, loggerManager } = builder;

  const logger = useRef(loggerManager.init("useSubmit")).current;
  const requestDebounce = useDebounce(bounceTime);
  const requestThrottle = useThrottle(bounceTime);
  const bounceResolver = useRef<(value: ClientResponseType<ExtractResponse<Command>, ExtractError<Command>>) => void>(
    () => null,
  );

  const bounceData = bounceType === "throttle" ? requestThrottle : requestDebounce;
  const bounceFunction = bounceType === "throttle" ? requestThrottle.throttle : requestDebounce.debounce;

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
        if (bounce) {
          const bouncedResolve = bounceResolver.current;
          // We need to keep the resolve of debounced requests to prevent memory leaks - we need to always resolve promise.
          // By default bounce method will prevent function to be triggered, but returned promise will still await to be resolved.
          // This way we can close previous promise, making sure our logic will not stuck in memory.
          bounceResolver.current = (value: ClientResponseType<ExtractResponse<Command>, ExtractError<Command>>) => {
            // Trigger previous awaiting calls to resolve together in bounced batches
            bouncedResolve(value);
            resolve(value);
          };

          // Start bounce
          bounceFunction(async () => {
            // We will always resolve previous calls as we stack the callbacks together until bounce function trigger
            const callback = bounceResolver.current;
            // Clean bounce resolvers to start the new stack
            bounceResolver.current = () => null;

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

  const handleRevalidation = (invalidateKey: InvalidationKeyType) => {
    if (invalidateKey && invalidateKey instanceof Command) {
      cache.revalidate(getCommandKey(invalidateKey));
    } else if (invalidateKey && !(invalidateKey instanceof Command)) {
      cache.revalidate(invalidateKey);
    }
  };

  const revalidate = (invalidateKey: InvalidationKeyType | InvalidationKeyType[]) => {
    if (!invalidateKey) return;

    if (invalidateKey && Array.isArray(invalidateKey)) {
      invalidateKey.forEach(handleRevalidation);
    } else if (invalidateKey && !Array.isArray(invalidateKey)) {
      handleRevalidation(invalidateKey);
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
    bounce: getBounceData(bounceData),
    revalidate,
  };
};
