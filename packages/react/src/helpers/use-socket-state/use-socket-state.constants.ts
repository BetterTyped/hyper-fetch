import { UseSocketStateType } from "./use-socket-state.types";

export const initialSocketState: UseSocketStateType = {
  data: null,
  emitting: false,
  listening: false,
  connected: false,
  connecting: false,
  timestamp: null,
};
