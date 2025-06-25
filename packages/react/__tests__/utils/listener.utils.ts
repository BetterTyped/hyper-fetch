import { ListenerOptionsType, Socket, SocketAdapterType } from "@hyper-fetch/sockets";

export const createListener = <ResponseType = { name: string; age: number }>(
  options?: Partial<ListenerOptionsType<any, SocketAdapterType>>,
) => {
  return new Socket({ url: "ws://localhost:1234" }).createListener<ResponseType>()({
    ...options,
    topic: "some-event",
  });
};
