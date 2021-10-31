import { CacheValueType } from "cache";
import { initialState } from "./use-cache-state.constants";

export const getInitialCacheStateData = (initialData: CacheValueType | undefined) => ({
  ...initialState,
  data: initialData?.response?.[0] || initialState.data,
  error: initialData?.response?.[1] || initialState.error,
  status: initialData?.response?.[2] || initialState.status,
  retries: initialData?.retries || initialState.retries,
  timestamp: initialData?.timestamp || initialState.timestamp,
});
