import { useRef } from "react";
import {
  ExtractResponse,
  FetchCommandInstance,
  getCacheRequestKey,
  FetchProgressType,
  ExtractError,
  ExtractFetchReturn,
  SubmitLoadingEventType,
  CacheValueType,
} from "@better-typed/hyper-fetch";
import { useDidMount } from "@better-typed/react-lifecycle-hooks";

import {
  UseSubmitOptionsType,
  UseSubmitReturnType,
  OnSuccessCallbackType,
  OnErrorCallbackType,
  OnRequestCallbackType,
  OnFinishedCallbackType,
  OnStartCallbackType,
  OnProgressCallbackType,
} from "./use-submit.types";
import { useSubmitDefaultOptions } from "./use-submit.constants";
import { getCacheState, getUseFetchInitialData, isStaleCacheData } from "../use-fetch/use-fetch.utils";
import { useDependentState } from "../use-dependent-state/use-dependent-state.hooks";

export const useSubmit = <T extends FetchCommandInstance, MapperResponse>(
  command: T,
  {
    disabled = useSubmitDefaultOptions.disabled,
    dependencyTracking = useSubmitDefaultOptions.dependencyTracking,
    cacheOnMount = useSubmitDefaultOptions.cacheOnMount,
    initialData = useSubmitDefaultOptions.initialData,
    // debounce = useSubmitDefaultOptions.debounce,
    // debounceTime = useSubmitDefaultOptions.debounceTime,
    // suspense = useSubmitDefaultOptions.suspense,
    // invalidate = useSubmitDefaultOptions.invalidate,
    shouldThrow = useSubmitDefaultOptions.shouldThrow,
    responseDataModifierFn = useSubmitDefaultOptions.responseDataModifierFn,
  }: UseSubmitOptionsType<T, MapperResponse> = useSubmitDefaultOptions,
): UseSubmitReturnType<T, MapperResponse extends never ? ExtractResponse<T> : MapperResponse> => {
  const { cacheTime, cacheKey, queueKey } = command;
  // const requestDebounce = useDebounce(debounceTime);
  const { cache, submitQueue, commandManager } = command.builder;
  const requestKey = getCacheRequestKey(command);
  const initCacheState = useRef(getCacheState(cache.get(cacheKey, requestKey), cacheOnMount, cacheTime));
  const initialStale = useRef(isStaleCacheData(cacheTime, initCacheState.current?.timestamp));
  const initState = useRef(initialStale.current ? getUseFetchInitialData<T>(initialData) : initCacheState.current);
  const [state, actions, setRenderKey] = useDependentState<T>(cacheKey, requestKey, command.builder, initState.current);

  const onRequestCallback = useRef<null | OnRequestCallbackType>(null);
  const onSuccessCallback = useRef<null | OnSuccessCallbackType<ExtractResponse<T>>>(null);
  const onErrorCallback = useRef<null | OnErrorCallbackType<ExtractError<T>>>(null);
  const onFinishedCallback = useRef<null | OnFinishedCallbackType<ExtractFetchReturn<T>>>(null);
  const onRequestStartCallback = useRef<null | OnStartCallbackType<T>>(null);
  const onResponseStartCallback = useRef<null | OnStartCallbackType<T>>(null);
  const onDownloadProgressCallback = useRef<null | OnProgressCallbackType>(null);
  const onUploadProgressCallback = useRef<null | OnProgressCallbackType>(null);

  const handleSubmit = (...parameters: Parameters<T["send"]>) => {
    let request = command;

    const options = parameters[0];

    if (options?.data) {
      request = request.setData(options.data) as T;
    }
    if (options?.params) {
      request = request.setParams(options.params) as T;
    }
    if (options?.queryParams) {
      request = request.setQueryParams(options.queryParams) as T;
    }

    if (!disabled) {
      submitQueue.add(request);
    }
  };

  const handleCallbacks = (response: ExtractFetchReturn<T> | undefined) => {
    if (response) {
      if (response[0]) {
        onSuccessCallback?.current?.(response[0]);
      }
      if (response[1]) {
        onErrorCallback?.current?.(response[1]);
        if (shouldThrow) {
          throw {
            message: "Fetching Error.",
            error: response[1],
          };
        }
      }
      onFinishedCallback?.current?.(response);
    }
  };

  const handleGetUpdatedCache = (cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => {
    actions.setCacheData(cacheData, false);
    handleCallbacks(cacheData.response);
  };

  const handleGetRefreshedCache = () => {
    actions.setRefreshed(true, false);
    actions.setTimestamp(new Date(), false);
    handleCallbacks([state.data, state.error, state.status]);
  };

  const handleGetLoadingEvent = ({ isLoading, isRetry }: SubmitLoadingEventType) => {
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

    const loadingUnmount = submitQueue.events.getLoading(queueKey, handleGetLoadingEvent);

    const getDataUnmount = cache.events.get<T>(requestKey, handleGetUpdatedCache);
    const getRefreshedUnmount = cache.events.getRefreshed(requestKey, handleGetRefreshedCache);

    return () => {
      downloadUnmount();
      uploadUnmount();
      requestStartUnmount();
      responseStartUnmount();
      loadingUnmount();

      getDataUnmount();
      getRefreshedUnmount();
    };
  };

  const handleData = () => {
    return responseDataModifierFn && state.data ? responseDataModifierFn(state.data) : state.data;
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
  useDidMount(() => {
    handleDependencyTracking();
    return handleMountEvents();
  });

  return {
    submit: handleSubmit,
    get data() {
      setRenderKey("data");
      return handleData() as (MapperResponse extends never ? ExtractResponse<T> : MapperResponse) extends never
        ? ExtractResponse<T>
        : MapperResponse extends never
        ? ExtractResponse<T>
        : MapperResponse;
    },
    get error() {
      setRenderKey("error");
      return state.error;
    },
    get isSubmitting() {
      setRenderKey("loading");
      return state.loading;
    },
    get status() {
      setRenderKey("status");
      return state.status;
    },
    get retryError() {
      setRenderKey("retryError");
      return state.retryError;
    },
    get retries() {
      setRenderKey("retries");
      return state.retries;
    },
    get timestamp() {
      setRenderKey("timestamp");
      return state.timestamp;
    },
    get isOnline() {
      setRenderKey("isOnline");
      return state.isOnline;
    },
    get isFocused() {
      setRenderKey("isFocused");
      return state.isFocused;
    },
    get isStale() {
      return isStaleCacheData(cacheTime, state.timestamp);
    },
    actions,
    isDebouncing: false,
    isRefreshed: false,
    onSubmitRequest: (callback: OnRequestCallbackType) => {
      onRequestCallback.current = callback;
    },
    onSubmitSuccess: (callback: OnSuccessCallbackType<ExtractResponse<T>>) => {
      onSuccessCallback.current = callback;
    },
    onSubmitError: (callback: OnErrorCallbackType<ExtractError<T>>) => {
      onErrorCallback.current = callback;
    },
    onSubmitFinished: (callback: OnFinishedCallbackType<ExtractFetchReturn<T>>) => {
      onFinishedCallback.current = callback;
    },
    onSubmitRequestStart: (callback: OnStartCallbackType<T>) => {
      onRequestStartCallback.current = callback;
    },
    onSubmitResponseStart: (callback: OnStartCallbackType<T>) => {
      onResponseStartCallback.current = callback;
    },
    onSubmitDownloadProgress: (callback: OnProgressCallbackType) => {
      onDownloadProgressCallback.current = callback;
    },
    onSubmitUploadProgress: (callback: OnProgressCallbackType) => {
      onUploadProgressCallback.current = callback;
    },
  };
};
