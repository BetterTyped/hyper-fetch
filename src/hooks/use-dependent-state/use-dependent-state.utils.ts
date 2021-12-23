import { CacheValueType } from "cache";
import { NullableType } from "types";
import { initialState } from "./use-dependent-state.constants";

export const getTimestamp = (timestamp?: NullableType<number | Date>) => {
  return timestamp ? new Date(timestamp) : null;
};

export const getInitialDependentStateData = (initialData: NullableType<CacheValueType>) => ({
  ...initialState,
  data: initialData?.response?.[0] || initialState.data,
  error: initialData?.response?.[1] || initialState.error,
  status: initialData?.response?.[2] || initialState.status,
  retries: initialData?.retries || initialState.retries,
  timestamp: getTimestamp(initialData?.timestamp || initialState.timestamp),
});
