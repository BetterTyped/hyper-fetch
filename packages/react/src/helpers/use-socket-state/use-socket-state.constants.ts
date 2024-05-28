import { SocketInstance } from "@hyper-fetch/sockets";
import { UseSocketStateType } from "./use-socket-state.types";

export const initialSocketState: UseSocketStateType<SocketInstance> = {
  data: null,
  extra: null,
  connected: false,
  connecting: false,
  timestamp: null,
};
