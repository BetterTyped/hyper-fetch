import { getUniqueRequestId } from "@hyper-fetch/core";
import type { SocketAdapterInstance } from "adapter";
import type { ListenerOptionsType } from "listener";
import type { SocketInstance } from "socket";

export const createListener = <ResponseType = any>(
  socket: SocketInstance,
  options?: Partial<ListenerOptionsType<any, SocketAdapterInstance>>,
) => {
  const randomKey = getUniqueRequestId({ queryKey: "some-event-listener" }) as string;
  return socket.createListener<ResponseType>()({ topic: randomKey, ...options });
};
