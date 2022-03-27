import { useRef, useState } from "react";
import { useDidUpdate, useIsMounted } from "@better-typed/react-lifecycle-hooks";

import {
  FetchProgressType,
  QueueLoadingEventType,
  FetchCommandInstance,
  ExtractResponse,
  ExtractError,
  ExtractFetchReturn,
  CacheValueType,
  ClientResponseType,
  CommandResponseDetails,
} from "@better-typed/hyper-fetch";

import { useDependentState } from "utils/use-dependent-state";
import {
  OnProgressCallbackType,
  OnStartCallbackType,
  OnRequestCallbackType,
  OnErrorCallbackType,
  OnFinishedCallbackType,
  OnSuccessCallbackType,
  UseCommandStateReturnType,
  UseCommandStateOptionsType,
} from "utils/use-command-state";
import { isEqual } from "utils";

export const useCommandState = <T extends FetchCommandInstance>({
  command,
  queue,
  dependencyTracking,
  initialData,
  logger,
  deepCompare,
  commandListeners,
  removeCommandListener,
  refresh,
}: UseCommandStateOptionsType<T>): UseCommandStateReturnType<T> => {
  const { cache } = command.builder;
  const commandDump = command.dump();

  const isMounted = useIsMounted();
  const [usedInitialCallbacks, setUsedInitialCallbacks] = useState(false);

  const [state, actions, setRenderKey, initialized, setCacheData] = useDependentState<T>(command, initialData, queue, [
    JSON.stringify(commandDump),
  ]);

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

  const unmountCallbacks = useRef<null | VoidFunction>(null);

  const handleCallbacks = (
    data: ClientResponseType<ExtractResponse<T>, ExtractError<T>>,
    details: CommandResponseDetails,
  ) => {
    if (!isMounted) return logger.debug("Callback cancelled, component is unmounted");

    const { isOffline, isFailed, isCanceled } = details;

    if (isOffline && isFailed) {
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

  const handleGetResponseData = (cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => {
    const { data, details } = cacheData;
    const { isCanceled, isFailed, isOffline } = details;

    logger.debug("Received new data");

    actions.setLoading(false, false);

    if (isCanceled) {
      return logger.debug("Skipping canceled error response data");
    }

    if (isFailed && isOffline) {
      return logger.debug("Skipping offline error response data");
    }

    refresh?.();

    const compareFn = typeof deepCompare === "function" ? deepCompare : isEqual;
    const isEqualResponse = deepCompare ? compareFn(data, [state.data, state.error, state.status]) : false;

    if (isEqualResponse) {
      actions.setTimestamp(new Date(details.timestamp), false);
    } else {
      setCacheData(cacheData);
    }
  };

  const handleGetLoadingEvent = ({ isLoading, isRetry }: QueueLoadingEventType) => {
    actions.setLoading(isLoading, false);
    onRequestCallback.current?.({ isRetry });
  };

  const handleDownloadProgress = (progress: FetchProgressType) => {
    onDownloadProgressCallback?.current?.(progress);
  };

  const handleUploadProgress = (progress: FetchProgressType) => {
    onUploadProgressCallback?.current?.(progress);
  };

  const handleRequestStart = (middleware: T) => {
    onRequestStartCallback?.current?.(middleware);
  };

  const handleResponseStart = (middleware: T) => {
    onRequestStartCallback?.current?.(middleware);
  };

  const handleResponse = (queueKey: string) => {
    return (data: ClientResponseType<ExtractResponse<T>, ExtractError<T>>, details: CommandResponseDetails) => {
      handleCallbacks(data, details);
      removeCommandListener(queueKey);
    };
  };

  const handleMountEvents = () => {
    const lastRequest = { cacheKey: command.cacheKey, queueKey: command.queueKey, builder: command.builder };

    const unmountArray = commandListeners
      .reduce<Pick<T, "queueKey" | "builder">[]>(
        (acc, curr) => {
          const hasDuplicateListener = acc.find((element) => {
            return element.queueKey === curr.queueKey && element.builder === curr.builder;
          });
          if (!hasDuplicateListener) {
            acc.push(curr);
          }

          return acc;
        },
        [lastRequest],
      )
      .map((listener) => {
        const { queueKey } = listener;
        const { commandManager } = listener.builder;

        const downloadUnmount = commandManager.events.onDownloadProgress(queueKey, handleDownloadProgress);
        const uploadUnmount = commandManager.events.onUploadProgress(queueKey, handleUploadProgress);
        const requestStartUnmount = commandManager.events.onRequestStart(queueKey, handleRequestStart);
        const responseStartUnmount = commandManager.events.onResponseStart(queueKey, handleResponseStart);
        const responseUnmount = commandManager.events.onResponse(queueKey, handleResponse(queueKey));
        const loadingUnmount = queue.events.onLoading(queueKey, handleGetLoadingEvent);

        return () => {
          downloadUnmount();
          uploadUnmount();
          requestStartUnmount();
          responseStartUnmount();
          responseUnmount();
          loadingUnmount();
        };
      });

    const getResponseUnmount = cache.events.get(command.cacheKey, handleGetResponseData);

    const unmount = () => {
      unmountArray.forEach((callback) => callback());
      getResponseUnmount();
    };

    unmountCallbacks.current?.();
    unmountCallbacks.current = unmount;

    return unmount;
  };

  const handleDependencyTracking = () => {
    if (!dependencyTracking) {
      Object.keys(state).forEach((key) => setRenderKey(key as Parameters<typeof setRenderKey>[0]));
    }
  };

  /**
   * Initialization of the events related to data exchange with cache and queue
   * This allow to share the state with other hooks and keep it related
   */
  useDidUpdate(
    () => {
      handleDependencyTracking();
      return handleMountEvents();
    },
    [JSON.stringify(commandDump)],
    true,
  );

  /**
   * On the init if we have data we should call the callback functions
   */
  useDidUpdate(
    () => {
      if (initialized && !usedInitialCallbacks) {
        // Todo: add the option to allow initial callbacks handling
        // handleCallbacks([state.data, state.error, state.status]);
        setUsedInitialCallbacks(true);
      }
    },
    [JSON.stringify(commandDump), initialized],
    true,
  );

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
      setRenderKey,
      initialized,
    },
  ];
};
