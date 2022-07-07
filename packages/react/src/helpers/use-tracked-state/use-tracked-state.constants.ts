import { UseTrackedStateType } from "./use-tracked-state.types";

export const initialState: UseTrackedStateType = {
  data: null,
  error: null,
  loading: false,
  status: null,
  retries: 0,
  timestamp: null,
};
