import { CacheValueType } from "cache";
import { useReducer } from "react";
import { UseCacheStateEnum, cacheStateReducer } from "./use-cache-state.constants";
import { UseCacheStateActions, UseCacheStateType } from "./use-cache-state.types";
import { getInitialCacheStateData } from "./use-cache-state.utils";

// implement DEPENDENCY TRACKING MECHANISM!!!
export const useCacheState = <DataType, ErrorType>(
  initialData: CacheValueType | undefined,
): [UseCacheStateType<DataType, ErrorType>, UseCacheStateActions<DataType, ErrorType>] => {
  const [state, dispatch] = useReducer(cacheStateReducer<DataType, ErrorType>(), getInitialCacheStateData(initialData));

  const actions: UseCacheStateActions<DataType, ErrorType> = {
    setCacheData: (cacheData) => {
      dispatch({ type: UseCacheStateEnum.setCacheData, cacheData });
    },
    setLoading: (loading) => {
      dispatch({ type: UseCacheStateEnum.setLoading, loading });
    },
    setData: (data) => {
      dispatch({ type: UseCacheStateEnum.setData, data });
    },
    setError: (error) => {
      dispatch({ type: UseCacheStateEnum.setError, error });
    },
    setRefreshed: (isRefreshed) => {
      dispatch({ type: UseCacheStateEnum.setRefreshed, isRefreshed });
    },
  };

  return [state, actions];
};
