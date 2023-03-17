import { UseTrackedStateType } from "./use-tracked-state.types";

export const initialState: UseTrackedStateType = {
  data: null,
  error: null,
  status: null,
  additionalData: {},
  loading: false,
  retries: 0,
  timestamp: null,
};
