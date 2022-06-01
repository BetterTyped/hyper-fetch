import { UseDependentStateType } from "./use-dependent-state.types";

export const initialState: UseDependentStateType = {
  data: null,
  error: null,
  loading: false,
  status: null,
  isRefreshed: false,
  retries: 0,
  timestamp: null,
};
