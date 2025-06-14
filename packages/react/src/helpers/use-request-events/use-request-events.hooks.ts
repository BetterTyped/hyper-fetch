import {
  ExtractErrorType,
  ExtractResponseType,
  RequestInstance,
  RequestEventType,
  RequestLoadingEventType,
  ExtractAdapterType,
  RequestProgressEventType,
  RequestResponseEventType,
} from "@hyper-fetch/core";
import { useWillUnmount } from "@better-hooks/lifecycle";
import { useRef } from "react";

import {
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
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { unstable_responseMapper } = request;
  const { cache, requestManager } = request.client;

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
    const listeners = Array.from(events.values());
    listeners.forEach((value) => {
      value.unmount();
    });
    events.clear();
  };

  // ******************
  // Response handlers
  // ******************

  const handleResponseCallbacks = (values: RequestResponseEventType<R>) => {
    const { success } = values.response;
    const { isOffline, isCanceled } = values.details;
    if (request.offline && isOffline && !success) {
      logger.debug({ title: "Performing offline error callback", type: "system", extra: values });
      onOfflineErrorCallback.current?.(values as any);
    } else if (isCanceled) {
      logger.debug({ title: "Performing abort callback", type: "system", extra: values });
      onAbortCallback.current?.(values as any);
    } else if (success) {
      logger.debug({ title: "Performing success callback", type: "system", extra: values });
      onSuccessCallback.current?.(values as any);
    } else {
      logger.debug({ title: "Performing error callback", type: "system", extra: values });
      onErrorCallback.current?.(values as any);
    }
    onFinishedCallback.current?.(values);
  };

  // ******************
  // Lifecycle
  // ******************

  const handleGetLoadingEvent = (req: R) => {
    return ({ loading }: RequestLoadingEventType<RequestInstance>) => {
      const isProcessing = getIsDataProcessing(req.cacheKey);

      // When we process the cache data, we don't want to change the loading state during it
      // This prevents the UI from flickering with { data: null, loading: false }
      if (isProcessing) return;

      const canDisableLoading = !loading && !dispatcher.hasRunningRequests(req.queryKey);
      if (loading || canDisableLoading) {
        actions.setLoading(loading);
      }
    };
  };

  const handleDownloadProgress = (data: RequestProgressEventType<RequestInstance>) => {
    onDownloadProgressCallback.current?.(data);
  };

  const handleUploadProgress = (data: RequestProgressEventType<RequestInstance>) => {
    onUploadProgressCallback.current?.(data);
  };

  const handleRequestStart = () => {
    return (details: RequestEventType<R>) => {
      onRequestStartCallback.current?.(details);
    };
  };
  const handleResponseStart = () => {
    return (details: RequestEventType<R>) => {
      onResponseStartCallback.current?.(details);
    };
  };

  const handleResponse = () => {
    return (values: RequestResponseEventType<R>) => {
      const data = unstable_responseMapper ? unstable_responseMapper(values.response) : values.response;

      if (data instanceof Promise) {
        return (async () => {
          handleResponseCallbacks({ ...values, response: await data });
        })();
      }
      return handleResponseCallbacks(values);
    };
  };

  const handleRemove = ({ requestId }: RequestEventType<R>) => {
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
    >(req.cacheKey, setCacheData);

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

  const addLifecycleListeners = (req: R, requestId?: string) => {
    /**
     * useFetch handles requesting by general keys
     * This makes it possible to deduplicate requests from different places and share data
     */
    if (!requestId) {
      // It's important to clear previously attached listeners to not cause some additional response/request
      // events to be triggered during lifecycle
      clearLifecycleListeners();
      const { queryKey, cacheKey } = req;
      const requestStartUnmount = requestManager.events.onRequestStartByQueue(queryKey, handleRequestStart());
      const responseStartUnmount = requestManager.events.onResponseStartByQueue(queryKey, handleResponseStart());
      const uploadUnmount = requestManager.events.onUploadProgressByQueue(queryKey, handleUploadProgress);
      const downloadUnmount = requestManager.events.onDownloadProgressByQueue(queryKey, handleDownloadProgress);
      const responseUnmount = requestManager.events.onResponseByCache(cacheKey, handleResponse());

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
    const requestRemove = requestManager.events.onRemoveById(requestId, handleRemove);
    const requestStartUnmount = requestManager.events.onRequestStartById(requestId, handleRequestStart());
    const responseStartUnmount = requestManager.events.onResponseStartById(requestId, handleResponseStart());
    const responseUnmount = requestManager.events.onResponseById(requestId, handleResponse());
    const uploadUnmount = requestManager.events.onUploadProgressById(requestId, handleUploadProgress);
    const downloadUnmount = requestManager.events.onDownloadProgressById(requestId, handleDownloadProgress);

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
    const { abortKey } = request;
    const requests = dispatcher.getAllRunningRequests();
    requests.forEach((requestData) => {
      if (requestData.request.abortKey === abortKey) {
        dispatcher.delete(requestData.request.queryKey, requestData.requestId, abortKey);
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

  return [
    {
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
    },
    {
      addCacheDataListener,
      clearCacheDataListener,
      addLifecycleListeners,
      removeLifecycleListener,
      clearLifecycleListeners,
    },
  ];
};
