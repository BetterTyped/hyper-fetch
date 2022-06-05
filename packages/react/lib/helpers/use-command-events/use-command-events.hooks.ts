import { useRef, useState } from "react";
import {
  ExtractError,
  CacheValueType,
  isFailedRequest,
  ExtractResponse,
  FetchProgressType,
  ClientResponseType,
  ExtractFetchReturn,
  CommandEventDetails,
  CommandInstance,
  CommandResponseDetails,
  DispatcherLoadingEventType,
} from "@better-typed/hyper-fetch";
import { useDidUpdate, useIsMounted, useWillUnmount } from "@better-typed/react-lifecycle-hooks";

import {
  OnErrorCallbackType,
  OnStartCallbackType,
  OnSuccessCallbackType,
  OnRequestCallbackType,
  OnProgressCallbackType,
  OnFinishedCallbackType,
  UseCommandStateReturnType,
  UseCommandStateOptionsType,
} from "helpers";
import { isEqual } from "utils";

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
  deepCompare,
  cacheInitialized,
  initializeCallbacks = false,
}: UseCommandStateOptionsType<T>): UseCommandStateReturnType<T> => {
  const { cache, appManager, commandManager } = command.builder;
  const commandDump = command.dump();

  const isMounted = useIsMounted();
  const [initializedCallbacks, setInitializedCallbacks] = useState(false);

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

  const unmountLifecycleEventsCallbacks = useRef<VoidFunction[]>([]);
  const unmountDataEventsCallback = useRef<VoidFunction | null>(null);

  // ******************
  // Response handlers
  // ******************

  const handleResponseCallbacks = (
    data: ClientResponseType<ExtractResponse<T>, ExtractError<T>>,
    details: CommandResponseDetails,
  ) => {
    if (!isMounted) return logger.debug("Callback cancelled, component is unmounted");

    const { isOffline, isFailed, isCanceled } = details;

    if (command.offline && isOffline && isFailed) {
      logger.debug("Performing offline error callback", { data, details });
      onOfflineErrorCallback.current?.(data[1] as ExtractError<T>, details);
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
    const trigger = () => {
      const hasData = state.data && state.error && state.timestamp;
      const queue = dispatcher.getQueue(command.queueKey);
      if (hasData && cacheInitialized && !initializedCallbacks && initializeCallbacks) {
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

  const handleGetResponseData = ({ data, details }: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => {
    const { isCanceled, isFailed, isOffline } = details;

    logger.debug("Received new data");
    actions.setLoading(false, false);

    if (isCanceled) {
      logger.debug("Skipping canceled error response data");
    }

    if (isFailed && isOffline) {
      logger.debug("Skipping offline error response data");
    }

    const compareFn = typeof deepCompare === "function" ? deepCompare : isEqual;
    const isEqualResponse = deepCompare ? compareFn(data, [state.data, state.error, state.status]) : false;

    // To limit rerendering we change only the data timestamp when data is equal
    if (isEqualResponse) {
      actions.setTimestamp(new Date(details.timestamp), false);
    }
    // When new data comes we fully change state
    else {
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

  const addRequestListener = (requestId: string, cmd: CommandInstance) => {
    const downloadUnmount = commandManager.events.onDownloadProgressById(requestId, handleDownloadProgress);
    const uploadUnmount = commandManager.events.onUploadProgressById(requestId, handleUploadProgress);
    const requestStartUnmount = commandManager.events.onRequestStartById(requestId, handleRequestStart);
    const responseStartUnmount = commandManager.events.onResponseStartById(requestId, handleResponseStart);
    const responseUnmount = commandManager.events.onResponseById(requestId, handleResponse);

    // Data handlers
    const loadingUnmount = dispatcher.events.onLoading(cmd.queueKey, handleGetLoadingEvent);
    const getResponseUnmount = cache.events.get<ExtractResponse<T>, ExtractError<T>>(
      cmd.cacheKey,
      handleGetResponseData,
    );

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

    unmountDataEventsCallback.current?.();

    unmountLifecycleEventsCallbacks.current.push(unmountLifecycle);
    unmountDataEventsCallback.current = unmountDataHandlers;

    return (unmountLifecycleEvents = true, unmountDataEvents = true) => {
      if (unmountLifecycleEvents) unmountLifecycle();
      if (unmountDataEvents) unmountDataHandlers();
    };
  };

  /**
   * Initialization of the events related to data exchange with cache and queue
   * This allow to share the state with other hooks and keep it related
   */

  /**
   * On the init if we have data we should call the callback functions
   */
  useDidUpdate(handleInitialCallbacks, [JSON.stringify(commandDump), cacheInitialized], true);

  /**
   * On unmount we want to clear all the listeners to prevent memory leaks
   */
  useWillUnmount(() => {
    // Unmount listeners
    unmountLifecycleEventsCallbacks.current.forEach((unmount) => unmount());
    unmountDataEventsCallback.current?.();
  });

  return [
    {
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
    },
  ];
};
