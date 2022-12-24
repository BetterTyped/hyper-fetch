import { UseSocketStateType } from "./use-socket-state.types";

export const initialSocketState: UseSocketStateType = {
  data: null,
  connected: false,
  connecting: false,
  timestamp: null,
};
