import type { SocketInstance } from "@hyper-fetch/sockets";

import type { UseSocketStateType } from "./use-socket-state.types";

export const initialSocketState: UseSocketStateType<SocketInstance> = {
  data: null,
  extra: null,
  connected: false,
  connecting: false,
  timestamp: null,
};
