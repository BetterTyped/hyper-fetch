import { getUniqueRequestId } from "@hyper-fetch/core";

import type { SocketInstance } from "socket";
import type { ListenerOptionsType } from "listener";
import type { SocketAdapterInstance } from "adapter";

export const createListener = <ResponseType = any>(
  socket: SocketInstance,
  options?: Partial<ListenerOptionsType<any, SocketAdapterInstance>>,
) => {
  const randomKey = getUniqueRequestId({ queryKey: "some-event-listener" }) as string;
  return socket.createListener<ResponseType>()({ topic: randomKey, ...options });
};
