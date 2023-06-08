import { getUniqueRequestId } from "@hyper-fetch/core";

import { SocketInstance } from "socket";
import { ListenerOptionsType } from "listener";

export const createListener = <ResponseType = any>(
  socket: SocketInstance,
  options?: Partial<ListenerOptionsType<any, any>>,
) => {
  const randomKey = getUniqueRequestId("some-event-listener") as string;
  return socket.createListener<ResponseType>()({ endpoint: randomKey, ...options });
};
