import { useRef, useState } from "react";
import { useDidUpdate } from "@better-typed/react-lifecycle-hooks";

import {
  FetchProgressType,
  QueueLoadingEventType,
  FetchCommandInstance,
  ExtractResponse,
  ExtractError,
  ExtractFetchReturn,
  CacheValueType,
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
}: UseCommandStateOptionsType<T>): UseCommandStateReturnType<T> => {
  const { builder, cacheKey, queueKey } = command;
  const { commandManager, cache } = builder;
  const commandDump = command.dump();

  const [usedInitialCallbacks, setUsedInitialCallbacks] = useState(false);

  const [state, actions, setRenderKey, initialized] = useDependentState<T>(command, initialData, queue, [
    JSON.stringify(commandDump),
  ]);

  const onRequestCallback = useRef<null | OnRequestCallbackType>(null);
  const onSuccessCallback = useRef<null | OnSuccessCallbackType<ExtractResponse<T>>>(null);
  const onErrorCallback = useRef<null | OnErrorCallbackType<ExtractError<T>>>(null);
  const onFinishedCallback = useRef<null | OnFinishedCallbackType<ExtractFetchReturn<T>>>(null);
  const onRequestStartCallback = useRef<null | OnStartCallbackType<T>>(null);
  const onResponseStartCallback = useRef<null | OnStartCallbackType<T>>(null);
  const onDownloadProgressCallback = useRef<null | OnProgressCallbackType>(null);
  const onUploadProgressCallback = useRef<null | OnProgressCallbackType>(null);

  const unmountCallbacks = useRef<null | VoidFunction>(null);

  const handleCallbacks = (response: ExtractFetchReturn<T> | undefined) => {
    if (response) {
      const status = response[2] || 0;
      const hasSuccessState = !!(response[0] && !response[1]);
      const hasSuccessStatus = !!(!response[1] && status >= 200 && status <= 400);
      if (hasSuccessState || hasSuccessStatus) {
        logger.debug("Performing success callback", {
          status,
          hasSuccessState,
          hasSuccessStatus,
          response,
          hasCallback: !!onSuccessCallback?.current,
        });
        onSuccessCallback.current?.(response[0] as ExtractResponse<T>);
      } else {
        logger.debug("Performing error callback", {
          status,
          hasSuccessState,
          hasSuccessStatus,
          response,
          hasCallback: !!onErrorCallback?.current,
        });
        onErrorCallback.current?.(response[1] as ExtractError<T>);
      }
      onFinishedCallback.current?.(response);
    } else {
      logger.debug("No response to perform callbacks");
    }
  };

  const handleGetResponseData = async (data: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => {
    logger.debug("Received new data");
    handleCallbacks(data.response); // Must be first

    const compareFn = typeof deepCompare === "function" ? deepCompare : isEqual;
    const isEqualResponse = deepCompare ? compareFn(data.response, [state.data, state.error, state.status]) : false;

    if (isEqualResponse) {
      await actions.setTimestamp(data.timestamp ? new Date(data.timestamp) : null);
    } else {
      await actions.setCacheData(data, false);
    }

    await actions.setLoading(false, false);
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

  const handleMountEvents = () => {
    const downloadUnmount = commandManager.events.onDownloadProgress(queueKey, handleDownloadProgress);
    const uploadUnmount = commandManager.events.onUploadProgress(queueKey, handleUploadProgress);
    const requestStartUnmount = commandManager.events.onRequestStart(queueKey, handleRequestStart);
    const responseStartUnmount = commandManager.events.onResponseStart(queueKey, handleResponseStart);

    const loadingUnmount = queue.events.onLoading(queueKey, handleGetLoadingEvent);
    const getResponseUnmount = cache.events.get(cacheKey, handleGetResponseData);

    const unmount = () => {
      downloadUnmount();
      uploadUnmount();
      requestStartUnmount();
      responseStartUnmount();
      loadingUnmount();
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
