import { UseTrackedStateType } from "./use-tracked-state.types";

export const initialState: <T>() => UseTrackedStateType<T> = () => ({
  data: null,
  error: null,
  loading: false,
  additionalData: {},
  retries: 0,
  timestamp: null,
});
