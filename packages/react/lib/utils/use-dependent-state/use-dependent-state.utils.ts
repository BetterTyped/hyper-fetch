import {
  CacheValueType,
  NullableType,
  FetchCommandInstance,
  ClientResponseType,
  ExtractResponse,
  ExtractError,
} from "@better-typed/hyper-fetch";

import { initialState, UseDependentStateType } from "utils/use-dependent-state";

export const getTimestamp = (timestamp?: NullableType<number | Date>) => {
  return timestamp ? new Date(timestamp) : null;
};

export const getInitialDependentStateData = (
  command: FetchCommandInstance,
  initialData: NullableType<CacheValueType>,
  initialLoading?: boolean,
) => ({
  ...initialState,
  data: initialData?.data?.[0] || initialState.data,
  error: initialData?.data?.[1] || initialState.error,
  status: initialData?.data?.[2] || initialState.status,
  retries: initialData?.details.retries || initialState.retries,
  timestamp: getTimestamp(initialData?.details.timestamp || initialState.timestamp),
  isOnline: command.builder.appManager.isOnline,
  isFocused: command.builder.appManager.isFocused,
  loading: initialLoading ?? initialState.loading,
});

export const getDetailsState = (
  command: FetchCommandInstance,
  state?: UseDependentStateType,
  modifiers?: Partial<CacheValueType<unknown, unknown>["details"]>,
): CacheValueType<unknown, unknown>["details"] => {
  return {
    retries: state?.retries || 0,
    timestamp: new Date(),
    isFailed: false,
    isCanceled: false,
    isRefreshed: false,
    isOffline: false,
    isStopped: false,
    ...modifiers,
  };
};

export const transformDataToCacheValue = <T>(
  command: FetchCommandInstance,
  response: ClientResponseType<ExtractResponse<T>, ExtractError<T>> | null,
): NullableType<CacheValueType> => {
  if (!response) return null;
  return {
    data: response,
    details: getDetailsState(command),
    refreshError: null,
    retryError: null,
  };
};
