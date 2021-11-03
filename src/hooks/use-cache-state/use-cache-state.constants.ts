import { UseCacheStateAction, UseCacheStateType } from "./use-cache-state.types";

export const UseCacheStateEnum = {
  setCacheData: "setCacheData",
  setLoading: "setLoading",
  setData: "setData",
  setError: "setError",
  setRefreshed: "setRefreshed",
  setStatus: "setStatus",
  setRetries: "setRetries",
  setTimestamp: "setTimestamp",
} as const;

export const initialState: UseCacheStateType = {
  data: null,
  error: null,
  loading: true,
  status: null,
  isRefreshed: false,
  retries: 0,
  timestamp: null,
};

export const cacheStateReducer =
  <DataType, ErrorType>() =>
  (
    state: typeof initialState,
    action: UseCacheStateAction<DataType, ErrorType>,
  ): UseCacheStateType<DataType, ErrorType> => {
    switch (action.type) {
      case UseCacheStateEnum.setCacheData:
        return {
          ...state,
          data: action.cacheData.response[0],
          error: action.cacheData.response[1],
          status: action.cacheData.response[2],
          retries: action.cacheData.retries,
          timestamp: action.cacheData.timestamp,
          isRefreshed: action.cacheData.isRefreshed,
          loading: false,
        };
      case UseCacheStateEnum.setLoading:
        return { ...state, loading: action.loading };
      case UseCacheStateEnum.setData:
        return { ...state, data: action.data };
      case UseCacheStateEnum.setError:
        return { ...state, error: action.error };
      case UseCacheStateEnum.setRefreshed:
        return { ...state, isRefreshed: action.isRefreshed };
      case UseCacheStateEnum.setStatus:
        return { ...state, status: action.status };
      default:
        throw new Error("Wrong reducer action!");
    }
  };
