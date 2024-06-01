import { useRef } from "react";
import {
  ExtractErrorType,
  ExtractResponseType,
  RequestInstance,
  ProgressType,
  ResponseType,
  RequestEventType,
  ResponseDetailsType,
  RequestLoadingEventType,
  ExtractAdapterType,
} from "@hyper-fetch/core";
import { useWillUnmount } from "@better-hooks/lifecycle";

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
export const useRequestEvents = <T extends RequestInstance>({
  request,
  dispatcher,
  logger,
  actions,
  setCacheData,
}: UseRequestEventsPropsType<T>): UseRequestEventsReturnType<T> => {
  const { responseMapper } = request;
  const { cache, requestManager } = request.client;

  // ******************
  // Callbacks
  // ******************

  const onSuccessCallback = useRef<null | OnSuccessCallbackType<T>>(null);
  const onErrorCallback = useRef<null | OnErrorCallbackType<T>>(null);
  const onAbortCallback = useRef<null | OnErrorCallbackType<T>>(null);
  const onOfflineErrorCallback = useRef<null | OnErrorCallbackType<T>>(null);
  const onFinishedCallback = useRef<null | OnFinishedCallbackType<T>>(null);
  const onRequestStartCallback = useRef<null | OnStartCallbackType<T>>(null);
  const onResponseStartCallback = useRef<null | OnStartCallbackType<T>>(null);
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

  const handleResponseCallbacks = (
    cmd: T,
    response: ResponseType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>,
    details: ResponseDetailsType,
  ) => {
    const { data, error, success } = response;
    const { isOffline, isCanceled } = details;
    if (request.offline && isOffline && !success) {
      logger.debug("Performing offline error callback", { data, details });
      onOfflineErrorCallback.current?.({ response: error, request: cmd, details });
    } else if (isCanceled) {
      logger.debug("Performing abort callback", { data, details });
      onAbortCallback.current?.({ response: error, request: cmd, details });
    } else if (success) {
      logger.debug("Performing success callback", { data, details });
      onSuccessCallback.current?.({ response: data, request: cmd, details });
    } else {
      logger.debug("Performing error callback", { data, details });
      onErrorCallback.current?.({ response: error, request: cmd, details });
    }
    onFinishedCallback.current?.({ response, request: cmd, details });
  };

  // ******************
  // Lifecycle
  // ******************

  const handleGetLoadingEvent = (queueKey: string) => {
    return ({ loading }: RequestLoadingEventType) => {
      const canDisableLoading = !loading && !dispatcher.hasRunningRequests(queueKey);
      if (loading || canDisableLoading) {
        actions.setLoading(loading, false);
      }
    };
  };

  const handleDownloadProgress = (progress: ProgressType, details: RequestEventType<T>) => {
    onDownloadProgressCallback.current?.(progress, details);
  };

  const handleUploadProgress = (progress: ProgressType, details: RequestEventType<T>) => {
    onUploadProgressCallback.current?.(progress, details);
  };

  const handleRequestStart = (cmd: T) => {
    return (details: RequestEventType<T>) => {
      onRequestStartCallback.current?.({ request: cmd, details });
    };
  };
  const handleResponseStart = (cmd: T) => {
    return (details: RequestEventType<T>) => {
      onResponseStartCallback.current?.({ request: cmd, details });
    };
  };

  const handleResponse = (req: T) => {
    return (
      response: ResponseType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>,
      details: ResponseDetailsType,
    ) => {
      const data = responseMapper ? responseMapper(response) : response;

      if (data instanceof Promise) {
        return (async () => {
          const promiseData = await data;
          handleResponseCallbacks(req, promiseData, details);
        })();
      }
      return handleResponseCallbacks(req, data, details);
    };
  };

  const handleRemove = ({ requestId }: RequestEventType<T>) => {
    removeLifecycleListener(requestId);
  };

  // ******************
  // Data Listeners
  // ******************

  const clearDataListener = () => {
    dataEvents.current?.unmount();
    dataEvents.current = null;
  };

  const addDataListener = (req: T) => {
    // Data handlers
    const loadingUnmount = requestManager.events.onLoading(req.queueKey, handleGetLoadingEvent(req.queueKey));
    const getResponseUnmount = cache.events.onData<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>(
      req.cacheKey,
      setCacheData,
    );

    const unmount = () => {
      loadingUnmount();
      getResponseUnmount();
    };

    clearDataListener();
    dataEvents.current = { unmount };

    return unmount;
  };

  // ******************
  // Lifecycle Listeners
  // ******************

  const addLifecycleListeners = (req: T, requestId?: string) => {
    /**
     * useFetch handles requesting by general keys
     * This makes it possible to deduplicate requests from different places and share data
     */
    if (!requestId) {
      // It's important to clear previously attached listeners to not cause some additional response/request
      // events to be triggered during lifecycle
      clearLifecycleListeners();
      const { queueKey, cacheKey } = req;
      const requestStartUnmount = requestManager.events.onRequestStart(queueKey, handleRequestStart(req));
      const responseStartUnmount = requestManager.events.onResponseStart(queueKey, handleResponseStart(req));
      const uploadUnmount = requestManager.events.onUploadProgress(queueKey, handleUploadProgress);
      const downloadUnmount = requestManager.events.onDownloadProgress(queueKey, handleDownloadProgress);
      const responseUnmount = requestManager.events.onResponse(cacheKey, handleResponse(req));

      const unmount = () => {
        downloadUnmount();
        uploadUnmount();
        requestStartUnmount();
        responseStartUnmount();
        responseUnmount();
      };

      lifecycleEvents.current.set(queueKey, { unmount });

      return unmount;
    }
    /**
     * useSubmit handles requesting by requestIds, this makes it possible to track single requests
     */
    const requestRemove = requestManager.events.onRemoveById(requestId, handleRemove);
    const requestStartUnmount = requestManager.events.onRequestStartById(requestId, handleRequestStart(req));
    const responseStartUnmount = requestManager.events.onResponseStartById(requestId, handleResponseStart(req));
    const responseUnmount = requestManager.events.onResponseById(requestId, handleResponse(req));
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
    const requests = dispatcher.getAllRunningRequest();
    requests.forEach((requestData) => {
      if (requestData.request.abortKey === abortKey) {
        dispatcher.delete(requestData.request.queueKey, requestData.requestId, abortKey);
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
    clearDataListener();
  });

  return [
    {
      abort,
      onSuccess: (callback: OnSuccessCallbackType<T>) => {
        onSuccessCallback.current = callback;
      },
      onError: (callback: OnErrorCallbackType<T>) => {
        onErrorCallback.current = callback;
      },
      onAbort: (callback: OnErrorCallbackType<T>) => {
        onAbortCallback.current = callback;
      },
      onOfflineError: (callback: OnErrorCallbackType<T>) => {
        onOfflineErrorCallback.current = callback;
      },
      onFinished: (callback: OnFinishedCallbackType<T>) => {
        onFinishedCallback.current = callback;
      },
      onRequestStart: (callback: OnStartCallbackType<T>) => {
        onRequestStartCallback.current = callback;
      },
      onResponseStart: (callback: OnStartCallbackType<T>) => {
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
      addDataListener,
      clearDataListener,
      addLifecycleListeners,
      removeLifecycleListener,
      clearLifecycleListeners,
    },
  ];
};
