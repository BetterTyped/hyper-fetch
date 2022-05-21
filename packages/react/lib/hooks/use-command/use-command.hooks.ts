import { useRef, useState } from "react";
import { useDidUpdate, useIsMounted, useWillUnmount } from "@better-typed/react-lifecycle-hooks";
import {
  FetchProgressType,
  DispatcherLoadingEventType,
  FetchCommandInstance,
  ExtractResponse,
  ExtractError,
  ExtractFetchReturn,
  ClientResponseType,
  CommandResponseDetails,
  CommandEventDetails,
  isFailedRequest,
} from "@better-typed/hyper-fetch";

import {
  useDependentState,
  OnProgressCallbackType,
  OnStartCallbackType,
  OnRequestCallbackType,
  OnErrorCallbackType,
  OnFinishedCallbackType,
  OnSuccessCallbackType,
  UseCommandStateReturnType,
  UseCommandStateOptionsType,
} from "hooks";
import { isEqual, isStaleCacheData } from "utils";

/**
 * This is helper hook that handles main Hyper-Fetch event/data flow
 * @internal
 * @param options
 * @returns
 */
export const useCommand = <T extends FetchCommandInstance>({
  command,
  dispatcher,
  dependencyTracking,
  initialData,
  logger,
  deepCompare,
  initializeCallbacks = false,
}: UseCommandStateOptionsType<T>): UseCommandStateReturnType<T> => {
  const { cache, appManager } = command.builder;
  const commandDump = command.dump();

  const isMounted = useIsMounted();
  const [initializedCallbacks, setInitializedCallbacks] = useState(false);
  const [state, actions, setRenderKey, initialized, setCacheData] = useDependentState<T>(
    command,
    initialData,
    dispatcher,
    [JSON.stringify(commandDump)],
  );

  // ******************
  // Callbacks
  // ******************

  const onRequestCallback = useRef<null | OnRequestCallbackType>(null);
  const onSuccessCallback = useRef<null | OnSuccessCallbackType<ExtractResponse<T>>>(null);
  const onErrorCallback = useRef<null | OnErrorCallbackType<ExtractError<T>>>(null);
  const onAbortCallback = useRef<null | OnErrorCallbackType<ExtractError<T>>>(null);
  const onOfflineErrorCallback = useRef<null | OnErrorCallbackType<ExtractError<T>>>(null);
  const onFinishedCallback = useRef<null | OnFinishedCallbackType<ExtractFetchReturn<T>>>(null);
  const onRequestStartCallback = useRef<null | OnStartCallbackType<T>>(null);
  const onResponseStartCallback = useRef<null | OnStartCallbackType<T>>(null);
  const onDownloadProgressCallback = useRef<null | OnProgressCallbackType>(null);
  const onUploadProgressCallback = useRef<null | OnProgressCallbackType>(null);

  // ******************
  // Listeners unmounting
  // ******************

  const unmountLifecycleCallbacks = useRef<VoidFunction[]>([]);
  const unmountDataHandlerCallback = useRef<VoidFunction | null>(null);

  // ******************
  // Response handlers
  // ******************

  const handleResponseCallbacks = (
    data: ClientResponseType<ExtractResponse<T>, ExtractError<T>>,
    details: CommandResponseDetails,
  ) => {
    if (!isMounted) return logger.debug("Callback cancelled, component is unmounted");

    const { isOffline, isFailed, isCanceled } = details;

    if (isOffline && isFailed) {
      logger.debug("Performing offline error callback", { data, details });
      onOfflineErrorCallback.current?.(data[1] as ExtractError<T>, details);
      if (command.offline) onErrorCallback.current?.(data[1] as ExtractError<T>, details);
    } else if (isCanceled) {
      logger.debug("Performing abort callback", { data, details });
      onAbortCallback.current?.(data[1] as ExtractError<T>, details);
    } else if (!isFailed) {
      logger.debug("Performing success callback", { data, details });
      onSuccessCallback.current?.(data[0] as ExtractResponse<T>, details);
    } else {
      logger.debug("Performing error callback", { data, details });
      onErrorCallback.current?.(data[1] as ExtractError<T>, details);
    }
    onFinishedCallback.current?.(data, details);
  };

  const handleInitialCallbacks = () => {
    const trigger = async () => {
      const hasData = state.data && state.error && state.timestamp;
      const queue = await dispatcher.getQueue(command.queueKey);
      if (hasData && initialized && !initializedCallbacks && initializeCallbacks) {
        const details = {
          retries: state.retries,
          timestamp: new Date(state.timestamp as Date),
          isFailed: isFailedRequest([state.data, state.error, state.status]),
          isCanceled: false,
          isRefreshed: state.isRefreshed,
          isOffline: !appManager.isOnline,
          isStopped: queue.stopped,
        };

        handleResponseCallbacks([state.data, state.error, state.status], details);
        setInitializedCallbacks(true);
      }
    };
    trigger();
  };

  // ******************
  // Lifecycle
  // ******************

  const handleGetResponseData = (
    data: ClientResponseType<ExtractResponse<T>, ExtractError<T>>,
    details: CommandResponseDetails,
  ) => {
    const { isCanceled, isFailed, isOffline } = details;

    logger.debug("Received new data");
    actions.setLoading(false, false);

    if (isCanceled) {
      return logger.debug("Skipping canceled error response data");
    }

    if (isFailed && isOffline) {
      return logger.debug("Skipping offline error response data");
    }

    const compareFn = typeof deepCompare === "function" ? deepCompare : isEqual;
    const isEqualResponse = deepCompare ? compareFn(data, [state.data, state.error, state.status]) : false;

    if (isEqualResponse) {
      actions.setTimestamp(new Date(details.timestamp), false);
    } else {
      setCacheData({ data, details });
    }
  };

  const handleGetLoadingEvent = ({ isLoading, isRetry }: DispatcherLoadingEventType) => {
    actions.setLoading(isLoading, false);
    if (isLoading) {
      onRequestCallback.current?.({ isRetry });
    }
  };

  const handleDownloadProgress = (progress: FetchProgressType) => {
    onDownloadProgressCallback?.current?.(progress);
  };

  const handleUploadProgress = (progress: FetchProgressType) => {
    onUploadProgressCallback?.current?.(progress);
  };

  const handleRequestStart = (details: CommandEventDetails<T>) => {
    onRequestStartCallback?.current?.(details);
  };

  const handleResponseStart = (details: CommandEventDetails<T>) => {
    onRequestStartCallback?.current?.(details);
  };

  const handleResponse = () => {
    return (data: ClientResponseType<ExtractResponse<T>, ExtractError<T>>, details: CommandResponseDetails) => {
      handleResponseCallbacks(data, details);
    };
  };

  const addRequestListener = (requestId: string, cmd: FetchCommandInstance) => {
    const { commandManager } = cmd.builder;

    const downloadUnmount = commandManager.events.onDownloadProgressById(requestId, handleDownloadProgress);
    const uploadUnmount = commandManager.events.onUploadProgressById(requestId, handleUploadProgress);
    const requestStartUnmount = commandManager.events.onRequestStartById(requestId, handleRequestStart);
    const responseStartUnmount = commandManager.events.onResponseStartById(requestId, handleResponseStart);
    const responseUnmount = commandManager.events.onResponseById(requestId, handleResponse);

    // Data handlers
    const loadingUnmount = dispatcher.events.onLoading(cmd.queueKey, handleGetLoadingEvent);
    const getResponseUnmount = commandManager.events.onResponseById(requestId, handleGetResponseData);

    const unmountLifecycle = () => {
      downloadUnmount();
      uploadUnmount();
      requestStartUnmount();
      responseStartUnmount();
      responseUnmount();
      loadingUnmount();
    };

    const unmountDataHandlers = () => {
      loadingUnmount();
      getResponseUnmount();
    };

    unmountDataHandlerCallback.current?.();

    unmountLifecycleCallbacks.current.push(unmountLifecycle);
    unmountDataHandlerCallback.current = unmountDataHandlers;
  };

  // ******************
  // Misc
  // ******************

  const handleDependencyTracking = () => {
    if (!dependencyTracking) {
      Object.keys(state).forEach((key) => setRenderKey(key as Parameters<typeof setRenderKey>[0]));
    }
  };

  const getStaleStatus = async () => {
    const cacheData = await command.builder.cache.get(command.cacheKey);

    return isStaleCacheData(command.cacheTime, cacheData?.details.timestamp);
  };

  const setInitialDataListeners = () => {
    // Check if listeners are already initialized
    if (!unmountDataHandlerCallback.current) {
      const loadingUnmount = dispatcher.events.onLoading(command.queueKey, handleGetLoadingEvent);
      const getDataUnmount = cache.events.get(command.cacheKey, (cacheData) =>
        handleGetResponseData(cacheData.data, cacheData.details),
      );

      return () => {
        loadingUnmount();
        getDataUnmount();
      };
    }
  };

  /**
   * Initialization of the events related to data exchange with cache and queue
   * This allow to share the state with other hooks and keep it related
   */

  /**
   * Dependency tracking mode initialization
   */
  useDidUpdate(handleDependencyTracking, [JSON.stringify(commandDump), dependencyTracking], true);

  /**
   * On the init if we have data we should call the callback functions
   */
  useDidUpdate(handleInitialCallbacks, [JSON.stringify(commandDump), initialized], true);

  /**
   * On the init if we have data we should call the callback functions
   */
  useDidUpdate(setInitialDataListeners, [JSON.stringify(commandDump), initialized], true);

  useWillUnmount(() => {
    // Unmount listeners
  });

  return [
    state,
    {
      actions,
      onRequest: (callback: OnRequestCallbackType) => {
        onRequestCallback.current = callback;
      },
      onSuccess: (callback: OnSuccessCallbackType<ExtractResponse<T>>) => {
        onSuccessCallback.current = callback;
      },
      onError: (callback: OnErrorCallbackType<ExtractError<T>>) => {
        onErrorCallback.current = callback;
      },
      onAbort: (callback: OnErrorCallbackType<ExtractError<T>>) => {
        onAbortCallback.current = callback;
      },
      onOfflineError: (callback: OnErrorCallbackType<ExtractError<T>>) => {
        onOfflineErrorCallback.current = callback;
      },
      onFinished: (callback: OnFinishedCallbackType<ExtractFetchReturn<T>>) => {
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
      addRequestListener,
      setRenderKey,
      getStaleStatus,
    },
  ];
};
