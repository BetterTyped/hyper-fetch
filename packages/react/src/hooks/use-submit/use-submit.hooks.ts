import { useForceUpdate } from "@better-hooks/lifecycle";
import { useDebounce, useThrottle } from "@better-hooks/performance";
import type {
  ExtractAdapterResolvedType,
  RequestInstance,
  ResponseType,
  ExtractResponseType,
  ExtractErrorType,
  RequestSendOptionsType,
  RequestSendType,
  ExtractAdapterType,
} from "@hyper-fetch/core";
import { runUserCode, sendRequest } from "@hyper-fetch/core";
import type { UseTrackedStateType } from "helpers";
import { useTrackedState, useRequestEvents } from "helpers";
import type { UseSubmitOptionsType, UseSubmitReturnType } from "hooks/use-submit";
import { useSubmitDefaultOptions } from "hooks/use-submit";
import { useProvider } from "provider";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { createTrackedProxy, getBounceData } from "utils";

/**
 * This hook aims to mutate data on the server. Unlike useFetch, it does not fire automatically -
 * call the returned `submit` function to trigger the request (e.g., on button click).
 * @param request
 * @param options
 * @returns
 */
export const useSubmit = <RequestType extends RequestInstance, TSelected = ExtractResponseType<RequestType>>(
  request: RequestType,
  options?: UseSubmitOptionsType<RequestType, TSelected>,
): UseSubmitReturnType<RequestType, TSelected> => {
  // Build the configuration options
  const { config: globalConfig } = useProvider();
  const mergedOptions: UseSubmitOptionsType<RequestType, TSelected> = useMemo(
    () => ({
      ...useSubmitDefaultOptions,
      ...globalConfig.useSubmitConfig,
      ...options,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [globalConfig.useSubmitConfig, JSON.stringify(options), options?.deepCompare],
  );
  const {
    disabled,
    dependencyTracking,
    initialResponse,
    bounce,
    bounceType,
    bounceTime,
    deepCompare,
    structuralSharing,
  } = mergedOptions;

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
  const forceUpdate = useForceUpdate();
  // Resolvers of the submit calls waiting for the bounced request
  const bounceResolver = useRef<
    | null
    | ((
        value: ResponseType<
          ExtractResponseType<RequestType>,
          ExtractErrorType<RequestType>,
          ExtractAdapterType<RequestType>
        >,
      ) => void)
  >(null);

  const bounceData = bounceType === "throttle" ? requestThrottle : requestDebounce;
  // Bounce state shown by this render
  const isBounceActive = bounceData.active;
  const bounceFunction = bounceType === "throttle" ? requestThrottle.throttle : requestDebounce.debounce;

  /**
   * State handler with optimization for rerendering, that hooks into the cache state and dispatchers queues
   */
  const [state, actions, { setRenderKey, setCacheData, getIsDataProcessing }] = useTrackedState<RequestType, TSelected>(
    {
      logger,
      request,
      dispatcher,
      initialResponse,
      deepCompare: deepCompare as boolean,
      dependencyTracking: dependencyTracking as boolean,
      // Read directly from options - functions are not part of the memoized options key
      select: options?.select,
      structuralSharing,
    },
  );

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

  const { addCacheDataListener, addLifecycleListeners, removeLifecycleListener } = listeners;

  // ******************
  // Submitting
  // ******************

  /**
   * Response for the submit calls which did not send any request. The submit promise never rejects,
   * so the reason is returned as an error response.
   */
  const getNotSentResponse = (message: string) => {
    const timestamp = Date.now();
    return {
      data: null,
      error: new Error(message),
      status: null,
      success: false,
      extra: request.client.adapter.defaultExtra,
      requestTimestamp: timestamp,
      responseTimestamp: timestamp,
    } as ResponseType<ExtractResponseType<RequestType>, ExtractErrorType<RequestType>, ExtractAdapterType<RequestType>>;
  };

  /**
   * Bounced submit calls wait for the request to be triggered. When it will not happen anymore (bounce got reset,
   * call got dropped or the hook unmounted) we have to resolve them - the submit promise can never stay pending.
   */
  const resolveBouncedCalls = (message: string) => {
    const resolvePending = bounceResolver.current;
    bounceResolver.current = null;
    resolvePending?.(getNotSentResponse(message));
  };

  const handleSubmit: RequestSendType<RequestType> = (submitOptions?: RequestSendOptionsType<RequestType>) => {
    if (disabled) {
      logger.warning({ title: `Cannot submit request`, type: "system", extra: { disabled, submitOptions } });
      return Promise.resolve(getNotSentResponse("Cannot submit request. Option 'disabled' is enabled"));
    }

    const { optimistic: submitOptimistic, ...cloneOptions } = submitOptions || {};
    const requestClone = request.clone(cloneOptions as any) as unknown as RequestType;
    // Read directly from options - functions are not part of the memoized options key
    const optimistic = submitOptimistic ?? options?.optimistic;

    const triggerRequest = () => {
      addCacheDataListener(requestClone);

      const configuration: RequestSendOptionsType<RequestType> = {
        dispatcherType: "submit",
        ...(submitOptions as RequestSendOptionsType<RequestType>),
        optimistic,
        onBeforeSent: (data) => {
          // Deduplicated submit joins the request which is already in flight and shares its id.
          // We keep a single set of listeners for it, so the callbacks fire once per response.
          removeLifecycleListener(data.requestId);
          addLifecycleListeners(requestClone, data.requestId, data.mutationContext);
          submitOptions?.onBeforeSent?.(data);
        },
        onResponse: (data) => {
          // This is the final response (retries and waiting for the network are over) and our listeners already
          // handled it. Dispatcher does not announce the removal of every request (e.g. the canceled ones),
          // so we release the listeners here to not leak them.
          removeLifecycleListener(data.requestId);
          submitOptions?.onResponse?.(data);
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
            bouncedResolve?.(value);
            resolve(value);
          };

          let isTriggered = false;

          // Start bounce
          bounceFunction(async () => {
            isTriggered = true;
            // We will always resolve previous calls as we stack the callbacks together until bounce function trigger
            const callback = bounceResolver.current;
            // Clean bounce resolvers to start the new stack
            bounceResolver.current = null;

            const value = await triggerRequest();
            callback?.(value);
          });

          // Throttle without the trailing timeout drops the calls made during the interval - nothing will trigger them
          if (!isTriggered && !bounceData.active) {
            resolveBouncedCalls("Request was not sent. Submit call got dropped by the throttle");
          }

          // Throttle does not notify about the call it holds, so the returned bounce state would stay outdated
          if (bounceData.active !== isBounceActive) {
            forceUpdate();
          }
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

  const handleRefetch = () => {
    cache.invalidate(request);
  };

  // ******************
  // Stable methods
  // ******************

  // The returned methods keep their identity between renders (safe to use in the dependency arrays)
  // and always work with the request and options from the latest render
  const latest = useRef({ handleSubmit, handleRefetch, resolveBouncedCalls });
  latest.current = { handleSubmit, handleRefetch, resolveBouncedCalls };

  const submit = useCallback(
    ((submitOptions?: RequestSendOptionsType<RequestType>) =>
      (latest.current.handleSubmit as (options?: RequestSendOptionsType<RequestType>) => unknown)(
        submitOptions,
      )) as unknown as RequestSendType<RequestType>,
    [],
  );

  const refetch = useCallback(() => latest.current.handleRefetch(), []);

  // ******************
  // Bounce
  // ******************

  const resetBounce = () => {
    const wasActive = bounceData.active;
    bounceData.reset();
    resolveBouncedCalls("Request was not sent. Bounce got reset before triggering the request");
    // Reset does not notify about the change on its own
    if (wasActive) {
      forceUpdate();
    }
  };

  // ******************
  // Misc
  // ******************

  const handlers = useMemo(() => {
    /**
     * Callbacks run inside of the request lifecycle. Error thrown by one of them would break it - the request
     * would never finish and it would block the queue. Such error is thrown outside of the lifecycle instead,
     * the same way as the errors of every other callback, listener and plugin.
     */
    const protect = <Args extends unknown[]>(callback: (...args: Args) => void | Promise<void>) => {
      return (...args: Args): void => {
        runUserCode(() => {
          callback(...args);
        });
      };
    };

    return {
      onSubmitSuccess: (callback: Parameters<typeof callbacks.onSuccess>[0]) => callbacks.onSuccess(protect(callback)),
      onSubmitError: (callback: Parameters<typeof callbacks.onError>[0]) => callbacks.onError(protect(callback)),
      onSubmitFinished: (callback: Parameters<typeof callbacks.onFinished>[0]) =>
        callbacks.onFinished(protect(callback)),
      onSubmitRequestStart: (callback: Parameters<typeof callbacks.onRequestStart>[0]) =>
        callbacks.onRequestStart(protect(callback)),
      onSubmitResponseStart: (callback: Parameters<typeof callbacks.onResponseStart>[0]) =>
        callbacks.onResponseStart(protect(callback)),
      onSubmitDownloadProgress: (callback: Parameters<typeof callbacks.onDownloadProgress>[0]) =>
        callbacks.onDownloadProgress(protect(callback) as typeof callback),
      onSubmitUploadProgress: (callback: Parameters<typeof callbacks.onUploadProgress>[0]) =>
        callbacks.onUploadProgress(protect(callback) as typeof callback),
      onSubmitOfflineError: (callback: Parameters<typeof callbacks.onOfflineError>[0]) =>
        callbacks.onOfflineError(protect(callback)),
      onSubmitAbort: (callback: Parameters<typeof callbacks.onAbort>[0]) => callbacks.onAbort(protect(callback)),
      onSubmitRetry: (callback: Parameters<typeof callbacks.onRetry>[0]) => callbacks.onRetry(protect(callback)),
    };
  }, [callbacks]);

  // ******************
  // Lifecycle
  // ******************

  // Plain effect on purpose - StrictMode runs mount, cleanup and mount again,
  // so a mount-once guard would leave the hook without the cache subscription.
  // When the request changes, we follow the data of the new one.
  useEffect(() => {
    addCacheDataListener(request);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.cacheKey, request.queryKey, request.scope]);

  // Bounce timers get cleared on unmount, so the waiting submit calls would never get resolved
  useEffect(() => {
    return () => {
      latest.current.resolveBouncedCalls("Request was not sent. Hook got unmounted before triggering the request");
    };
  }, []);

  const setSubmitRenderKey = (key: string) => {
    setRenderKey((key === "submitting" ? "loading" : key) as keyof UseTrackedStateType);
  };

  const trackedKeys = [
    "data",
    "error",
    "submitting",
    "status",
    "success",
    "extra",
    "retries",
    "responseTimestamp",
    "requestTimestamp",
  ] as const;

  return createTrackedProxy(
    {
      submit,
      data: state.data,
      error: state.error,
      submitting: state.loading,
      status: state.status,
      success: state.success,
      extra: state.extra,
      retries: state.retries,
      responseTimestamp: state.responseTimestamp,
      requestTimestamp: state.requestTimestamp,
      abort: callbacks.abort,
      ...actions,
      ...handlers,
      bounce: { ...getBounceData(bounceData), reset: resetBounce },
      refetch,
    },
    trackedKeys,
    setSubmitRenderKey,
  ) as UseSubmitReturnType<RequestType, TSelected>;
};
