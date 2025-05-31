import {
  ExtractAdapterResolvedType,
  RequestInstance,
  sendRequest,
  ResponseType,
  ExtractResponseType,
  ExtractErrorType,
  RequestSendOptionsType,
  RequestSendType,
  ExtractAdapterType,
} from "@hyper-fetch/core";
import { useDidMount } from "@better-hooks/lifecycle";
import { useDebounce, useThrottle } from "@better-hooks/performance";
import { useMemo, useRef } from "react";

import { UseSubmitOptionsType, useSubmitDefaultOptions, UseSubmitReturnType } from "hooks/use-submit";
import { useTrackedState, useRequestEvents } from "helpers";
import { useProvider } from "provider";
import { getBounceData } from "utils";

/**
 * This hooks aims to mutate data on the server.
 * @param request
 * @param options
 * @returns
 */
export const useSubmit = <RequestType extends RequestInstance>(
  request: RequestType,
  options?: UseSubmitOptionsType<RequestType>,
): UseSubmitReturnType<RequestType> => {
  // Build the configuration options
  const { config: globalConfig } = useProvider();
  const mergedOptions: UseSubmitOptionsType<RequestType> = useMemo(
    () => ({
      ...useSubmitDefaultOptions,
      ...globalConfig.useSubmitConfig,
      ...options,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [globalConfig.useSubmitConfig, JSON.stringify(options), options?.deepCompare],
  );
  const { disabled, dependencyTracking, initialResponse, bounce, bounceType, bounceTime, deepCompare } = mergedOptions;

  /**
   * Because of the dynamic cacheKey / queryKey signing within the request we need to store it's latest instance
   * so the events got triggered properly and show the latest result without mixing it up
   */
  const { client } = request;
  const { cache, submitDispatcher: dispatcher, loggerManager } = client;

  const logger = useRef(loggerManager.initialize(client, "useSubmit")).current;
  const requestDebounce = useDebounce({ delay: bounceTime });
  const requestThrottle = useThrottle({
    interval: bounceTime,
    timeout: "bounceTimeout" in mergedOptions ? mergedOptions.bounceTimeout : bounceTime,
  });
  const bounceResolver = useRef<
    (
      value: ResponseType<
        ExtractResponseType<RequestType>,
        ExtractErrorType<RequestType>,
        ExtractAdapterType<RequestType>
      >,
    ) => void
  >(() => null);

  const bounceData = bounceType === "throttle" ? requestThrottle : requestDebounce;
  const bounceFunction = bounceType === "throttle" ? requestThrottle.throttle : requestDebounce.debounce;

  /**
   * State handler with optimization for rerendering, that hooks into the cache state and dispatchers queues
   */
  const [state, actions, { setRenderKey, setCacheData, getIsDataProcessing }] = useTrackedState<RequestType>({
    logger,
    request,
    dispatcher,
    initialResponse,
    deepCompare: deepCompare as boolean,
    dependencyTracking: dependencyTracking as boolean,
  });

  /**
   * Handles the data exchange with the core logic - responses, loading, downloading etc
   */
  const [callbacks, listeners] = useRequestEvents({
    logger,
    actions,
    request,
    dispatcher,
    setCacheData,
    getIsDataProcessing,
  });

  const { addCacheDataListener, addLifecycleListeners } = listeners;

  // ******************
  // Submitting
  // ******************

  const handleSubmit: RequestSendType<RequestType> = (submitOptions?: RequestSendOptionsType<RequestType>) => {
    const requestClone = request.clone(submitOptions as any) as unknown as RequestType;

    if (disabled) {
      logger.warning({ title: `Cannot submit request`, type: "system", extra: { disabled, submitOptions } });
      return Promise.resolve({
        data: null,
        error: new Error("Cannot submit request. Option 'disabled' is enabled"),
        status: null,
        extra: request.client.adapter.defaultExtra,
      }) as Promise<
        ResponseType<ExtractResponseType<RequestType>, ExtractErrorType<RequestType>, ExtractAdapterType<RequestType>>
      >;
    }

    const triggerRequest = () => {
      addCacheDataListener(requestClone);

      const configuration: RequestSendOptionsType<RequestType> = {
        dispatcherType: "submit",
        ...(submitOptions as RequestSendOptionsType<RequestType>),
        onBeforeSent: (data) => {
          addLifecycleListeners(requestClone, data.requestId);
          submitOptions?.onBeforeSent?.(data);
        },
      };

      return sendRequest(requestClone, configuration);
    };

    return new Promise<ExtractAdapterResolvedType<RequestType>>((resolve) => {
      const performSubmit = async () => {
        logger.debug({ title: `Submitting request`, type: "system", extra: { disabled, submitOptions } });
        if (bounce) {
          const bouncedResolve = bounceResolver.current;
          // We need to keep the resolve of debounced requests to prevent memory leaks - we need to always resolve promise.
          // By default bounce method will prevent function to be triggered, but returned promise will still await to be resolved.
          // This way we can close previous promise, making sure our logic will not stuck in memory.
          bounceResolver.current = (
            value: ResponseType<
              ExtractResponseType<RequestType>,
              ExtractErrorType<RequestType>,
              ExtractAdapterType<RequestType>
            >,
          ) => {
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
  // Invalidation
  // ******************

  const refetch = () => {
    cache.invalidate(request);
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
    addCacheDataListener(request);
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
    get success() {
      setRenderKey("success");
      return state.success;
    },
    get extra() {
      setRenderKey("extra");
      return state.extra;
    },
    get retries() {
      setRenderKey("retries");
      return state.retries;
    },
    get responseTimestamp() {
      setRenderKey("responseTimestamp");
      return state.responseTimestamp;
    },
    get requestTimestamp() {
      setRenderKey("requestTimestamp");
      return state.requestTimestamp;
    },
    abort: callbacks.abort,
    ...actions,
    ...handlers,
    bounce: getBounceData(bounceData),
    refetch,
  };
};
