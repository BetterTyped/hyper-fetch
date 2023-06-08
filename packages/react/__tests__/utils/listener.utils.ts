import { ListenerOptionsType, SocketAdapterType } from "@hyper-fetch/sockets";

import { socket } from "./socket.utils";

export const createListener = <ResponseType = { name: string; age: number }>(
  options?: Partial<ListenerOptionsType<any, SocketAdapterType>>,
) => {
  return socket.createListener<ResponseType>()({ ...options, endpoint: "some-event" });
};
