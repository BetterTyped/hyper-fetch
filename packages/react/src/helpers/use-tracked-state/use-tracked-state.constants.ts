import { UseTrackedStateType } from "./use-tracked-state.types";

export const initialState: UseTrackedStateType = {
  data: null,
  error: null,
  status: null,
  extra: {},
  success: false,
  loading: false,
  retries: 0,
  responseTimestamp: null,
  requestTimestamp: null,
};
