import { ListenerOptionsType } from "@hyper-fetch/sockets";

import { socket } from "./socket.utils";

export const createListener = <ResponseType = { name: string; age: number }>(
  options?: Partial<ListenerOptionsType<unknown>>,
) => {
  return socket.createListener<ResponseType>({ name: "some-event", ...options });
};
