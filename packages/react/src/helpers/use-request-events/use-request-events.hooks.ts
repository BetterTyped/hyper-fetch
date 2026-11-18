import { useWillUnmount } from "@better-hooks/lifecycle";
import type {
  ExtractErrorType,
  ExtractResponseType,
  RequestInstance,
  RequestEventType,
  RequestLoadingEventType,
  ExtractAdapterType,
  RequestProgressEventType,
  RequestResponseEventType,
  ResponseType,
  OptimisticCallbackResult,
} from "@hyper-fetch/core";
import { scopeKey } from "@hyper-fetch/core";
import type {
  OnErrorCallbackType,
  OnStartCallbackType,
  OnSuccessCallbackType,
  OnProgressCallbackType,
  OnFinishedCallbackType,
  UseRequestEventsDataMap,
  UseRequestEventsReturnType,
  UseRequestEventsPropsType,
  UseRequestEventsLifecycleMap,
} from "helpers";
import { useRef } from "react";

/**
 * This is helper hook that handles main Hyper-Fetch event/data flow
 * @internal
 * @param options
 * @returns
 */
export const useRequestEvents = <R extends RequestInstance>({
  request,
  dispatcher,
  logger,
  actions,
  setCacheData,
  getIsDataProcessing,
}: UseRequestEventsPropsType<R>): UseRequestEventsReturnType<R> => {
  const { cache, requestManager } = request.client;

  // Always points to the request from the latest render - handlers created once can use it safely
  const requestRef = useRef(request);
  requestRef.current = request;
  const dispatcherRef = useRef(dispatcher);
  dispatcherRef.current = dispatcher;

  /**
   * Events are emitted with the plain request keys, so requests from other scopes land on the same event names.
   * Only the events of our scope can be handled.
   */
  const isSameScope = (req: R, scope: string | null | undefined) => {
    return (scope ?? null) === (req.scope ?? null);
  };

  // ******************
  // Callbacks
  // ******************

  const onSuccessCallback = useRef<null | OnSuccessCallbackType<R>>(null);
  const onErrorCallback = useRef<null | OnErrorCallbackType<R>>(null);
  const onAbortCallback = useRef<null | OnErrorCallbackType<R>>(null);
  const onOfflineErrorCallback = useRef<null | OnErrorCallbackType<R>>(null);
  const onFinishedCallback = useRef<null | OnFinishedCallbackType<R>>(null);
  const onRequestStartCallback = useRef<null | OnStartCallbackType<R>>(null);
  const onResponseStartCallback = useRef<null | OnStartCallbackType<R>>(null);
  const onDownloadProgressCallback = useRef<null | OnProgressCallbackType>(null);
  const onUploadProgressCallback = useRef<null | OnProgressCallbackType>(null);

  // ******************
  // Listeners unmounting
  // ******************

  const lifecycleEvents = useRef<UseRequestEventsLifecycleMap>(new Map());
  const dataEvents = useRef<UseRequestEventsDataMap | null>(null);

  const removeLifecycleListener = (requestId: string) => {
    const event = lifecycleEvents.current.get(requestId);
    event?.unmount();
    lifecycleEvents.current.delete(requestId);
  };

  const clearLifecycleListeners = () => {
    const events = lifecycleEvents.current;
    const listeners = [...events.values()];
    listeners.forEach((value) => {
      value.unmount();
    });
    events.clear();
  };

  // ******************
  // Optimistic state
  // ******************

  const optimisticResultsRef = useRef<Map<string, OptimisticCallbackResult<any>>>(new Map());

  // ******************
  // Response handlers
  // ******************

  const handleResponseCallbacks = (values: RequestResponseEventType<R>) => {
    const { success } = values.response;
    const { isOffline, isCanceled, willRetry } = values.details;
    const opt = optimisticResultsRef.current.get(values.requestId);
    const paramsWithContext = { ...values, mutationContext: opt?.context } as any;

    if (request.offline && isOffline && !success) {
      logger.debug({ title: "Performing offline error callback", type: "system", extra: values });
      onOfflineErrorCallback.current?.(paramsWithContext);
    } else if (isCanceled) {
      logger.debug({ title: "Performing abort callback", type: "system", extra: values });
      try {
        opt?.rollback?.();
      } catch {
        // rollback threw — onAbort still fires
      }
      onAbortCallback.current?.(paramsWithContext);
    } else if (success) {
      logger.debug({ title: "Performing success callback", type: "system", extra: values });
      if (opt?.invalidate) {
        opt.invalidate.forEach((req) => cache.invalidate(req));
      }
      onSuccessCallback.current?.(paramsWithContext);
    } else {
      logger.debug({ title: "Performing error callback", type: "system", extra: values });
      if (!willRetry) {
        try {
          opt?.rollback?.();
        } catch {
          // rollback threw — onError still fires
        }
      }
      onErrorCallback.current?.(paramsWithContext);
    }
    onFinishedCallback.current?.(paramsWithContext);
    if (!willRetry) {
      optimisticResultsRef.current.delete(values.requestId);
    }
  };

  // ******************
  // Lifecycle
  // ******************

  const handleGetLoadingEvent = (req: R) => {
    return ({ loading, request: eventRequest }: RequestLoadingEventType<RequestInstance>) => {
      if (!isSameScope(req, eventRequest?.scope)) {
        return;
      }

      const isProcessing = getIsDataProcessing(req.cacheKey);

      // When we process the cache data, we don't want to change the loading state during it
      // This prevents the UI from flickering with { data: null, loading: false }
      if (isProcessing) {
        return;
      }

      const canDisableLoading = !loading && !dispatcher.hasRunningRequests(scopeKey(req.queryKey, req.scope));
      if (loading || canDisableLoading) {
        actions.setLoading(loading);
      }
    };
  };

  const handleDownloadProgress = (req: R) => {
    return (data: RequestProgressEventType<RequestInstance>) => {
      if (!isSameScope(req, data.request?.scope)) {
        return;
      }
      onDownloadProgressCallback.current?.(data);
    };
  };

  const handleUploadProgress = (req: R) => {
    return (data: RequestProgressEventType<RequestInstance>) => {
      if (!isSameScope(req, data.request?.scope)) {
        return;
      }
      onUploadProgressCallback.current?.(data);
    };
  };

  const handleRequestStart = (req: R) => {
    return (details: RequestEventType<R>) => {
      if (!isSameScope(req, details.request?.scope)) {
        return;
      }
      onRequestStartCallback.current?.(details);
    };
  };
  const handleResponseStart = (req: R) => {
    return (details: RequestEventType<R>) => {
      if (!isSameScope(req, details.request?.scope)) {
        return;
      }
      onResponseStartCallback.current?.(details);
    };
  };

  const handleResponse = (req: R) => {
    return (values: RequestResponseEventType<R>) => {
      if (!isSameScope(req, values.request?.scope)) {
        return;
      }

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { unstable_responseMapper } = req;
      const data = unstable_responseMapper
        ? unstable_responseMapper(values.response as ResponseType<any, any, ExtractAdapterType<R>>)
        : values.response;

      if (data instanceof Promise) {
        return (async () => {
          handleResponseCallbacks({
            ...values,
            response: (await data) as ResponseType<any, any, ExtractAdapterType<R>>,
          });
        })();
      }
      // Callbacks receive the same (mapped) response as the hook state
      return handleResponseCallbacks({
        ...values,
        response: (data || values.response) as ResponseType<any, any, ExtractAdapterType<R>>,
      });
    };
  };

  const handleRemove = ({ requestId }: RequestEventType<R>) => {
    const opt = optimisticResultsRef.current.get(requestId);
    if (opt) {
      try {
        opt.rollback?.();
      } catch {
        // swallow — queue removal rollback failure
      }
      optimisticResultsRef.current.delete(requestId);
    }
    removeLifecycleListener(requestId);
  };

  // ******************
  // Data Listeners
  // ******************

  const clearCacheDataListener = () => {
    dataEvents.current?.unmount();
    dataEvents.current = null;
  };

  const addCacheDataListener = (req: R) => {
    // Data handlers
    const loadingUnmount = requestManager.events.onLoadingByQueue(req.queryKey, handleGetLoadingEvent(req));
    const getResponseUnmount = cache.events.onDataByKey<
      ExtractResponseType<R>,
      ExtractErrorType<R>,
      ExtractAdapterType<R>
    >(req.cacheKey, (cacheData) => {
      if (!isSameScope(req, cacheData.scope)) {
        return;
      }
      setCacheData(cacheData);
    });

    const unmount = () => {
      loadingUnmount();
      getResponseUnmount();
    };

    clearCacheDataListener();
    dataEvents.current = { unmount };

    return unmount;
  };

  // ******************
  // Lifecycle Listeners
  // ******************

  const addLifecycleListeners = (req: R, requestId?: string, optimisticResult?: OptimisticCallbackResult<any>) => {
    /**
     * useFetch handles requesting by general keys
     * This makes it possible to deduplicate requests from different places and share data
     */
    if (!requestId) {
      // It's important to clear previously attached listeners to not cause some additional response/request
      // events to be triggered during lifecycle
      clearLifecycleListeners();
      const { queryKey, cacheKey } = req;
      const requestStartUnmount = requestManager.events.onRequestStartByQueue(queryKey, handleRequestStart(req));
      const responseStartUnmount = requestManager.events.onResponseStartByQueue(queryKey, handleResponseStart(req));
      const uploadUnmount = requestManager.events.onUploadProgressByQueue(queryKey, handleUploadProgress(req));
      const downloadUnmount = requestManager.events.onDownloadProgressByQueue(queryKey, handleDownloadProgress(req));
      const responseUnmount = requestManager.events.onResponseByCache(cacheKey, handleResponse(req));

      const unmount = () => {
        downloadUnmount();
        uploadUnmount();
        requestStartUnmount();
        responseStartUnmount();
        responseUnmount();
      };

      lifecycleEvents.current.set(queryKey, { unmount });

      return unmount;
    }
    /**
     * useSubmit handles requesting by requestIds, this makes it possible to track single requests
     */
    if (optimisticResult) {
      optimisticResultsRef.current.set(requestId, optimisticResult);
    }
    const requestRemove = requestManager.events.onRemoveById(requestId, handleRemove);
    const requestStartUnmount = requestManager.events.onRequestStartById(requestId, handleRequestStart(req));
    const responseStartUnmount = requestManager.events.onResponseStartById(requestId, handleResponseStart(req));
    const responseUnmount = requestManager.events.onResponseById(requestId, handleResponse(req));
    const uploadUnmount = requestManager.events.onUploadProgressById(requestId, handleUploadProgress(req));
    const downloadUnmount = requestManager.events.onDownloadProgressById(requestId, handleDownloadProgress(req));

    const unmount = () => {
      requestRemove();
      downloadUnmount();
      uploadUnmount();
      requestStartUnmount();
      responseStartUnmount();
      responseUnmount();
    };

    lifecycleEvents.current.set(requestId, { unmount });

    return unmount;
  };

  // ******************
  // Abort
  // ******************

  const abort = () => {
    const currentRequest = requestRef.current;
    const currentDispatcher = dispatcherRef.current;
    const ak = scopeKey(currentRequest.abortKey, currentRequest.scope);
    const requests = currentDispatcher.getAllRunningRequests();
    requests.forEach((requestData) => {
      const reqAk = scopeKey(requestData.request.abortKey, requestData.request.scope);
      if (reqAk === ak) {
        const qk = scopeKey(requestData.request.queryKey, requestData.request.scope);
        currentDispatcher.delete(qk, requestData.requestId, reqAk);
      }
    });
  };

  // ******************
  // Lifecycle
  // ******************

  /**
   * On unmount we want to clear all the listeners to prevent memory leaks
   */
  useWillUnmount(() => {
    // Unmount listeners
    clearLifecycleListeners();
    clearCacheDataListener();
  });

  // Callbacks setters and abort work on refs only, so they are created once - their identity is stable between the renders
  const callbacksRef = useRef<UseRequestEventsReturnType<R>[0] | null>(null);
  if (!callbacksRef.current) {
    callbacksRef.current = {
      abort,
      onSuccess: (callback: OnSuccessCallbackType<R>) => {
        onSuccessCallback.current = callback;
      },
      onError: (callback: OnErrorCallbackType<R>) => {
        onErrorCallback.current = callback;
      },
      onAbort: (callback: OnErrorCallbackType<R>) => {
        onAbortCallback.current = callback;
      },
      onOfflineError: (callback: OnErrorCallbackType<R>) => {
        onOfflineErrorCallback.current = callback;
      },
      onFinished: (callback: OnFinishedCallbackType<R>) => {
        onFinishedCallback.current = callback;
      },
      onRequestStart: (callback: OnStartCallbackType<R>) => {
        onRequestStartCallback.current = callback;
      },
      onResponseStart: (callback: OnStartCallbackType<R>) => {
        onResponseStartCallback.current = callback;
      },
      onDownloadProgress: (callback: OnProgressCallbackType) => {
        onDownloadProgressCallback.current = callback;
      },
      onUploadProgress: (callback: OnProgressCallbackType) => {
        onUploadProgressCallback.current = callback;
      },
    };
  }

  return [
    callbacksRef.current,
    {
      addCacheDataListener,
      clearCacheDataListener,
      addLifecycleListeners,
      removeLifecycleListener,
      clearLifecycleListeners,
    },
  ];
};
