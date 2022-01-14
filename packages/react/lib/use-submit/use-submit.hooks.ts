import { ExtractResponse, FetchCommandInstance, getCacheRequestKey } from "@better-typed/hyper-fetch";
import { useRef } from "react";
import { UseSubmitOptionsType, UseSubmitReturnType } from "./use-submit.types";
import { useSubmitDefaultOptions } from "./use-submit.constants";
import { getCacheState, getUseFetchInitialData, isStaleCacheData } from "../use-fetch/use-fetch.utils";
import { useDependentState } from "../use-dependent-state/use-dependent-state.hooks";

export const useSubmit = <T extends FetchCommandInstance, MapperResponse>(
  command: T,
  {
    disabled = useSubmitDefaultOptions.disabled,
    // dependencyTracking = useSubmitDefaultOptions.dependencyTracking,
    cacheOnMount = useSubmitDefaultOptions.cacheOnMount,
    initialData = useSubmitDefaultOptions.initialData,
    // debounce = useSubmitDefaultOptions.debounce,
    // debounceTime = useSubmitDefaultOptions.debounceTime,
    // suspense = useSubmitDefaultOptions.suspense,
    // shouldThrow = useSubmitDefaultOptions.shouldThrow,
    responseDataModifierFn = useSubmitDefaultOptions.responseDataModifierFn,
  }: // invalidate = useSubmitDefaultOptions.invalidate,
  UseSubmitOptionsType<T, MapperResponse> = useSubmitDefaultOptions,
): UseSubmitReturnType<T, MapperResponse extends never ? ExtractResponse<T> : MapperResponse> => {
  const { cacheTime, cacheKey } = command;
  // const requestDebounce = useDebounce(debounceTime);
  const { cache, submitQueue } = command.builder;
  const requestKey = getCacheRequestKey(command);
  const initCacheState = useRef(getCacheState(cache.get(cacheKey, requestKey), cacheOnMount, cacheTime));
  const initialStale = useRef(isStaleCacheData(cacheTime, initCacheState.current?.timestamp));
  const initState = useRef(initialStale.current ? getUseFetchInitialData<T>(initialData) : initCacheState.current);
  const [state, , setRenderKey] = useDependentState<T>(cacheKey, requestKey, command.builder, initState.current);
  // const [hasCacheData, setHasCacheData] = useState(!initialStale.current);

  // const onRequestCallback = useRef<null | OnRequestCallbackType>(null);
  // const onSuccessCallback = useRef<null | OnSuccessCallbackType<ExtractResponse<T>>>(null);
  // const onErrorCallback = useRef<null | OnErrorCallbackType<ExtractError<T>>>(null);
  // const onFinishedCallback = useRef<null | OnFinishedCallbackType<ExtractFetchReturn<T>>>(null);
  // const onRequestStartCallback = useRef<null | OnStartCallbackType<T>>(null);
  // const onResponseStartCallback = useRef<null | OnStartCallbackType<T>>(null);
  // const onDownloadProgressCallback = useRef<null | OnProgressCallbackType>(null);
  // const onUploadProgressCallback = useRef<null | OnProgressCallbackType>(null);

  const handleSubmit = () => {
    if (!disabled) {
      submitQueue.add(command);
    }
  };

  const handleData = () => {
    return responseDataModifierFn && state.data ? responseDataModifierFn(state.data) : state.data;
  };

  return {
    // actions: undefined,
    isDebouncing: false,
    isRefreshed: false,
    // onSubmitError(callback: OnErrorCallbackType<ExtractError<T>>): void {},
    // onSubmitFinished(callback: OnFinishedCallbackType<ExtractFetchReturn<T>>): void {},
    // onSubmitSuccess(callback: OnSuccessCallbackType<ExtractResponse<T>>): void {},
    refresh(): void {},
    submit: handleSubmit,
    get error() {
      setRenderKey("error");
      return state.error;
    },
    get loading() {
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
    get data() {
      setRenderKey("data");
      return handleData() as (MapperResponse extends never ? ExtractResponse<T> : MapperResponse) extends never
        ? ExtractResponse<T>
        : MapperResponse extends never
        ? ExtractResponse<T>
        : MapperResponse;
    },
  };
};
