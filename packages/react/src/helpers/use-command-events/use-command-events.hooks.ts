import { useRef } from "react";
import {
  ExtractError,
  isFailedRequest,
  ExtractResponse,
  CommandInstance,
  getErrorMessage,
  FetchProgressType,
  ClientResponseType,
  ExtractFetchReturn,
  CommandEventDetails,
  CommandResponseDetails,
  DispatcherLoadingEventType,
} from "@better-typed/hyper-fetch";
import { useDidUpdate, useIsMounted, useWillUnmount } from "@better-typed/react-lifecycle-hooks";

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
  state,
  actions,
  setCacheData,
  initializeCallbacks = false,
}: UseCommandEventsOptionsType<T>): UseCommandEventsReturnType<T> => {
  const { cache, appManager, commandManager } = command.builder;
  const commandDump = command.dump();

  const isMounted = useIsMounted();

  // ******************
  // Callbacks
  // ******************

  const onSuccessCallback = useRef<null | OnSuccessCallbackType<ExtractResponse<T>, unknown>>(null);
  const onErrorCallback = useRef<null | OnErrorCallbackType<ExtractError<T>, unknown>>(null);
  const onAbortCallback = useRef<null | OnErrorCallbackType<ExtractError<T>, unknown>>(null);
  const onOfflineErrorCallback = useRef<null | OnErrorCallbackType<ExtractError<T>, unknown>>(null);
  const onFinishedCallback = useRef<null | OnFinishedCallbackType<ExtractFetchReturn<T>, unknown>>(null);
  const onRequestStartCallback = useRef<null | OnStartCallbackType<T, unknown>>(null);
  const onResponseStartCallback = useRef<null | OnStartCallbackType<T>>(null);
  const onDownloadProgressCallback = useRef<null | OnProgressCallbackType>(null);
  const onUploadProgressCallback = useRef<null | OnProgressCallbackType>(null);

  // ******************
  // Listeners unmounting
  // ******************

  const lifecycleEvents = useRef<UseCommandEventsLifecycleMap>(new Map());
  const dataEvents = useRef<UseCommandEventsDataMap | null>(null);

  // ******************
  // Response handlers
  // ******************

  const handleResponseCallbacks = (
    data: ClientResponseType<ExtractResponse<T>, ExtractError<T>>,
    details: CommandResponseDetails,
    context?: unknown,
  ) => {
    if (!isMounted) return logger.debug("Callback cancelled, component is unmounted");

    const { isOffline, isFailed, isCanceled } = details;

    if (command.offline && isOffline && isFailed) {
      logger.debug("Performing offline error callback", { data, details });
      onOfflineErrorCallback.current?.(data[1] as ExtractError<T>, details, context);
    } else if (isCanceled) {
      logger.debug("Performing abort callback", { data, details });
      onAbortCallback.current?.(data[1] as ExtractError<T>, details, context);
    } else if (!isFailed) {
      logger.debug("Performing success callback", { data, details });
      onSuccessCallback.current?.(data[0] as ExtractResponse<T>, details, context);
    } else {
      logger.debug("Performing error callback", { data, details });
      onErrorCallback.current?.(data[1] as ExtractError<T>, details, context);
    }
    onFinishedCallback.current?.(data, details, context);
  };

  const handleInitialCallbacks = () => {
    const hasData = state.data && state.error && state.timestamp;
    if (hasData && initializeCallbacks) {
      const details = {
        retries: state.retries,
        timestamp: new Date(state.timestamp as Date),
        isFailed: isFailedRequest([state.data, state.error, state.status]),
        isCanceled: false,
        isOffline: !appManager.isOnline,
      };

      handleResponseCallbacks([state.data, state.error, state.status], details);
    }
  };

  // ******************
  // Lifecycle
  // ******************

  const handleGetLoadingEvent = (queueKey: string) => {
    return ({ isLoading }: DispatcherLoadingEventType) => {
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

  const handleRequestStart = (setContext: (value: unknown) => void) => {
    return (details: CommandEventDetails<T>) => {
      setContext(onRequestStartCallback?.current?.(details));
    };
  };
  const handleResponseStart = (details: CommandEventDetails<T>) => {
    onResponseStartCallback?.current?.(details);
  };

  const handleResponse = (requestId: string, context: unknown) => {
    return (data: ClientResponseType<ExtractResponse<T>, ExtractError<T>>, details: CommandResponseDetails) => {
      const event = lifecycleEvents.current.get(requestId);
      event?.unmount();
      lifecycleEvents.current.delete(requestId);

      handleResponseCallbacks(data, details, context);
    };
  };

  const handleAbort = () => {
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
    handleResponseCallbacks(data, details);
  };

  // ******************
  // Data Listeners
  // ******************

  const clearDataListener = () => {
    dataEvents.current?.unmount();
  };

  const addDataListener = (cmd: CommandInstance, clear = true) => {
    // Data handlers
    const loadingUnmount = dispatcher.events.onLoading(cmd.queueKey, handleGetLoadingEvent(cmd.queueKey));
    const getResponseUnmount = cache.events.get<ExtractResponse<T>, ExtractError<T>>(cmd.cacheKey, (data) =>
      setCacheData(data),
    );
    const abortUnmount = commandManager.events.onAbort(cmd.abortKey, handleAbort);

    const unmount = () => {
      loadingUnmount();
      getResponseUnmount();
      abortUnmount();
    };

    if (clear) clearDataListener();
    dataEvents.current = { unmount };

    return unmount;
  };

  // ******************
  // Lifecycle Listeners
  // ******************

  const addLifecycleListeners = (requestId: string) => {
    let context: unknown | null = null;

    const setContext = (value: unknown) => {
      context = value;
    };

    const downloadUnmount = commandManager.events.onDownloadProgressById(requestId, handleDownloadProgress);
    const uploadUnmount = commandManager.events.onUploadProgressById(requestId, handleUploadProgress);
    const requestStartUnmount = commandManager.events.onRequestStartById(requestId, handleRequestStart(setContext));
    const responseStartUnmount = commandManager.events.onResponseStartById(requestId, handleResponseStart);
    const responseUnmount = commandManager.events.onResponseById(requestId, handleResponse(requestId, context));

    const unmount = () => {
      downloadUnmount();
      uploadUnmount();
      requestStartUnmount();
      responseStartUnmount();
      responseUnmount();
    };

    lifecycleEvents.current.set(requestId, { unmount });

    return unmount;
  };

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
   * On the init if we have data we should call the callback functions
   */
  useDidUpdate(handleInitialCallbacks, [commandDump.cacheKey, commandDump.queueKey], true);

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
      onSuccess: <Context = undefined>(callback: OnSuccessCallbackType<ExtractResponse<T>, Context>) => {
        onSuccessCallback.current = callback;
      },
      onError: <Context = undefined>(callback: OnErrorCallbackType<ExtractError<T>, Context>) => {
        onErrorCallback.current = callback;
      },
      onAbort: <Context = undefined>(callback: OnErrorCallbackType<ExtractError<T>, Context>) => {
        onAbortCallback.current = callback;
      },
      onOfflineError: <Context = undefined>(callback: OnErrorCallbackType<ExtractError<T>, Context>) => {
        onOfflineErrorCallback.current = callback;
      },
      onFinished: <Context = undefined>(callback: OnFinishedCallbackType<ExtractFetchReturn<T>, Context>) => {
        onFinishedCallback.current = callback;
      },
      onRequestStart: <Context = undefined>(callback: OnStartCallbackType<T, Context>) => {
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
