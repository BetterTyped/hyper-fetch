import { useRef } from "react";
import {
  ExtractError,
  ExtractResponse,
  CommandInstance,
  getErrorMessage,
  FetchProgressType,
  ClientResponseType,
  CommandEventDetails,
  CommandResponseDetails,
  CommandLoadingEventType,
} from "@better-typed/hyper-fetch";
import { useIsMounted, useWillUnmount } from "@better-typed/react-lifecycle-hooks";

import {
  OnErrorCallbackType,
  OnStartCallbackType,
  OnSuccessCallbackType,
  OnProgressCallbackType,
  OnFinishedCallbackType,
  UseCommandEventsDataMap,
  UseCommandEventsReturnType,
  UseCommandEventsOptionsType,
  UseCommandEventsLifecycleMap,
} from "helpers";

/**
 * This is helper hook that handles main Hyper-Fetch event/data flow
 * @internal
 * @param options
 * @returns
 */
export const useCommandEvents = <T extends CommandInstance>({
  command,
  dispatcher,
  logger,
  actions,
  setCacheData,
}: UseCommandEventsOptionsType<T>): UseCommandEventsReturnType<T> => {
  const { cache, commandManager } = command.builder;

  const isMounted = useIsMounted();

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

  const lifecycleEvents = useRef<UseCommandEventsLifecycleMap>(new Map());
  const dataEvents = useRef<UseCommandEventsDataMap | null>(null);

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
    data: ClientResponseType<ExtractResponse<T>, ExtractError<T>>,
    details: CommandResponseDetails,
  ) => {
    if (!isMounted) return logger.debug("Callback cancelled, component is unmounted");

    const { isOffline, isFailed, isCanceled } = details;

    if (command.offline && isOffline && isFailed) {
      logger.debug("Performing offline error callback", { data, details });
      onOfflineErrorCallback.current?.({ response: data[1] as ExtractError<T>, command: cmd, details });
    } else if (isCanceled) {
      logger.debug("Performing abort callback", { data, details });
      onAbortCallback.current?.({ response: data[1] as ExtractError<T>, command: cmd, details });
    } else if (!isFailed) {
      logger.debug("Performing success callback", { data, details });
      onSuccessCallback.current?.({ response: data[0] as ExtractResponse<T>, command: cmd, details });
    } else {
      logger.debug("Performing error callback", { data, details });
      onErrorCallback.current?.({ response: data[1] as ExtractError<T>, command: cmd, details });
    }
    onFinishedCallback.current?.({ response: data, command: cmd, details });
  };

  // ******************
  // Lifecycle
  // ******************

  const handleGetLoadingEvent = (queueKey: string) => {
    return ({ isLoading }: CommandLoadingEventType) => {
      const canDisableLoading = !isLoading && !dispatcher.hasRunningRequests(queueKey);
      if (isLoading || canDisableLoading) {
        actions.setLoading(isLoading, false);
      }
    };
  };

  const handleDownloadProgress = (progress: FetchProgressType) => {
    onDownloadProgressCallback?.current?.(progress);
  };

  const handleUploadProgress = (progress: FetchProgressType) => {
    onUploadProgressCallback?.current?.(progress);
  };

  const handleRequestStart = (cmd: T) => {
    return (details: CommandEventDetails<T>) => {
      onRequestStartCallback?.current?.({ command: cmd, details });
    };
  };
  const handleResponseStart = (cmd: T) => {
    return (details: CommandEventDetails<T>) => {
      onResponseStartCallback?.current?.({ command: cmd, details });
    };
  };

  const handleResponse = (cmd: T) => {
    return (data: ClientResponseType<ExtractResponse<T>, ExtractError<T>>, details: CommandResponseDetails) => {
      handleResponseCallbacks(cmd, data, details);
    };
  };

  const handleRemove = ({ requestId }: CommandEventDetails<T>) => {
    removeLifecycleListener(requestId);
  };

  const handleAbort = (cmd: T) => {
    return () => {
      const data: ClientResponseType<ExtractResponse<T>, ExtractError<T>> = [
        null,
        getErrorMessage("abort") as ExtractError<T>,
        0,
      ];
      const details: CommandResponseDetails = {
        retries: 0,
        timestamp: new Date(),
        isFailed: false,
        isCanceled: true,
        isOffline: false,
      };
      handleResponseCallbacks(cmd, data, details);
    };
  };

  // ******************
  // Data Listeners
  // ******************

  const clearDataListener = () => {
    dataEvents.current?.unmount();
    dataEvents.current = null;
  };

  const addDataListener = (cmd: T) => {
    // Data handlers
    const loadingUnmount = commandManager.events.onLoading(cmd.queueKey, handleGetLoadingEvent(cmd.queueKey));
    const getResponseUnmount = cache.events.get<ExtractResponse<T>, ExtractError<T>>(cmd.cacheKey, setCacheData);
    const abortUnmount = commandManager.events.onAbort(cmd.abortKey, handleAbort(cmd));

    const unmount = () => {
      loadingUnmount();
      getResponseUnmount();
      abortUnmount();
    };

    clearDataListener();
    dataEvents.current = { unmount };

    return unmount;
  };

  // ******************
  // Lifecycle Listeners
  // ******************

  const addLifecycleListeners = (cmd: T, requestId?: string) => {
    if (!requestId) {
      const { queueKey, cacheKey } = cmd;
      const requestStartUnmount = commandManager.events.onRequestStart(queueKey, handleRequestStart(cmd));
      const responseStartUnmount = commandManager.events.onResponseStart(queueKey, handleResponseStart(cmd));
      const uploadUnmount = commandManager.events.onUploadProgress(queueKey, handleUploadProgress);
      const downloadUnmount = commandManager.events.onDownloadProgress(queueKey, handleDownloadProgress);
      const responseUnmount = commandManager.events.onResponse(cacheKey, handleResponse(cmd));

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
    const requestRemove = commandManager.events.onRemoveById(requestId, handleRemove);
    const requestStartUnmount = commandManager.events.onRequestStartById(requestId, handleRequestStart(cmd));
    const responseStartUnmount = commandManager.events.onResponseStartById(requestId, handleResponseStart(cmd));
    const responseUnmount = commandManager.events.onResponseById(requestId, handleResponse(cmd));
    const uploadUnmount = commandManager.events.onUploadProgressById(requestId, handleUploadProgress);
    const downloadUnmount = commandManager.events.onDownloadProgressById(requestId, handleDownloadProgress);

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
    const { abortKey } = command;
    const requests = dispatcher.getAllRunningRequest();
    requests.forEach((request) => {
      if (request.command.abortKey === abortKey) {
        dispatcher.delete(request.command.queueKey, request.requestId, abortKey);
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
