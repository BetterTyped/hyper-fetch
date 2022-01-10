// import { FetchCommandInstance } from "middleware";
// import { useSubmitDefaultOptions } from "./use-submit.constants";
// import { UseSubmitOptionsType } from "./use-submit.types";

// export const useSubmit = <T extends FetchCommandInstance, MapperResponse>(
//   middleware: T,
//   {
//     disabled = useSubmitDefaultOptions.disabled,
//     queueKey = useSubmitDefaultOptions.queueKey,
//     invalidate = useSubmitDefaultOptions.invalidate,
//     retry = useSubmitDefaultOptions.retry,
//     retryTime = useSubmitDefaultOptions.retryTime,
//     cacheTime = useSubmitDefaultOptions.cacheTime,
//     cacheKey = useSubmitDefaultOptions.cacheKey,
//     cacheOnMount = useSubmitDefaultOptions.cacheOnMount,
//     initialCacheData = useSubmitDefaultOptions.initialCacheData,
//     initialData = useSubmitDefaultOptions.initialData,
//     debounce = useSubmitDefaultOptions.debounce,
//     debounceTime = useSubmitDefaultOptions.debounceTime,
//     cancelable = useSubmitDefaultOptions.cancelable,
//     deepCompareFn = useSubmitDefaultOptions.deepCompareFn,
//     mapperFn = useSubmitDefaultOptions.mapperFn,
//     shouldThrow = useSubmitDefaultOptions.shouldThrow,
//     offline = useSubmitDefaultOptions.offline,
//   }: UseSubmitOptionsType<T, MapperResponse> = useSubmitDefaultOptions,
// ) => {
//   return {
//     ...state,
//     data: handleData() as any,
//     actions,
//     onSuccess: (callback: OnSuccessCallbackType<ExtractResponse<T>>) => {
//       onSuccessCallback.current = callback;
//     },
//     onError: (callback: OnErrorCallbackType<ExtractError<T>>) => {
//       onErrorCallback.current = callback;
//     },
//     onFinished: (callback: OnFinishedCallbackType<ExtractFetchReturn<T>>) => {
//       onFinishedCallback.current = callback;
//     },
//     isRefreshed: state.isRefreshed,
//     isRefreshingError: !!state.error && state.isRefreshed,
//     isDebouncing: requestDebounce.active,
//     refresh: refreshFn,
//     submit,
//   };
// };
