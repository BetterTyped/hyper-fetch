import { getUniqueRequestId } from "@hyper-fetch/core";

import { SocketInstance } from "socket";
import { ListenerOptionsType } from "listener";
import { SocketAdapterInstance } from "adapter";

export const createListener = <ResponseType = any>(
  socket: SocketInstance,
  options?: Partial<ListenerOptionsType<any, SocketAdapterInstance>>,
) => {
  const randomKey = getUniqueRequestId({ queryKey: "some-event-listener" }) as string;
  return socket.createListener<ResponseType>()({ topic: randomKey, ...options });
};
