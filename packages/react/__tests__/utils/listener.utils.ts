import { ListenerOptionsType, AdapterType } from "@hyper-fetch/sockets";

import { socket } from "./socket.utils";

export const createListener = <ResponseType = { name: string; age: number }>(
  options?: Partial<ListenerOptionsType<AdapterType>>,
) => {
  return socket.createListener<ResponseType>({ ...options, name: "some-event" });
};
